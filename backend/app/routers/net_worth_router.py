from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.repositories import ledger_crud
from app.schemas import net_worth_schema, user_schema
from app.security.user_security import get_current_user
from app.services.net_worth_service import get_net_worth

net_worth_router = APIRouter(prefix="/ledger", tags=["net-worth"])


@net_worth_router.get(
    "/{ledger_id}/net-worth",
    response_model=net_worth_schema.NetWorthResponse,
)
def get_net_worth_endpoint(
    ledger_id: int,
    db: Session = Depends(get_db),
    current_user: user_schema.User = Depends(get_current_user),
):
    ledger = ledger_crud.get_ledger_by_id(db, ledger_id)
    if not ledger or ledger.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ledger not found")

    return get_net_worth(db, ledger_id)
