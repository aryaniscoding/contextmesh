"""
Conflict Detection Service — Secondary pairwise check using text similarity.
Runs after synthesis to catch contradictions the LLM might miss.
"""
import logging
from typing import List

logger = logging.getLogger(__name__)


def detect_conflicts(decisions: List[dict]) -> List[dict]:
    """
    Compare decisions pairwise for potential conflicts.
    Uses simple keyword overlap for now.
    In production, use embedding similarity (ChromaDB or sentence-transformers).

    A conflict is flagged when two decisions are about the same topic
    (high keyword overlap) but suggest different approaches.
    """
    conflicts = []

    for i in range(len(decisions)):
        for j in range(i + 1, len(decisions)):
            d1 = decisions[i]
            d2 = decisions[j]

            text1 = d1.get("text", "").lower()
            text2 = d2.get("text", "").lower()
            member1 = d1.get("made_by", "Unknown")
            member2 = d2.get("made_by", "Unknown")

            # Skip if same member
            if member1 == member2:
                continue

            # Simple keyword overlap check
            words1 = set(text1.split())
            words2 = set(text2.split())

            # Remove common stop words
            stop_words = {"the", "a", "an", "is", "are", "was", "were", "be", "been",
                          "for", "to", "of", "in", "on", "at", "by", "with", "and",
                          "or", "use", "using", "should", "will", "we", "our", "i"}
            words1 -= stop_words
            words2 -= stop_words

            if not words1 or not words2:
                continue

            # Calculate Jaccard similarity
            intersection = words1 & words2
            union = words1 | words2
            similarity = len(intersection) / len(union) if union else 0

            # If topic is similar (>0.3) but texts aren't identical (<0.9)
            # → potential conflict
            if 0.3 < similarity < 0.9:
                # Extract the common topic
                topic = " ".join(sorted(intersection)[:3]).title()
                conflicts.append({
                    "topic": topic or "Related decisions",
                    "member_a": member1,
                    "says_a": d1.get("text", ""),
                    "member_b": member2,
                    "says_b": d2.get("text", ""),
                    "similarity": round(similarity, 2),
                })

    logger.info(f"Conflict detection found {len(conflicts)} potential conflicts")
    return conflicts
