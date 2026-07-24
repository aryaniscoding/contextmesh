"""
LLM Aggregation Engine — Synthesizes Master Context from team sessions.
Uses Google Gemini API to read all non-private sessions
and produce a structured team knowledge base.
"""
import os
import json
import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session
from db.models import ContextSession, MasterContext
from services.locks import try_advisory_lock

logger = logging.getLogger(__name__)

# ─── LLM Prompt ───
SYSTEM_PROMPT = """You are a technical context synthesizer for an engineering team.
Given multiple AI chat sessions from different team members,
extract and synthesize a clean Master Context.

Return a JSON object with exactly these keys:
{
  "decisions": [{ "text": "...", "made_by": "...", "confidence": 0.0 }],
  "in_progress": [{ "task": "...", "member": "...", "files": [] }],
  "open_questions": [{ "question": "...", "flagged_by": "..." }],
  "conflicts": [
    { "topic": "...", "member_a": "...", "says_a": "...", "member_b": "...", "says_b": "..." }
  ]
}

Only include things explicitly mentioned. Do not invent anything.
Return ONLY valid JSON, no markdown fences or explanation."""


def build_user_prompt(sessions_by_member: dict) -> str:
    """Build the user prompt from grouped sessions."""
    parts = ["Here are recent AI sessions from the team:\n"]
    for member, sessions in sessions_by_member.items():
        parts.append(f"\n[MEMBER: {member}]")
        for i, session in enumerate(sessions, 1):
            messages_text = ""
            for msg in (session.messages or [])[:20]:  # Limit to 20 messages per session
                role = msg.get("role", "unknown")
                content = msg.get("content", "")[:500]  # Truncate long messages
                messages_text += f"  {role}: {content}\n"
            parts.append(f"Session {i}:\n{messages_text}")
    return "\n".join(parts)


async def synthesize_master_context(team_id: str, db: Session) -> Optional[dict]:
    """
    Run the LLM synthesis pipeline for a team.

    Held behind a per-team advisory lock because two callers can arrive at once:
    the 30-minute scheduler on any backend instance, and the thread save_context
    spawns after every save. Without the lock both read the same latest version
    and write the same next one, so the team ends up with duplicate versions
    from duplicate Gemini calls.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key.startswith("your-gemini"):
        logger.warning("No valid Gemini API key configured, skipping synthesis")
        return None

    with try_advisory_lock(f"synthesize_master_context:{team_id}") as acquired:
        if not acquired:
            logger.info(
                f"Synthesis for team {team_id} already in progress elsewhere, skipping"
            )
            return None
        return await _run_synthesis(team_id, db, api_key)


async def _run_synthesis(team_id: str, db: Session, api_key: str) -> Optional[dict]:
    """
    Fetch the past 7 days of non-private sessions, group them by member, send
    them to Gemini, and persist the result as a new master context version.

    Assumes the caller holds the team's synthesis lock.
    """
    # Fetch recent non-private sessions
    cutoff = datetime.utcnow() - timedelta(days=7)
    sessions = (
        db.query(ContextSession)
        .filter(
            ContextSession.team_id == team_id,
            ContextSession.is_private == False,
            ContextSession.created_at >= cutoff,
        )
        .order_by(ContextSession.created_at.desc())
        .limit(100)
        .all()
    )

    if not sessions:
        logger.info(f"No sessions found for team {team_id}, skipping synthesis")
        return None

    # Group by member
    sessions_by_member = {}
    for s in sessions:
        if s.member_name not in sessions_by_member:
            sessions_by_member[s.member_name] = []
        sessions_by_member[s.member_name].append(s)

    user_prompt = build_user_prompt(sessions_by_member)

    # Call Gemini API
    try:
        from google import genai
        from google.genai import types as genai_types
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"{SYSTEM_PROMPT}\n\n{user_prompt}",
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=2000,
            ),
        )
        result_text = response.text
        result = json.loads(result_text)
    except Exception as e:
        logger.error(f"LLM synthesis failed: {e}")
        return None

    # Save to database
    existing = (
        db.query(MasterContext)
        .filter(MasterContext.team_id == team_id)
        .order_by(MasterContext.version.desc())
        .first()
    )
    new_version = (existing.version + 1) if existing else 1

    mc = MasterContext(
        team_id=team_id,
        content=result,
        version=new_version,
    )
    db.add(mc)
    db.commit()

    # Update Redis cache (skip if not available)
    try:
        import redis
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        r = redis.from_url(redis_url, decode_responses=True)
        r.ping()
        cache_data = {
            "version": new_version,
            "updated_at": datetime.utcnow().isoformat(),
            **result,
        }
        r.setex(f"master_context:{team_id}", 2100, json.dumps(cache_data))
    except Exception:
        pass  # Redis not available, that's fine

    logger.info(f"Master context v{new_version} synthesized for team {team_id}")
    return result
