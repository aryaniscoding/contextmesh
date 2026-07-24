"""
Handoff Snapshot Service — Generates a structured AI-ready handoff document
for a team member who is leaving or being replaced.

Uses Gemini to synthesize all their sessions + master context contributions
into a document their replacement can immediately load into their AI context.
"""
import os
import json
import logging
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session as DBSession
from sqlalchemy import or_

from db.models import ContextSession, MasterContext, User

logger = logging.getLogger(__name__)

HANDOFF_PROMPT = """You are a senior engineering team lead writing a handoff document.

A team member is leaving. Based on their AI chat history and team context below,
generate a concise, actionable handoff snapshot their replacement can load into an AI.

Return a JSON object with exactly these keys:
{
  "member_name": "...",
  "summary": "2-3 sentence overview of what this person worked on and their role",
  "key_decisions": [
    { "decision": "...", "context": "...", "impact": "high|medium|low" }
  ],
  "open_work": [
    { "task": "...", "status": "in_progress|blocked|needs_review", "notes": "..." }
  ],
  "open_questions": [
    { "question": "...", "urgency": "high|medium|low" }
  ],
  "files_owned": ["list of key files/modules they touched"],
  "dependencies": ["other team members or systems they were coordinating with"],
  "recommended_first_steps": ["3-5 concrete things the replacement should do first"]
}

Be specific and technical. Reference actual file names, decisions, and code if mentioned.
Return ONLY valid JSON, no markdown fences."""


def _build_handoff_prompt(member_name: str, sessions: list, master_context) -> str:
    parts = [f"MEMBER: {member_name}\n"]

    # Include their sessions
    parts.append("=== THEIR CHAT SESSIONS ===")
    for i, s in enumerate(sessions[:20], 1):  # cap at 20 sessions
        parts.append(f"\n[Session {i}]")
        if s.files:
            parts.append(f"Files: {', '.join((s.files or [])[:10])}")
        for msg in (s.messages or [])[:15]:
            role = msg.get("role", "")
            content = msg.get("content", "")[:600]
            if role in ("user", "assistant"):
                parts.append(f"  {role}: {content}")

    # Include relevant master context
    if master_context:
        mc = master_context.content or {}
        parts.append("\n=== TEAM MASTER CONTEXT (relevant entries) ===")

        decisions = [
            d for d in (mc.get("decisions") or [])
            if member_name.lower() in json.dumps(d).lower()
        ]
        if decisions:
            parts.append("Decisions they were involved in:")
            for d in decisions[:10]:
                parts.append(f"  - {d.get('text', '')} (by {d.get('made_by', '')})")

        in_progress = [
            t for t in (mc.get("in_progress") or [])
            if member_name.lower() in json.dumps(t).lower()
        ]
        if in_progress:
            parts.append("Tasks in progress:")
            for t in in_progress[:10]:
                parts.append(f"  - {t.get('task', '')} — {t.get('member', '')}, files: {t.get('files', [])}")

        questions = [
            q for q in (mc.get("open_questions") or [])
            if member_name.lower() in json.dumps(q).lower()
        ]
        if questions:
            parts.append("Open questions they flagged:")
            for q in questions[:10]:
                parts.append(f"  - {q.get('question', '')}")

    return "\n".join(parts)[:12000]  # ~3000 token cap


async def generate_handoff(
    db: DBSession,
    team_id: str,
    member_user_id: Optional[str] = None,
    member_name: Optional[str] = None,
) -> dict:
    """
    Generate a handoff snapshot for a team member.
    Accepts either a Supabase user_id or a CLI member_name.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key.startswith("your-gemini"):
        raise ValueError("Gemini API key not configured")

    # Resolve display name
    display_name = member_name or "Unknown"
    if member_user_id:
        user = db.query(User).filter(User.id == UUID(member_user_id)).first()
        if user:
            display_name = user.display_name

    # Fetch their sessions (by user_id OR member_name to catch CLI sessions)
    query = db.query(ContextSession).filter(
        ContextSession.team_id == team_id,
        ContextSession.is_private == False,
    )
    if member_user_id:
        query = query.filter(
            or_(
                ContextSession.user_id == UUID(member_user_id),
                ContextSession.member_name == display_name,
            )
        )
    elif member_name:
        query = query.filter(ContextSession.member_name == member_name)

    sessions = query.order_by(ContextSession.created_at.desc()).limit(30).all()

    if not sessions:
        raise ValueError(f"No sessions found for {display_name}")

    # Get team master context
    master = (
        db.query(MasterContext)
        .filter(MasterContext.team_id == team_id)
        .order_by(MasterContext.version.desc())
        .first()
    )

    prompt_text = _build_handoff_prompt(display_name, sessions, master)

    # Call Gemini
    try:
        from google import genai
        from google.genai import types as genai_types
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"{HANDOFF_PROMPT}\n\n{prompt_text}",
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=2000,
            ),
        )
        result = json.loads(response.text)
        result["member_name"] = display_name
        result["session_count"] = len(sessions)
        return result
    except Exception as e:
        logger.error(f"Handoff generation failed: {e}")
        raise ValueError(f"AI generation failed: {e}")
