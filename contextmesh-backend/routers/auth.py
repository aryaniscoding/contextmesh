"""Authentication router — Create Team and Join Team endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from slugify import slugify

from db.database import get_db
from db.models import Team, Member
from db.schemas import (
    CreateTeamRequest, CreateTeamResponse,
    JoinTeamRequest, JoinTeamResponse,
)
import uuid
from services.passcode import generate_passcode, hash_passcode, verify_passcode

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/create-team", response_model=CreateTeamResponse)
def create_team(req: CreateTeamRequest, db: Session = Depends(get_db)):
    """
    Admin creates a new team.
    Generates a slugified team ID and a WORD-NN-WORD passcode.
    """
    team_id = slugify(req.team_name)

    # Check if team already exists
    existing = db.query(Team).filter(Team.id == team_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="A team with this name already exists")

    # Generate passcode
    passcode = generate_passcode()
    hashed = hash_passcode(passcode)

    # Create team
    team = Team(
        id=team_id,
        name=req.team_name.strip(),
        passcode_hash=hashed,
        admin_name=req.admin_name.strip(),
    )
    db.add(team)
    db.flush()  # Ensure team is inserted before member to satisfy foreign key

    # Add admin as first member
    member = Member(team_id=team_id, name=req.admin_name.strip())
    db.add(member)

    db.commit()

    return CreateTeamResponse(team_id=team_id, passcode=passcode)


@router.post("/join-team", response_model=JoinTeamResponse)
def join_team(req: JoinTeamRequest, db: Session = Depends(get_db)):
    """
    Member joins a team using the passcode.
    Iterates all teams and checks bcrypt hash match.
    """
    # Find team by passcode (check all teams)
    teams = db.query(Team).all()
    matched_team = None
    for t in teams:
        if verify_passcode(req.passcode.strip().upper(), t.passcode_hash):
            matched_team = t
            break

    if not matched_team:
        raise HTTPException(status_code=401, detail="Invalid passcode")

    # Check if member already exists
    existing_member = (
        db.query(Member)
        .filter(Member.team_id == matched_team.id, Member.name == req.member_name.strip())
        .first()
    )
    if not existing_member:
        member = Member(team_id=matched_team.id, name=req.member_name.strip())
        db.add(member)
        db.commit()

    # Get all members
    all_members = (
        db.query(Member.name)
        .filter(Member.team_id == matched_team.id)
        .all()
    )
    member_names = [m[0] for m in all_members]

    # Generate a simple token for CLI MVP
    cli_token = f"ctx_{uuid.uuid4().hex}"

    return JoinTeamResponse(
        team_id=matched_team.id,
        team_name=matched_team.name,
        member=req.member_name.strip(),
        all_members=member_names,
        token=cli_token,
    )
