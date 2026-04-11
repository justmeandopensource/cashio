import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import bcrypt
import jwt
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.model import RefreshToken
from app.repositories import user_crud
from app.repositories.settings import settings
from app.schemas import user_schema

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="user/login")


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
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> user_schema.User:
    return verify_token(token=token, db=db)
