"""
Postgres advisory locks — prevent duplicate work across backend instances.

When the backend runs behind a load balancer, every instance boots its own
APScheduler and its own save_context threads. Without coordination they all
run the same synthesis for the same team at the same time, which means
duplicate Gemini calls and duplicate master_context versions.

These locks are cluster-wide because they live in Postgres, which every
instance already shares.
"""
import hashlib
import logging
from contextlib import contextmanager

from sqlalchemy import text

from db.database import engine

logger = logging.getLogger(__name__)


def _lock_key(name: str) -> int:
    """Map a lock name to the signed 64-bit integer Postgres expects."""
    digest = hashlib.blake2b(name.encode("utf-8"), digest_size=8).digest()
    return int.from_bytes(digest, "big", signed=True)


@contextmanager
def try_advisory_lock(name: str):
    """
    Try to take a cluster-wide lock, without blocking.

    Yields True if this process won the lock and False if another instance is
    already holding it, so callers decide whether to skip.

    Runs on its own AUTOCOMMIT connection for two reasons: session-level
    advisory locks outlive a rollback, so releasing them on a pooled
    connection has to be explicit, and AUTOCOMMIT avoids holding a
    transaction open for the whole length of the guarded work.
    """
    key = _lock_key(name)
    conn = engine.connect().execution_options(isolation_level="AUTOCOMMIT")
    acquired = False
    try:
        acquired = bool(
            conn.execute(text("SELECT pg_try_advisory_lock(:key)"), {"key": key}).scalar()
        )
        yield acquired
    finally:
        try:
            if acquired:
                conn.execute(text("SELECT pg_advisory_unlock(:key)"), {"key": key})
        except Exception as e:
            # The connection is about to be discarded, so a failed unlock only
            # delays release until Postgres drops the backing connection.
            logger.warning(f"Failed to release advisory lock {name}: {e}")
        finally:
            conn.close()
