import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from typing import Any

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader, OAuth2PasswordBearer
import bcrypt
import jwt
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.model import APIToken, RefreshToken
from app.repositories import user_crud
from app.repositories.settings import settings
from app.schemas import user_schema

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="user/login")
# Optional variant so get_current_user can fall back to an API key when no
# Authorization header is present (auto_error=True would 401 first).
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="user/login", auto_error=False)
api_key_scheme = APIKeyHeader(name="X-API-Key", auto_error=False)

# Plaintext API tokens carry this prefix so they are self-identifying and can be
# distinguished from JWTs before any DB lookup.
API_TOKEN_PREFIX = "cashio_pat_"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def create_access_token(user: user_schema.User) -> str:
    to_encode: dict[str, Any] = {"sub": user.username}
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode["exp"] = expire
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(user_id: int, db: Session) -> str:
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    db_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(db_token)
    db.commit()
    return token


def verify_refresh_token(token: str, db: Session) -> tuple:
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    db_token = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.expires_at > func.now(),
        )
        .first()
    )
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    user = user_crud.get_user_by_id(db=db, user_id=db_token.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    return user, db_token


def rotate_refresh_token(old_token: RefreshToken, db: Session) -> str:
    user_id = old_token.user_id
    db.delete(old_token)
    db.flush()
    return create_refresh_token(user_id, db)


def revoke_refresh_token(token: str, db: Session) -> None:
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).delete()
    db.commit()


def revoke_all_refresh_tokens(user_id: int, db: Session) -> None:
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()
    db.commit()


def create_api_token(
    user_id: int, name: str, expires_days: int | None, db: Session
) -> tuple[str, APIToken]:
    raw = API_TOKEN_PREFIX + secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    expires_at = None
    if expires_days is not None:
        expires_at = datetime.now(timezone.utc) + timedelta(days=expires_days)
    db_token = APIToken(
        user_id=user_id,
        token_hash=token_hash,
        name=name,
        last4=raw[-4:],
        expires_at=expires_at,
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return raw, db_token


def verify_api_token(raw: str, db: Session):
    """Resolve a plaintext API token to its owning user, or None if invalid,
    revoked, or expired. Bumps last_used_at on success."""
    if not raw or not raw.startswith(API_TOKEN_PREFIX):
        return None
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    db_token = (
        db.query(APIToken)
        .filter(
            APIToken.token_hash == token_hash,
            APIToken.revoked.is_(False),
            or_(APIToken.expires_at.is_(None), APIToken.expires_at > func.now()),
        )
        .first()
    )
    if not db_token:
        return None
    user = user_crud.get_user_by_id(db=db, user_id=db_token.user_id)
    if not user:
        return None
    db_token.last_used_at = func.now()
    db.commit()
    return user


def list_api_tokens(user_id: int, db: Session):
    return (
        db.query(APIToken)
        .filter(APIToken.user_id == user_id)
        .order_by(APIToken.created_at.desc())
        .all()
    )


def revoke_api_token(token_id: int, user_id: int, db: Session) -> bool:
    db_token = (
        db.query(APIToken)
        .filter(APIToken.id == token_id, APIToken.user_id == user_id)
        .first()
    )
    if not db_token:
        return False
    db_token.revoked = True
    db.commit()
    return True


def verify_token(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        username = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
            )
        user = user_crud.get_user_by_username(db=db, username=username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
            )
        return user
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )


def authenticate_user(username: str, password: str, db: Session = Depends(get_db)):
    user = user_crud.get_user_by_username(db=db, username=username)
    if not user:
        return False
    if not bcrypt.checkpw(password.encode(), user.hashed_password.encode()):
        return False
    return user


async def get_current_user(
    bearer: str | None = Depends(oauth2_scheme_optional),
    api_key: str | None = Security(api_key_scheme),
    db: Session = Depends(get_db),
) -> user_schema.User:
    """Authenticate via JWT bearer (browser) OR X-API-Key (programmatic).
    Bearer is tried first so browser behaviour is unchanged."""
    if bearer:
        return verify_token(token=bearer, db=db)
    if api_key:
        user = verify_api_token(api_key, db)
        if user:
            return user
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user_jwt(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> user_schema.User:
    """JWT-only dependency. Used to guard API-token management so a leaked
    API token cannot be used to mint or revoke tokens (privilege boundary)."""
    return verify_token(token=token, db=db)
