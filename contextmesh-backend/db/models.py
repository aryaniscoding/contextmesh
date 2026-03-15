"""SQLAlchemy table definitions for ContextMesh."""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from db.database import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(String, primary_key=True)            # slugified team ID e.g. 'acme-engineering'
    name = Column(String, nullable=False)              # display name e.g. 'Acme Engineering'
    passcode_hash = Column(String, nullable=False)     # bcrypt hashed passcode
    admin_name = Column(String, nullable=False)        # name of creator
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    team_id = Column(String, ForeignKey("teams.id"), nullable=False)
    name = Column(String, nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())


class ContextSession(Base):
    __tablename__ = "context_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    team_id = Column(String, ForeignKey("teams.id"), nullable=False)
    member_name = Column(String, nullable=False)
    messages = Column(JSON, default=list)              # full chat history as JSON
    files = Column(JSON, default=list)                 # files mentioned
    decisions = Column(JSON, default=list)             # extracted decisions
    questions = Column(JSON, default=list)             # open questions found
    is_private = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MasterContext(Base):
    __tablename__ = "master_context"

    id = Column(Integer, primary_key=True, autoincrement=True)
    team_id = Column(String, ForeignKey("teams.id"), nullable=False)
    content = Column(JSON, default=dict)               # synthesized context as JSON
    version = Column(Integer, default=1)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
