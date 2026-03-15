"""Context Store router — Save, Get, and Privacy endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import Team, ContextSession
from db.schemas import (
    SaveContextRequest, SaveContextResponse,
    MemberContextResponse, SessionOut,
    MarkPrivateRequest, MarkPrivateResponse,
)

router = APIRouter(prefix="/context", tags=["Context"])


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
