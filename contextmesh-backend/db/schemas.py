"""Pydantic request/response schemas for ContextMesh API v2."""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID


# ─── Auth Schemas ───

class CreateTeamRequest(BaseModel):
    team_name: str = Field(..., min_length=3, description="Display name for the team")


class CreateTeamResponse(BaseModel):
    team_id: str
    passcode: str  # plain text, only shown once
    message: str = "Team created successfully"


class JoinTeamRequest(BaseModel):
    passcode: str = Field(..., description="Team passcode")


class JoinTeamResponse(BaseModel):
    team_id: str
    team_name: str
    member: str
    role: str
    all_members: List[dict]


class TeamInfo(BaseModel):
    team_id: str
    team_name: str
    role: str
    member_count: int


class MyTeamsResponse(BaseModel):
    teams: List[TeamInfo]


class TeamDetailResponse(BaseModel):
    team_id: str
    team_name: str
    members: List[dict]  # [{name, email, role, joined_at}]


class CLIJoinRequest(BaseModel):
    passcode: str = Field(..., description="Team passcode")
    member_name: str = Field(..., min_length=2, description="Display name for the CLI user")


class CLIJoinResponse(BaseModel):
    team_id: str
    team_name: str
    member: str
    role: str
    token: str  # simple token for CLI API calls


class PromoteMemberRequest(BaseModel):
    target_user_id: str
    role: str = Field("admin", description="Role to set: 'admin' or 'member'")


class ErrorResponse(BaseModel):
    error: str


# ─── Context Schemas ───

class SaveContextRequest(BaseModel):
    team_id: str
    messages: List[dict]
    files_modified: List[str] = []
    is_private: bool = False
    model_name: Optional[str] = None  # e.g. "claude-sonnet-4-5", "gpt-4o"


class SaveContextResponse(BaseModel):
    session_id: int
    saved: bool = True


class SessionOut(BaseModel):
    id: int
    created_at: datetime
    member_name: str
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


# ─── Search Schemas ───

class SearchRequest(BaseModel):
    team_id: str
    query: str = Field(..., min_length=2, description="Natural language search query")
    limit: int = Field(10, ge=1, le=50)


class SearchResult(BaseModel):
    session_id: int
    member_name: str
    similarity: float
    preview: str
    files: list
    created_at: datetime


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total: int


# ─── Master Context Schemas ───

class MasterContextResponse(BaseModel):
    version: int
    updated_at: Optional[datetime] = None
    decisions: List[dict] = []
    in_progress: List[dict] = []
    open_questions: List[dict] = []
    conflicts: List[dict] = []


# ─── Usage Schemas ───

class UserUsage(BaseModel):
    user_id: str
    display_name: str
    email: str
    total_requests: int
    input_tokens: int
    output_tokens: int
    estimated_cost_usd: float
    breakdown: List[dict] = []  # [{action, count, tokens, cost}]


class TeamUsageResponse(BaseModel):
    team_id: str
    period_days: int
    total_cost_usd: float
    total_tokens: int
    users: List[UserUsage]


class MyUsageResponse(BaseModel):
    total_requests: int
    input_tokens: int
    output_tokens: int
    estimated_cost_usd: float
    breakdown: List[dict] = []
