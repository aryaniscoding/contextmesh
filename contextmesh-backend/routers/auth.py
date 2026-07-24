"""Authentication router — Create Team, Join Team, My Teams (Supabase Auth)."""
import hashlib
import secrets
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from slugify import slugify
from uuid import UUID

from db.database import get_db
from db.models import Team, User, TeamMembership, CLIToken
from db.schemas import (
    CreateTeamRequest, CreateTeamResponse,
    JoinTeamRequest, JoinTeamResponse,
    CLIJoinRequest, CLIJoinResponse,
    MyTeamsResponse, TeamInfo, TeamDetailResponse,
    PromoteMemberRequest,
)
from middleware.auth import get_current_user, get_current_user_id
from services.passcode import generate_passcode, hash_passcode, verify_passcode

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return {
        "user_id": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
    }


@router.get("/my-teams", response_model=MyTeamsResponse)
def get_my_teams(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all teams the authenticated user belongs to."""
    memberships = (
        db.query(TeamMembership, Team)
        .join(Team, Team.id == TeamMembership.team_id)
        .filter(TeamMembership.user_id == user.id)
        .all()
    )

    teams = []
    for membership, team in memberships:
        member_count = (
            db.query(TeamMembership).filter(TeamMembership.team_id == team.id).count()
            + db.query(CLIToken).filter(CLIToken.team_id == team.id).count()
        )
        teams.append(TeamInfo(
            team_id=team.id,
            team_name=team.name,
            role=membership.role,
            member_count=member_count,
        ))

    return MyTeamsResponse(teams=teams)


@router.get("/team-info", response_model=TeamDetailResponse)
def get_team_info(
    team_id: str = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return team details + members list. User must be a member."""
    # Verify membership
    membership = (
        db.query(TeamMembership)
        .filter(TeamMembership.team_id == team_id, TeamMembership.user_id == user.id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="You are not a member of this team")

    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    members_data = (
        db.query(User, TeamMembership)
        .join(TeamMembership, TeamMembership.user_id == User.id)
        .filter(TeamMembership.team_id == team_id)
        .all()
    )

    members = [
        {
            "user_id": str(u.id),
            "name": u.display_name,
            "email": u.email,
            "role": m.role,
            "joined_at": m.joined_at.isoformat() if m.joined_at else None,
        }
        for u, m in members_data
    ]

    # Include CLI-only members (not linked to a Supabase user)
    cli_tokens = db.query(CLIToken).filter(CLIToken.team_id == team_id).all()
    seen_names = {m["name"] for m in members}
    for ct in cli_tokens:
        if ct.member_name not in seen_names:
            members.append({
                "user_id": f"cli-{ct.id}",
                "name": ct.member_name,
                "email": "CLI user",
                "role": "member",
                "joined_at": ct.created_at.isoformat() if ct.created_at else None,
            })
            seen_names.add(ct.member_name)

    return TeamDetailResponse(
        team_id=team.id,
        team_name=team.name,
        members=members,
    )


@router.post("/create-team", response_model=CreateTeamResponse)
def create_team(
    req: CreateTeamRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new team. The authenticated user becomes the admin."""
    team_id = slugify(req.team_name)

    existing = db.query(Team).filter(Team.id == team_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="A team with this name already exists")

    passcode = generate_passcode()
    hashed = hash_passcode(passcode)

    team = Team(
        id=team_id,
        name=req.team_name.strip(),
        passcode_hash=hashed,
        passcode_plain=passcode,
    )
    db.add(team)
    db.flush()

    # Add creator as admin
    membership = TeamMembership(
        user_id=user.id,
        team_id=team_id,
        role="admin",
    )
    db.add(membership)
    db.commit()

    return CreateTeamResponse(team_id=team_id, passcode=passcode)


@router.post("/join-team", response_model=JoinTeamResponse)
def join_team(
    req: JoinTeamRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Join a team using the passcode. Requires authentication."""
    teams = db.query(Team).all()
    matched_team = None
    for t in teams:
        if verify_passcode(req.passcode.strip().upper(), t.passcode_hash):
            matched_team = t
            break

    if not matched_team:
        raise HTTPException(status_code=401, detail="Invalid passcode")

    # Check if already a member
    existing = (
        db.query(TeamMembership)
        .filter(TeamMembership.team_id == matched_team.id, TeamMembership.user_id == user.id)
        .first()
    )
    if not existing:
        membership = TeamMembership(
            user_id=user.id,
            team_id=matched_team.id,
            role="member",
        )
        db.add(membership)
        db.commit()

    # Get all members
    members_data = (
        db.query(User, TeamMembership)
        .join(TeamMembership, TeamMembership.user_id == User.id)
        .filter(TeamMembership.team_id == matched_team.id)
        .all()
    )

    all_members = [
        {
            "name": u.display_name,
            "email": u.email,
            "role": m.role,
        }
        for u, m in members_data
    ]

    return JoinTeamResponse(
        team_id=matched_team.id,
        team_name=matched_team.name,
        member=user.display_name,
        role=existing.role if existing else "member",
        all_members=all_members,
    )


@router.post("/promote-member")
def promote_member(
    team_id: str,
    req: PromoteMemberRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Promote or demote a team member. Only admins can do this."""
    # Verify caller is admin
    caller_membership = (
        db.query(TeamMembership)
        .filter(TeamMembership.team_id == team_id, TeamMembership.user_id == user.id)
        .first()
    )
    if not caller_membership or caller_membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can change roles")

    target_membership = (
        db.query(TeamMembership)
        .filter(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == UUID(req.target_user_id),
        )
        .first()
    )
    if not target_membership:
        raise HTTPException(status_code=404, detail="Member not found in this team")

    if req.role not in ("admin", "member"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'member'")

    target_membership.role = req.role
    db.commit()

    return {"updated": True, "user_id": req.target_user_id, "new_role": req.role}


@router.get("/team-passcode")
def get_team_passcode(
    team_id: str = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the team passcode. Only admins can view this."""
    membership = (
        db.query(TeamMembership)
        .filter(TeamMembership.team_id == team_id, TeamMembership.user_id == user.id)
        .first()
    )
    if not membership or membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view the passcode")

    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if not team.passcode_plain:
        raise HTTPException(status_code=404, detail="Passcode not available")

    return {"passcode": team.passcode_plain}


@router.post("/cli-join", response_model=CLIJoinResponse)
def cli_join_team(
    req: CLIJoinRequest,
    db: Session = Depends(get_db),
):
    """
    CLI-specific join endpoint — no Supabase JWT required.
    Authenticates via team passcode and returns a simple token for CLI API calls.
    """
    teams = db.query(Team).all()
    matched_team = None
    for t in teams:
        if verify_passcode(req.passcode.strip().upper(), t.passcode_hash):
            matched_team = t
            break

    if not matched_team:
        raise HTTPException(status_code=401, detail="Invalid passcode")

    # Generate and store CLI token
    cli_secret = secrets.token_hex(16)
    token = hashlib.sha256(
        f"{matched_team.id}:{req.member_name}:{cli_secret}".encode()
    ).hexdigest()

    cli_token = CLIToken(
        token=token,
        team_id=matched_team.id,
        member_name=req.member_name.strip(),
    )
    db.add(cli_token)
    db.commit()

    return CLIJoinResponse(
        team_id=matched_team.id,
        team_name=matched_team.name,
        member=req.member_name.strip(),
        role="member",
        token=token,
    )
