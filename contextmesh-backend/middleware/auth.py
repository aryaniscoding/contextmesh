"""
JWT Authentication Middleware for ContextMesh.
Verifies Supabase Auth JWT tokens and resolves the current user.
Supports both HS256 (legacy) and ES256 (new Supabase default) tokens.
Also supports CLI tokens for non-Supabase access.
"""
import os
import logging
from dataclasses import dataclass
from typing import Optional, Union
from uuid import UUID

import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import User, CLIToken

logger = logging.getLogger(__name__)

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")

# JWKS client for ES256 token verification — caches keys automatically
_jwks_client: Optional[PyJWKClient] = None


@dataclass
class CLICaller:
    """Lightweight caller object for CLI-authenticated requests."""
    id: str          # CLI token ID as string
    display_name: str
    team_id: str
    email: str = ""


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url)
    return _jwks_client


def _decode_token(token: str) -> dict:
    """Decode and verify a Supabase JWT token (ES256 or HS256)."""
    try:
        # Peek at the header to determine the algorithm
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg == "ES256":
            # New Supabase tokens — verify with JWKS public key
            client = _get_jwks_client()
            signing_key = client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256"],
                audience="authenticated",
            )
        else:
            # Legacy HS256 tokens — verify with JWT secret
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )

        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


def get_current_user_id(authorization: Optional[str] = Header(None)) -> UUID:
    """
    FastAPI dependency — extracts and verifies user ID from Authorization header.
    Usage:  user_id: UUID = Depends(get_current_user_id)
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    # Accept "Bearer <token>" format
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")

    token = parts[1]
    payload = _decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing user ID")

    return UUID(user_id)


def get_current_user(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency — returns the full User object.
    The user record is auto-created by a DB trigger on Supabase Auth signup,
    so it should always exist if the token is valid.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User profile not found. Please ensure signup completed properly.",
        )
    return user


def get_caller(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Union[User, CLICaller]:
    """
    Dual-auth dependency — accepts both Supabase JWTs and CLI tokens.
    Returns either a User object or a CLICaller dataclass.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")

    token = parts[1]

    # First try: look up as CLI token (plain hex string, 64 chars)
    if len(token) == 64 and all(c in "0123456789abcdef" for c in token):
        cli_token = db.query(CLIToken).filter(CLIToken.token == token).first()
        if cli_token:
            return CLICaller(
                id=f"cli-{cli_token.id}",
                display_name=cli_token.member_name,
                team_id=cli_token.team_id,
            )

    # Second try: decode as Supabase JWT
    try:
        payload = _decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing user ID")

        user = db.query(User).filter(User.id == UUID(user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User profile not found")
        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_optional_user_id(authorization: Optional[str] = Header(None)) -> Optional[UUID]:
    """
    Optional auth dependency — returns None if no token is provided.
    Used for endpoints that work both authenticated and unauthenticated.
    """
    if not authorization:
        return None
    try:
        return get_current_user_id(authorization)
    except HTTPException:
        return None
