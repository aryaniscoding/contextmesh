"""Database connection setup for ContextMesh backend — Supabase Postgres."""
import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/contextmesh",
)

logger.info(f"Connecting to database host: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'unknown'}")

# Cloud-ready engine config
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # reconnect dropped connections
    pool_size=5,
    max_overflow=10,
    pool_recycle=300,         # recycle connections every 5 min
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
