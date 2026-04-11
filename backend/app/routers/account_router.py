from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies import get_validated_ledger
from app.models.model import Ledger
from app.repositories import account_crud
from app.schemas import account_schema

account_router = APIRouter(prefix="/ledger")


@account_router.get(
    "/{ledger_id}/accounts",
    response_model=list[account_schema.Account],
    tags=["accounts"],
)
def get_ledger_accounts(
    ledger_id: int,
    type: Optional[Literal["asset", "liability"]] = Query(
        default=None, description="Filter by account type (asset or liability)"
    ),
    subtype: Optional[str] = Query(
        default=None, description="Filter by account subtype"
    ),
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    accounts = account_crud.get_accounts_by_ledger_id(
        db=db, ledger_id=ledger_id, account_type=type, subtype=subtype
    )
    if not accounts:
        return []

    return accounts


@account_router.get(
    "/{ledger_id}/account/{account_id}",
    response_model=account_schema.Account,
    tags=["accounts"],
)
def get_account(
    ledger_id: int,
    account_id: int,
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    account = account_crud.get_account_by_id(db=db, account_id=account_id)
    return account


@account_router.post(
    "/{ledger_id}/account/create",
    response_model=account_schema.Account,
    tags=["accounts"],
)
def create_account(
    ledger_id: int,
    account: account_schema.AccountCreate,
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    return account_crud.create_account(
        db=db, ledger_id=ledger_id, account=account
    )


@account_router.get(
    "/{ledger_id}/accounts/subtypes",
    response_model=dict,
    tags=["accounts"],
)
def get_account_subtypes(
    ledger_id: int,
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    return account_schema.ACCOUNT_SUBTYPES


@account_router.get(
    "/{ledger_id}/account/owner/suggestions",
    response_model=list[str],
    tags=["accounts"],
)
def get_owner_suggestions(
    ledger_id: int,
    search_text: str = Query(..., min_length=3),
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    """Get owner suggestions for accounts in a ledger."""
    return account_crud.get_account_owner_suggestions(
        db=db, ledger_id=ledger_id, search_text=search_text
    )


@account_router.get(
    "/{ledger_id}/account/{account_id}/summary",
    response_model=account_schema.AccountSummary,
    tags=["accounts"],
)
def get_account_summary(
    ledger_id: int,
    account_id: int,
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    account = account_crud.get_account_by_id(db=db, account_id=account_id)
    if account is None or account.ledger_id != ledger_id:  # type: ignore
        raise HTTPException(status_code=404, detail="Account not found")

    return account_crud.get_account_summary(db=db, account_id=account_id)


@account_router.get(
    "/{ledger_id}/account/{account_id}/insights",
    response_model=account_schema.AccountInsights,
    tags=["accounts"],
)
def get_account_insights(
    ledger_id: int,
    account_id: int,
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    account = account_crud.get_account_by_id(db=db, account_id=account_id)
    if account is None or account.ledger_id != ledger_id:  # type: ignore
        raise HTTPException(status_code=404, detail="Account not found")

    return account_crud.get_account_insights(db=db, account_id=account_id)


@account_router.get(
    "/{ledger_id}/account/{account_id}/balance-history",
    response_model=account_schema.AccountBalanceHistory,
    tags=["accounts"],
)
def get_account_balance_history(
    ledger_id: int,
    account_id: int,
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    account = account_crud.get_account_by_id(db=db, account_id=account_id)
    if account is None or account.ledger_id != ledger_id:  # type: ignore
        raise HTTPException(status_code=404, detail="Account not found")

    return account_crud.get_account_balance_history(db=db, account_id=account_id)


@account_router.get(
    "/{ledger_id}/account/{account_id}/funds-flow",
    response_model=account_schema.AccountFundsFlow,
    tags=["accounts"],
)
def get_account_funds_flow(
    ledger_id: int,
    account_id: int,
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    account = account_crud.get_account_by_id(db=db, account_id=account_id)
    if account is None or account.ledger_id != ledger_id:  # type: ignore
        raise HTTPException(status_code=404, detail="Account not found")

    return account_crud.get_account_funds_flow(db=db, account_id=account_id)


@account_router.put(
    "/{ledger_id}/account/{account_id}/update",
    response_model=account_schema.Account,
    tags=["accounts"],
)
def update_account_details(
    ledger_id: int,
    account_id: int,
    account_update: account_schema.AccountUpdate,
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    account = account_crud.get_account_by_id(db=db, account_id=account_id)
    if account is None or account.ledger_id != ledger_id:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
        )

    updated_account = account_crud.update_account(
        db=db, account_id=account_id, account_update=account_update
    )
    return updated_account
