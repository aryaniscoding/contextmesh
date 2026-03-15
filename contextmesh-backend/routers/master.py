"""Master Context router — Get synthesized team context."""
import os
import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import MasterContext
from db.schemas import MasterContextResponse

router = APIRouter(tags=["Master Context"])

# Optional Redis caching
_redis_client = None
try:
    import redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    _redis_client.ping()  # Test connection
except Exception:
    _redis_client = None  # Redis not available, fallback to DB only


@router.get("/master-context", response_model=MasterContextResponse)
def get_master_context(
    team_id: str = Query(..., description="Team ID"),
    db: Session = Depends(get_db),
):
    """
    Get the latest synthesized Master Context for a team.
    Checks Redis cache first, falls back to database.
    Called by MCP server at start of every AI session,
    and by the frontend right panel.
    """
    # Try Redis cache first
    if _redis_client:
        try:
            cached = _redis_client.get(f"master_context:{team_id}")
            if cached:
                data = json.loads(cached)
                return MasterContextResponse(**data)
        except Exception:
            pass  # Redis error, fallback to DB

    # Read from database
    mc = (
        db.query(MasterContext)
        .filter(MasterContext.team_id == team_id)
        .order_by(MasterContext.version.desc())
        .first()
    )

    if not mc:
        # No master context yet — return empty structure
        return MasterContextResponse(
            version=0,
            updated_at=None,
            decisions=[],
            in_progress=[],
            open_questions=[],
            conflicts=[],
        )

    content = mc.content or {}
    response_data = {
        "version": mc.version,
        "updated_at": mc.updated_at.isoformat() if mc.updated_at else None,
        "decisions": content.get("decisions", []),
        "in_progress": content.get("in_progress", []),
        "open_questions": content.get("open_questions", []),
        "conflicts": content.get("conflicts", []),
    }

    # Cache in Redis for 35 minutes
    if _redis_client:
        try:
            _redis_client.setex(
                f"master_context:{team_id}",
                2100,  # 35 minutes
                json.dumps(response_data, default=str),
            )
        except Exception:
            pass

    return MasterContextResponse(**response_data)
