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
    oauth2_scheme,
    verify_token,
    get_current_user,
)

user_router = APIRouter(prefix="/user")


@user_router.post(
    "/create", response_model=general_schema.RegisterResponse, tags=["users"]
)
@limiter.limit("3/minute")
def create_user(request: Request, user: user_schema.UserCreate, db: Session = Depends(get_db)):
    db_user = user_crud.get_user_by_username(db=db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    user_crud.create_user(db=db, user=user)
    return {"message": "user created successfully"}


@user_router.post("/login", tags=["users"])
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
    return {"access_token": access_token, "token_type": "bearer"}


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
    return {"message": "Password updated successfully"}
