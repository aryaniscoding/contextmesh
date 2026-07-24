"""
Embedding Service — Generates vector embeddings using Gemini text-embedding-004.
Uses the new google-genai SDK (google.generativeai is deprecated).
"""
import os
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
EMBEDDING_MODEL = "models/text-embedding-004"
EMBEDDING_DIM = 768


def prepare_session_text(
    messages: List[dict],
    files: List[str],
    member_name: str,
) -> str:
    parts = [f"Session by {member_name}."]
    if files:
        parts.append(f"Files: {', '.join(files[:10])}")
    for msg in messages[:30]:
        role = msg.get("role", "unknown")
        content = msg.get("content", "")
        if role == "user":
            parts.append(f"User: {content[:400]}")
        elif role == "assistant":
            parts.append(f"AI: {content[:200]}")
    return "\n".join(parts)[:6000]


async def generate_embedding(text: str) -> Optional[List[float]]:
    if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("your-"):
        logger.warning("No Gemini API key configured, skipping embedding")
        return None
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        result = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
        )
        embedding = list(result.embeddings[0].values)
        logger.info(f"Generated embedding ({len(embedding)} dims)")
        return embedding
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return None


async def generate_query_embedding(query: str) -> Optional[List[float]]:
    if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("your-"):
        return None
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        result = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=query,
        )
        return list(result.embeddings[0].values)
    except Exception as e:
        logger.error(f"Query embedding failed: {e}")
        return None


def estimate_embedding_tokens(text: str) -> int:
    return len(text) // 4
