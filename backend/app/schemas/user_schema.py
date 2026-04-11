from datetime import datetime

from pydantic import BaseModel, Field


class UserBase(BaseModel, str_strip_whitespace=True):
    full_name: str = Field(..., min_length=1)
    username: str = Field(..., min_length=3, max_length=50)
    email: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class User(UserBase, str_strip_whitespace=True):
    user_id: int
    username: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class UserProfile(BaseModel):
    full_name: str
    email: str
    username: str
    default_ledger_id: int | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class SetDefaultLedger(BaseModel):
    ledger_id: int | None = None
