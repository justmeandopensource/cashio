from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.rate_limit import limiter
from app.repositories import user_crud
from app.schemas import general_schema, user_schema
from app.security.user_security import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    rotate_refresh_token,
    revoke_refresh_token,
    revoke_all_refresh_tokens,
    oauth2_scheme,
    verify_token,
    get_current_user,
    get_current_user_jwt,
    create_api_token,
    list_api_tokens,
    revoke_api_token,
)

user_router = APIRouter(prefix="/user")


@user_router.post(
    "/create", response_model=general_schema.RegisterResponse, tags=["users"]
)
@limiter.limit("10/minute")
def create_user(request: Request, user: user_schema.UserCreate, db: Session = Depends(get_db)):
    db_user = user_crud.get_user_by_username(db=db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    user_crud.create_user(db=db, user=user)
    return {"message": "user created successfully"}


@user_router.post("/login", response_model=user_schema.TokenResponse, tags=["users"])
@limiter.limit("5/minute")
async def login(
    request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"www-Authenticate": "Bearer"},
        )
    access_token = create_access_token(user=user)
    refresh_token = create_refresh_token(user_id=user.user_id, db=db)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@user_router.post("/verify-token", tags=["users"])
async def verify_user_token(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    try:
        verify_token(token=token, db=db)
        return {"message": "token is valid"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while verifying the token.",
        )


@user_router.post("/refresh", response_model=user_schema.TokenResponse, tags=["users"])
@limiter.limit("10/minute")
async def refresh_token(
    request: Request,
    body: user_schema.RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    user, db_token = verify_refresh_token(token=body.refresh_token, db=db)
    new_access_token = create_access_token(user=user)
    new_refresh_token = rotate_refresh_token(old_token=db_token, db=db)
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


@user_router.post("/logout", tags=["users"])
async def logout(
    body: user_schema.RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    revoke_refresh_token(token=body.refresh_token, db=db)
    return {"message": "Logged out successfully"}


@user_router.get("/me", response_model=user_schema.UserProfile, tags=["users"])
async def read_users_me(
    current_user: user_schema.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return user_crud.get_user_by_id(db=db, user_id=current_user.user_id)


@user_router.put("/me", response_model=user_schema.UserProfile, tags=["users"])
async def update_user_profile(
    user_update: user_schema.UserUpdate,
    current_user: user_schema.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updated_user = user_crud.update_user(
        db=db,
        user_id=current_user.user_id,
        full_name=user_update.full_name,
        email=user_update.email,
    )
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user


@user_router.put("/default-ledger", response_model=user_schema.UserProfile, tags=["users"])
async def set_default_ledger(
    data: user_schema.SetDefaultLedger,
    current_user: user_schema.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.ledger_id is not None:
        from app.repositories import ledger_crud
        ledger = ledger_crud.get_ledger_by_id(db=db, ledger_id=data.ledger_id)
        if not ledger or ledger.user_id != current_user.user_id:
            raise HTTPException(status_code=404, detail="Ledger not found")
    updated_user = user_crud.set_default_ledger(
        db=db, user_id=current_user.user_id, ledger_id=data.ledger_id
    )
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user


@user_router.put("/change-password", tags=["users"])
async def change_password(
    password_data: user_schema.ChangePassword,
    current_user: user_schema.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = authenticate_user(current_user.username, password_data.current_password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect current password",
        )
    user_crud.update_password(db=db, user_id=current_user.user_id, new_password=password_data.new_password)
    revoke_all_refresh_tokens(user_id=current_user.user_id, db=db)
    return {"message": "Password updated successfully"}


# --- Personal API tokens (programmatic access, e.g. the rb1n assistant) ---
# Management is JWT-only (get_current_user_jwt): a leaked API token must not be
# able to mint or revoke tokens. The tokens themselves authenticate the data
# endpoints via the X-API-Key header (see get_current_user).


@user_router.post(
    "/api-tokens", response_model=user_schema.ApiTokenCreated, tags=["users"]
)
@limiter.limit("10/minute")
async def create_user_api_token(
    request: Request,
    body: user_schema.ApiTokenCreate,
    current_user: user_schema.User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db),
):
    raw, db_token = create_api_token(
        user_id=current_user.user_id,
        name=body.name,
        expires_days=body.expires_days,
        db=db,
    )
    return {
        "id": db_token.id,
        "name": db_token.name,
        "last4": db_token.last4,
        "revoked": db_token.revoked,
        "last_used_at": db_token.last_used_at,
        "expires_at": db_token.expires_at,
        "created_at": db_token.created_at,
        "token": raw,
    }


@user_router.get(
    "/api-tokens", response_model=list[user_schema.ApiTokenInfo], tags=["users"]
)
async def list_user_api_tokens(
    current_user: user_schema.User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db),
):
    return list_api_tokens(user_id=current_user.user_id, db=db)


@user_router.delete("/api-tokens/{token_id}", tags=["users"])
async def revoke_user_api_token(
    token_id: int,
    current_user: user_schema.User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db),
):
    ok = revoke_api_token(token_id=token_id, user_id=current_user.user_id, db=db)
    if not ok:
        raise HTTPException(status_code=404, detail="API token not found")
    return {"message": "API token revoked"}
