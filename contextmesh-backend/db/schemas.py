"""Pydantic request/response schemas for ContextMesh API."""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ─── Auth Schemas ───

class CreateTeamRequest(BaseModel):
    team_name: str = Field(..., min_length=3, description="Display name for the team")
    admin_name: str = Field(..., min_length=2, description="Name of the team admin")


class CreateTeamResponse(BaseModel):
    team_id: str
    passcode: str  # plain text, only shown once
    message: str = "Team created successfully"


class JoinTeamRequest(BaseModel):
    passcode: str = Field(..., description="Team passcode")
    member_name: str = Field(..., min_length=2, description="Your display name")


class JoinTeamResponse(BaseModel):
    team_id: str
    team_name: str
    member: str
    all_members: List[str]
    token: Optional[str] = None


class ErrorResponse(BaseModel):
    error: str


# ─── Context Schemas ───

class SaveContextRequest(BaseModel):
    team_id: str
    member_name: str
    messages: List[dict]  # full chat history
    files_modified: List[str] = []
    is_private: bool = False


class SaveContextResponse(BaseModel):
    session_id: int
    saved: bool = True


class SessionOut(BaseModel):
    id: int
    created_at: datetime
    messages: list
    decisions: list
    questions: list
    files: list
    is_private: bool

    class Config:
        from_attributes = True


class MemberContextResponse(BaseModel):
    member: str
    sessions: List[SessionOut]


class MarkPrivateRequest(BaseModel):
    is_private: bool = True


class MarkPrivateResponse(BaseModel):
    session_id: int
    is_private: bool
    updated: bool = True


# ─── Master Context Schemas ───

class MasterContextResponse(BaseModel):
    version: int
    updated_at: Optional[datetime] = None
    decisions: List[dict] = []
    in_progress: List[dict] = []
    open_questions: List[dict] = []
    conflicts: List[dict] = []
