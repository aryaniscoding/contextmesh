"""
Scheduler — Runs Master Context aggregation every 30 minutes.
Uses APScheduler to trigger synthesis for all teams.
"""
import os
import logging
import asyncio
from apscheduler.schedulers.background import BackgroundScheduler

from db.database import SessionLocal
from db.models import Team
from services.aggregator import synthesize_master_context
from services.locks import try_advisory_lock

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def run_aggregation():
    """
    Runs synthesis for all teams. Called by the scheduler.

    Every backend instance runs its own scheduler, so the sweep is claimed by a
    cluster-wide lock and the instances that lose it skip the tick. Synthesis
    itself is locked per team as well, so a lost race here is only wasted work,
    never a duplicate master context version.
    """
    with try_advisory_lock("scheduled_aggregation") as acquired:
        if not acquired:
            logger.info("Aggregation already running on another instance, skipping tick")
            return

        logger.info("Scheduled aggregation started")
        db = SessionLocal()
        try:
            teams = db.query(Team).all()
            for team in teams:
                try:
                    # Run async function in sync context
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    loop.run_until_complete(synthesize_master_context(team.id, db))
                    loop.close()
                except Exception as e:
                    logger.error(f"Aggregation failed for team {team.id}: {e}")
        finally:
            db.close()
        logger.info("Scheduled aggregation completed")


def start_scheduler():
    """Start the background scheduler."""
    interval = int(os.getenv("MASTER_CONTEXT_INTERVAL", "1800"))
    scheduler.add_job(
        run_aggregation,
        "interval",
        seconds=interval,
        id="master_context_aggregation",
        replace_existing=True,
        max_instances=1,        # never overlap two sweeps inside this process
        coalesce=True,          # a backlog of missed ticks collapses into one run
        misfire_grace_time=300, # a tick under 5 min late still runs; later ones wait
    )
    scheduler.start()
    logger.info(f"Scheduler started — aggregation every {interval}s")


def stop_scheduler():
    """Stop the background scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
