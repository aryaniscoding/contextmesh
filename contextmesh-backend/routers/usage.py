"""Usage tracking router — Per-user cost and token tracking for managers."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID

from db.database import get_db
from db.models import TeamMembership, User
from db.schemas import TeamUsageResponse, MyUsageResponse
from middleware.auth import get_current_user
from services.usage import get_team_usage, get_user_usage

router = APIRouter(prefix="/usage", tags=["Usage & Costs"])


@router.get("/team", response_model=TeamUsageResponse)
def team_usage(
    team_id: str = Query(...),
    days: int = Query(30, ge=1, le=365),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get aggregated usage per user for a team.
    Only admins can view team-wide usage.
    """
    membership = (
        db.query(TeamMembership)
        .filter(TeamMembership.team_id == team_id, TeamMembership.user_id == user.id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="You are not a member of this team")
    if membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view team usage")

    data = get_team_usage(db, team_id, days)
    return TeamUsageResponse(**data)


@router.get("/me", response_model=MyUsageResponse)
def my_usage(
    team_id: str = Query(...),
    days: int = Query(30, ge=1, le=365),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current user's own usage for a team."""
    membership = (
        db.query(TeamMembership)
        .filter(TeamMembership.team_id == team_id, TeamMembership.user_id == user.id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="You are not a member of this team")

    data = get_user_usage(db, team_id, user.id, days)
    return MyUsageResponse(**data)
