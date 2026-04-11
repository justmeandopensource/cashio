from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies import get_validated_ledger
from app.models.model import Ledger
from app.schemas import net_worth_schema
from app.services.net_worth_service import get_net_worth

net_worth_router = APIRouter(prefix="/ledger", tags=["net-worth"])


@net_worth_router.get(
    "/{ledger_id}/net-worth",
    response_model=net_worth_schema.NetWorthResponse,
)
def get_net_worth_endpoint(
    ledger_id: int,
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    return get_net_worth(db, ledger_id)
