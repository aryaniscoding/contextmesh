"""SQLAlchemy table definitions for ContextMesh v2."""
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text,
    ForeignKey, Float, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

from db.database import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(String, primary_key=True)                # slugified e.g. 'acme-engineering'
    name = Column(String, nullable=False)                  # display name
    passcode_hash = Column(String, nullable=False)         # SHA-256 hashed passcode
    passcode_plain = Column(String, nullable=True)         # plain passcode for admin viewing
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    """Linked to Supabase Auth — auto-created by DB trigger on signup."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True)      # Supabase auth user UUID
    email = Column(String, unique=True, nullable=False)
    display_name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TeamMembership(Base):
    """Junction table: users ↔ teams (replaces old 'members' table)."""
    __tablename__ = "team_memberships"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(String, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False, default="member")   # "admin" | "member"
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("user_id", "team_id"),)


class CLIToken(Base):
    """Stores CLI authentication tokens for non-Supabase access."""
    __tablename__ = "cli_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    token = Column(String, unique=True, nullable=False, index=True)
    team_id = Column(String, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    member_name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ContextSession(Base):
    __tablename__ = "context_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    team_id = Column(String, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    member_name = Column(String, nullable=False)               # display name snapshot
    messages = Column(JSONB, default=list)
    files = Column(JSONB, default=list)
    decisions = Column(JSONB, default=list)
    questions = Column(JSONB, default=list)
    is_private = Column(Boolean, default=False)
    embedding = Column(Vector(768), nullable=True)             # Gemini text-embedding-004
    embedding_text = Column(Text, nullable=True)               # condensed text that was embedded
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MasterContext(Base):
    __tablename__ = "master_context"

    id = Column(Integer, primary_key=True, autoincrement=True)
    team_id = Column(String, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    content = Column(JSONB, default=dict)
    version = Column(Integer, default=1)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class UsageLog(Base):
    """Tracks every LLM API call for cost attribution."""
    __tablename__ = "usage_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    team_id = Column(String, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    member_name = Column(String, nullable=True)                # set for CLI users (no user_id)
    action = Column(String, nullable=False)                    # "embedding" | "synthesis" | "search" | "ai_usage"
    model_name = Column(String, nullable=False)
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    estimated_cost_usd = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
