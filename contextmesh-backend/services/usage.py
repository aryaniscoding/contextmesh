"""
Usage Tracking Service — Logs every LLM API call with token counts and cost estimates.
"""
import logging
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy import func as sql_func
from sqlalchemy.orm import Session
from db.models import UsageLog, User

logger = logging.getLogger(__name__)

# ─── Cost Rates (USD per 1M tokens) ───
COST_RATES = {
    # ── Claude (Anthropic) ──
    "claude-opus-4-6":              {"input": 15.0,  "output": 75.0},
    "claude-sonnet-4-6":            {"input": 3.0,   "output": 15.0},
    "claude-sonnet-4-5":            {"input": 3.0,   "output": 15.0},
    "claude-haiku-4-5":             {"input": 0.8,   "output": 4.0},
    "claude-3-5-sonnet-20241022":   {"input": 3.0,   "output": 15.0},
    "claude-3-5-haiku-20241022":    {"input": 0.8,   "output": 4.0},
    "claude-3-opus-20240229":       {"input": 15.0,  "output": 75.0},
    # ── OpenAI / Codex ──
    "gpt-4o":                       {"input": 2.5,   "output": 10.0},
    "gpt-4o-mini":                  {"input": 0.15,  "output": 0.60},
    "gpt-4-turbo":                  {"input": 10.0,  "output": 30.0},
    "gpt-4":                        {"input": 30.0,  "output": 60.0},
    "gpt-3.5-turbo":                {"input": 0.5,   "output": 1.5},
    "o1":                           {"input": 15.0,  "output": 60.0},
    "o1-mini":                      {"input": 3.0,   "output": 12.0},
    "o3-mini":                      {"input": 1.1,   "output": 4.4},
    # ── Gemini (Google) ──
    "gemini-2.5-pro":               {"input": 1.25,  "output": 10.0},
    "gemini-2.5-flash":             {"input": 0.075, "output": 0.30},
    "gemini-2.0-flash":             {"input": 0.075, "output": 0.30},
    "gemini-1.5-pro":               {"input": 1.25,  "output": 5.0},
    "gemini-1.5-flash":             {"input": 0.075, "output": 0.30},
    # ── Embeddings (free/cheap) ──
    "text-embedding-004":           {"input": 0.0,   "output": 0.0},
    # ── Fallback for unknown models ──
    "unknown":                      {"input": 3.0,   "output": 15.0},
    "default":                      {"input": 3.0,   "output": 15.0},
}


def _calculate_cost(model_name: str, input_tokens: int, output_tokens: int) -> float:
    """Calculate estimated cost in USD."""
    rates = COST_RATES.get(model_name, COST_RATES["default"])
    cost = (input_tokens * rates["input"] + output_tokens * rates["output"]) / 1_000_000
    return round(cost, 8)


def count_message_tokens(messages: list) -> tuple[int, int]:
    """Estimate input/output tokens from a message list (4 chars ≈ 1 token)."""
    input_chars = sum(len(m.get("content", "")) for m in messages if m.get("role") == "user")
    output_chars = sum(len(m.get("content", "")) for m in messages if m.get("role") == "assistant")
    return max(1, input_chars // 4), max(0, output_chars // 4)


def log_usage(
    db: Session,
    team_id: str,
    user_id: Optional[UUID],
    action: str,
    model_name: str,
    input_tokens: int = 0,
    output_tokens: int = 0,
    member_name: Optional[str] = None,
) -> UsageLog:
    """Record an LLM API call to the usage_logs table."""
    cost = _calculate_cost(model_name, input_tokens, output_tokens)

    log = UsageLog(
        team_id=team_id,
        user_id=user_id,
        member_name=member_name,
        action=action,
        model_name=model_name,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        estimated_cost_usd=cost,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    logger.info(
        f"Usage logged: {action} ({model_name}) — "
        f"{input_tokens}+{output_tokens} tokens, ${cost:.6f}"
    )
    return log


def get_team_usage(
    db: Session,
    team_id: str,
    days: int = 30
) -> dict:
    """Aggregate usage per user for a team over the given period."""
    cutoff = datetime.utcnow() - timedelta(days=days)

    # Aggregate by (user_id, member_name) so CLI users (null user_id) are grouped by name
    rows = (
        db.query(
            UsageLog.user_id,
            UsageLog.member_name,
            User.display_name,
            User.email,
            sql_func.count(UsageLog.id).label("total_requests"),
            sql_func.sum(UsageLog.input_tokens).label("input_tokens"),
            sql_func.sum(UsageLog.output_tokens).label("output_tokens"),
            sql_func.sum(UsageLog.estimated_cost_usd).label("total_cost"),
        )
        .join(User, User.id == UsageLog.user_id, isouter=True)
        .filter(
            UsageLog.team_id == team_id,
            UsageLog.created_at >= cutoff,
        )
        .group_by(UsageLog.user_id, UsageLog.member_name, User.display_name, User.email)
        .all()
    )

    users = []
    total_cost = 0.0
    total_tokens = 0

    for row in rows:
        input_t = row.input_tokens or 0
        output_t = row.output_tokens or 0
        cost = float(row.total_cost or 0)
        total_cost += cost
        total_tokens += input_t + output_t

        # Resolve display name: prefer User table, fall back to member_name
        display = row.display_name or row.member_name or "Unknown"
        is_cli = row.user_id is None

        # Per-action breakdown for this user
        breakdown_query = (
            db.query(
                UsageLog.action,
                UsageLog.model_name,
                sql_func.count(UsageLog.id).label("count"),
                sql_func.sum(UsageLog.input_tokens).label("input_tokens"),
                sql_func.sum(UsageLog.output_tokens).label("output_tokens"),
                sql_func.sum(UsageLog.estimated_cost_usd).label("cost"),
            )
            .filter(
                UsageLog.team_id == team_id,
                UsageLog.created_at >= cutoff,
            )
        )
        if is_cli:
            breakdown_query = breakdown_query.filter(
                UsageLog.user_id == None,
                UsageLog.member_name == row.member_name,
            )
        else:
            breakdown_query = breakdown_query.filter(UsageLog.user_id == row.user_id)

        breakdown_rows = breakdown_query.group_by(UsageLog.action, UsageLog.model_name).all()

        breakdown = [
            {
                "action": b.action,
                "model": b.model_name,
                "count": b.count,
                "tokens": (b.input_tokens or 0) + (b.output_tokens or 0),
                "cost": round(float(b.cost or 0), 6),
            }
            for b in breakdown_rows
        ]

        users.append({
            "user_id": str(row.user_id) if row.user_id else f"cli-{row.member_name}",
            "display_name": display,
            "email": row.email or ("CLI user" if is_cli else ""),
            "total_requests": row.total_requests,
            "input_tokens": input_t,
            "output_tokens": output_t,
            "estimated_cost_usd": round(cost, 6),
            "breakdown": breakdown,
        })

    return {
        "team_id": team_id,
        "period_days": days,
        "total_cost_usd": round(total_cost, 6),
        "total_tokens": total_tokens,
        "users": users,
    }


def get_user_usage(
    db: Session,
    team_id: str,
    user_id: UUID,
    days: int = 30,
) -> dict:
    """Get usage stats for a single user in a team."""
    cutoff = datetime.utcnow() - timedelta(days=days)

    rows = (
        db.query(
            UsageLog.action,
            UsageLog.model_name,
            sql_func.count(UsageLog.id).label("count"),
            sql_func.sum(UsageLog.input_tokens).label("input_tokens"),
            sql_func.sum(UsageLog.output_tokens).label("output_tokens"),
            sql_func.sum(UsageLog.estimated_cost_usd).label("cost"),
        )
        .filter(
            UsageLog.team_id == team_id,
            UsageLog.user_id == user_id,
            UsageLog.created_at >= cutoff,
        )
        .group_by(UsageLog.action, UsageLog.model_name)
        .all()
    )

    total_requests = sum(r.count for r in rows)
    input_tokens = sum(r.input_tokens or 0 for r in rows)
    output_tokens = sum(r.output_tokens or 0 for r in rows)
    total_cost = sum(float(r.cost or 0) for r in rows)

    breakdown = [
        {
            "action": r.action,
            "model": r.model_name,
            "count": r.count,
            "tokens": (r.input_tokens or 0) + (r.output_tokens or 0),
            "cost": round(float(r.cost or 0), 6),
        }
        for r in rows
    ]

    return {
        "total_requests": total_requests,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "estimated_cost_usd": round(total_cost, 6),
        "breakdown": breakdown,
    }
