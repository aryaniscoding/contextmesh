"""Context Store router — Save, Get, Search, and Privacy endpoints."""
import asyncio
import threading
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, or_
from uuid import UUID

from db.database import get_db, SessionLocal
from db.models import Team, User, TeamMembership, ContextSession
from db.schemas import (
    SaveContextRequest, SaveContextResponse,
    MemberContextResponse, SessionOut,
    MarkPrivateRequest, MarkPrivateResponse,
    SearchRequest, SearchResponse, SearchResult,
)
from middleware.auth import get_current_user, get_caller, CLICaller
from services.aggregator import synthesize_master_context
from services.embeddings import (
    prepare_session_text, generate_embedding,
    generate_query_embedding, estimate_embedding_tokens,
)
from services.usage import log_usage, count_message_tokens
from services.handoff import generate_handoff

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/context", tags=["Context"])


from typing import Union

def _verify_membership(db: Session, caller: Union[User, CLICaller], team_id: str):
    """Verify caller is a member of the team, or raise 403."""
    if isinstance(caller, CLICaller):
        # CLI tokens are scoped to a team already
        if caller.team_id != team_id:
            raise HTTPException(status_code=403, detail="CLI token not valid for this team")
        return None
    membership = (
        db.query(TeamMembership)
        .filter(TeamMembership.team_id == team_id, TeamMembership.user_id == caller.id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="You are not a member of this team")
    return membership


def _trigger_synthesis(team_id: str):
    """Run master context synthesis in a background thread."""
    def _run():
        db = SessionLocal()
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(synthesize_master_context(team_id, db))
            loop.close()
        except Exception:
            pass
        finally:
            db.close()
    threading.Thread(target=_run, daemon=True).start()


@router.post("/save", response_model=SaveContextResponse)
async def save_context(
    req: SaveContextRequest,
    caller: Union[User, CLICaller] = Depends(get_caller),
    db: Session = Depends(get_db),
):
    """Save a completed AI session with embedding generation."""
    team = db.query(Team).filter(Team.id == req.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    _verify_membership(db, caller, req.team_id)

    is_cli = isinstance(caller, CLICaller)
    display_name = caller.display_name if is_cli else caller.display_name
    user_id = None if is_cli else caller.id

    # Create session record
    session = ContextSession(
        team_id=req.team_id,
        user_id=user_id,
        member_name=display_name,
        messages=req.messages,
        files=req.files_modified,
        decisions=[],
        questions=[],
        is_private=req.is_private,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Log AI usage from the saved conversation
    if req.model_name:
        input_t, output_t = count_message_tokens(req.messages)
        log_usage(
            db, req.team_id, user_id,
            action="ai_usage",
            model_name=req.model_name,
            input_tokens=input_t,
            output_tokens=output_t,
            member_name=display_name if is_cli else None,
        )

    # Generate embedding asynchronously
    if not req.is_private:
        embed_text = prepare_session_text(req.messages, req.files_modified, display_name)
        embedding = await generate_embedding(embed_text)

        if embedding:
            session.embedding = embedding
            session.embedding_text = embed_text
            db.commit()

            # Log embedding usage
            token_count = estimate_embedding_tokens(embed_text)
            log_usage(
                db, req.team_id, user_id,
                action="embedding",
                model_name="text-embedding-004",
                input_tokens=token_count,
            )

        # Trigger master context synthesis
        _trigger_synthesis(req.team_id)

    return SaveContextResponse(session_id=session.id)


@router.get("/member", response_model=MemberContextResponse)
def get_member_context(
    team_id: str = Query(...),
    member_user_id: str = Query(None, description="User ID of the member to view"),
    member: str = Query(None, description="Member name (legacy, for backwards compat)"),
    caller: Union[User, CLICaller] = Depends(get_caller),
    db: Session = Depends(get_db),
):
    """Get all non-private sessions for a specific team member."""
    _verify_membership(db, caller, team_id)

    is_cli = isinstance(caller, CLICaller)

    query = db.query(ContextSession).filter(
        ContextSession.team_id == team_id,
        ContextSession.is_private == False,
    )

    if member_user_id:
        # Look up user's display_name so we can also match CLI sessions saved under their name
        target_user = db.query(User).filter(User.id == UUID(member_user_id)).first()
        display_name = target_user.display_name if target_user else member_user_id
        # Match sessions by user_id (web) OR by member_name (CLI saved under same name)
        query = query.filter(
            or_(
                ContextSession.user_id == UUID(member_user_id),
                ContextSession.member_name == display_name,
            )
        )
    elif member:
        query = query.filter(ContextSession.member_name == member)
        display_name = member
    else:
        # Default: own sessions (including private)
        if is_cli:
            query = db.query(ContextSession).filter(
                ContextSession.team_id == team_id,
                ContextSession.member_name == caller.display_name,
            )
            display_name = caller.display_name
        else:
            query = db.query(ContextSession).filter(
                ContextSession.team_id == team_id,
                ContextSession.user_id == caller.id,
            )
            display_name = caller.display_name

    sessions = query.order_by(ContextSession.created_at.desc()).all()

    session_list = [
        SessionOut(
            id=s.id,
            created_at=s.created_at,
            member_name=s.member_name,
            messages=s.messages or [],
            decisions=s.decisions or [],
            questions=s.questions or [],
            files=s.files or [],
            is_private=s.is_private,
        )
        for s in sessions
    ]

    return MemberContextResponse(member=display_name, sessions=session_list)


@router.patch("/session/{session_id}/private", response_model=MarkPrivateResponse)
def mark_session_private(
    session_id: int,
    req: MarkPrivateRequest,
    caller: Union[User, CLICaller] = Depends(get_caller),
    db: Session = Depends(get_db),
):
    """Mark a session as private. Only the session owner can do this."""
    session = db.query(ContextSession).filter(ContextSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    is_cli = isinstance(caller, CLICaller)
    if is_cli:
        if session.member_name != caller.display_name:
            raise HTTPException(status_code=403, detail="You can only change privacy on your own sessions")
    elif session.user_id != caller.id:
        raise HTTPException(status_code=403, detail="You can only change privacy on your own sessions")

    session.is_private = req.is_private
    db.commit()

    return MarkPrivateResponse(session_id=session_id, is_private=req.is_private)


@router.get("/all")
def get_all_team_context(
    team_id: str = Query(...),
    caller: Union[User, CLICaller] = Depends(get_caller),
    db: Session = Depends(get_db),
):
    """Get ALL non-private sessions for the entire team."""
    _verify_membership(db, caller, team_id)

    sessions = (
        db.query(ContextSession)
        .filter(
            ContextSession.team_id == team_id,
            ContextSession.is_private == False,
        )
        .order_by(ContextSession.created_at.desc())
        .limit(100)
        .all()
    )

    return {
        "team_id": team_id,
        "sessions": [
            {
                "id": s.id,
                "member_name": s.member_name,
                "user_id": str(s.user_id),
                "created_at": s.created_at.isoformat(),
                "messages": s.messages or [],
                "files": s.files or [],
                "is_private": s.is_private,
            }
            for s in sessions
        ],
    }


@router.post("/search", response_model=SearchResponse)
async def search_context(
    req: SearchRequest,
    caller: Union[User, CLICaller] = Depends(get_caller),
    db: Session = Depends(get_db),
):
    """Semantic search across team context sessions using pgvector."""
    _verify_membership(db, caller, req.team_id)

    # Generate query embedding
    query_embedding = await generate_query_embedding(req.query)
    if not query_embedding:
        raise HTTPException(status_code=500, detail="Failed to generate search embedding")

    is_cli = isinstance(caller, CLICaller)
    # Log search usage
    token_count = estimate_embedding_tokens(req.query)
    log_usage(
        db, req.team_id, None if is_cli else caller.id,
        action="search",
        model_name="text-embedding-004",
        input_tokens=token_count,
    )

    # Perform pgvector cosine similarity search
    embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

    sql = text("""
        SELECT
            id, member_name, files, created_at, embedding_text,
            1 - (embedding <=> :embedding::vector) AS similarity
        FROM context_sessions
        WHERE team_id = :team_id
          AND is_private = false
          AND embedding IS NOT NULL
        ORDER BY embedding <=> :embedding::vector
        LIMIT :limit
    """)

    rows = db.execute(sql, {
        "embedding": embedding_str,
        "team_id": req.team_id,
        "limit": req.limit,
    }).fetchall()

    results = [
        SearchResult(
            session_id=row.id,
            member_name=row.member_name,
            similarity=round(float(row.similarity), 4),
            preview=(row.embedding_text or "")[:200],
            files=row.files or [],
            created_at=row.created_at,
        )
        for row in rows
    ]

    return SearchResponse(
        query=req.query,
        results=results,
        total=len(results),
    )


@router.get("/handoff")
async def get_handoff_snapshot(
    team_id: str = Query(...),
    member_user_id: str = Query(None, description="Supabase user ID of the member"),
    member_name: str = Query(None, description="CLI member name"),
    caller: Union[User, CLICaller] = Depends(get_caller),
    db: Session = Depends(get_db),
):
    """
    Generate a handoff snapshot for a leaving team member.
    Admin-only. Returns a structured AI-ready document.
    """
    # Only admins can generate handoffs
    if isinstance(caller, CLICaller):
        raise HTTPException(status_code=403, detail="Admins only")
    membership = db.query(TeamMembership).filter(
        TeamMembership.team_id == team_id,
        TeamMembership.user_id == caller.id,
    ).first()
    if not membership or membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only team admins can generate handoff snapshots")

    if not member_user_id and not member_name:
        raise HTTPException(status_code=400, detail="Provide member_user_id or member_name")

    try:
        snapshot = await generate_handoff(db, team_id, member_user_id, member_name)
        return snapshot
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
