"""
ContextMesh Backend — FastAPI Entry Point.
Run with: uvicorn main:app --reload --port 8000
"""
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import auth, context, master
from routers.usage import router as usage_router
from scheduler import start_scheduler, stop_scheduler

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Off unless explicitly enabled, because debug mode returns full tracebacks
# to the caller on any unhandled exception.
DEBUG = os.getenv("DEBUG", "false").lower() in ("1", "true", "yes")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    logger.info("ContextMesh backend starting (Supabase mode)")

    # Start scheduler
    try:
        start_scheduler()
    except Exception as e:
        logger.warning(f"Scheduler failed to start: {e}")

    yield

    # Shutdown
    stop_scheduler()


app = FastAPI(
    title="ContextMesh API",
    description="Shared AI Memory Layer for Engineering Teams",
    version="2.0.0",
    lifespan=lifespan,
    debug=DEBUG,
)

# CORS — allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(context.router)
app.include_router(master.router)
app.include_router(usage_router)


@app.get("/")
def root():
    return {
        "name": "ContextMesh API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
        "database": "supabase",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
