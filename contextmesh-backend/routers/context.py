"""Context Store router — Save, Get, and Privacy endpoints."""
import asyncio
import threading
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.database import get_db, SessionLocal
from db.models import Team, ContextSession
from db.schemas import (
    SaveContextRequest, SaveContextResponse,
    MemberContextResponse, SessionOut,
    MarkPrivateRequest, MarkPrivateResponse,
)
from services.aggregator import synthesize_master_context

router = APIRouter(prefix="/context", tags=["Context"])


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
def save_context(req: SaveContextRequest, db: Session = Depends(get_db)):
    """
    Save a completed AI session.
    Called by the MCP server after every session ends.
    """
    # Validate team exists
    team = db.query(Team).filter(Team.id == req.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Quick extraction — for now, store decisions/questions from messages
    # In Phase 3, LLM extraction is added here
    decisions = []
    questions = []

    session = ContextSession(
        team_id=req.team_id,
        member_name=req.member_name,
        messages=req.messages,
        files=req.files_modified,
        decisions=decisions,
        questions=questions,
        is_private=req.is_private,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Trigger master context synthesis in background
    if not req.is_private:
        _trigger_synthesis(req.team_id)

    return SaveContextResponse(session_id=session.id)


@router.get("/member", response_model=MemberContextResponse)
def get_member_context(
    team_id: str = Query(..., description="Team ID"),
    member: str = Query(..., description="Member name"),
    db: Session = Depends(get_db),
):
    """
    Get all non-private sessions for a specific team member.
    Called by frontend when 'View Context' or 'Load into AI' is clicked.
    """
    sessions = (
        db.query(ContextSession)
        .filter(
            ContextSession.team_id == team_id,
            ContextSession.member_name == member,
            ContextSession.is_private == False,
        )
        .order_by(ContextSession.created_at.desc())
        .all()
    )

    session_list = [
        SessionOut(
            id=s.id,
            created_at=s.created_at,
            messages=s.messages or [],
            decisions=s.decisions or [],
            questions=s.questions or [],
            files=s.files or [],
            is_private=s.is_private,
        )
        for s in sessions
    ]

    return MemberContextResponse(member=member, sessions=session_list)


@router.patch("/session/{session_id}/private", response_model=MarkPrivateResponse)
def mark_session_private(
    session_id: int,
    req: MarkPrivateRequest,
    db: Session = Depends(get_db),
):
    """
    Mark a session as private.
    Private sessions are excluded from Master Context and peer loading.
    """
    session = db.query(ContextSession).filter(ContextSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.is_private = req.is_private
    db.commit()

    return MarkPrivateResponse(session_id=session_id, is_private=req.is_private)


@router.get("/all")
def get_all_team_context(
    team_id: str = Query(..., description="Team ID"),
    db: Session = Depends(get_db),
):
    """
    Get ALL non-private sessions for the entire team.
    Used by the frontend 'View All Prompts' feature.
    """
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
                "created_at": s.created_at.isoformat(),
                "messages": s.messages or [],
                "files": s.files or [],
                "is_private": s.is_private,
            }
            for s in sessions
        ],
    }
