"""
ContextMesh Backend — FastAPI Entry Point.
Run with: uvicorn main:app --reload --port 8000
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from db.database import engine, Base
from routers import auth, context, master
from scheduler import start_scheduler, stop_scheduler

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")

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
    version="0.1.0",
    lifespan=lifespan,
    debug=True,
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


@app.get("/")
def root():
    return {
        "name": "ContextMesh API",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
