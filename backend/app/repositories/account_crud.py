from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.model import Account
from app.schemas.account_schema import AccountCreate, AccountUpdate


def create_account(db: Session, ledger_id: int, account: AccountCreate):
    existing_account = (
        db.query(Account)
        .filter(Account.ledger_id == ledger_id, Account.name == account.name)
        .first()
    )

    if existing_account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Account already exists"
        )

    db_account = Account(
        ledger_id=ledger_id,
        name=account.name,
        type=account.type,
        subtype=account.subtype,
        owner=account.owner,
        opening_balance=account.opening_balance or 0,
        net_balance=account.opening_balance or 0,
        description=account.description,
        notes=account.notes,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


def get_accounts_by_ledger_id(
    db: Session,
    ledger_id: int,
    account_type: Optional[str] = None,
    subtype: Optional[str] = None,
):
    query = db.query(Account).filter(Account.ledger_id == ledger_id)

    if account_type:
        query = query.filter(Account.type == account_type)

    if subtype:
        query = query.filter(Account.subtype == subtype)

    query = query.order_by(Account.name.asc())

    accounts = query.all()
    return accounts


def get_account_by_id(db: Session, account_id: int):
    return db.query(Account).filter(Account.account_id == account_id).first()


def update_account(db: Session, account_id: int, account_update: AccountUpdate):
    db_account = db.query(Account).filter(Account.account_id == account_id).first()
    if not db_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
        )

    if account_update.name is not None:
        db_account.name = account_update.name  # type: ignore[reportAttributeAccessIssue]
    if account_update.subtype is not None:
        db_account.subtype = account_update.subtype  # type: ignore
    if account_update.owner is not None:
        db_account.owner = account_update.owner  # type: ignore
    if account_update.opening_balance is not None:
        db_account.opening_balance = Decimal(str(account_update.opening_balance))  # type: ignore
        db_account.net_balance = db_account.opening_balance + db_account.balance  # type: ignore[reportAttributeAccessIssue]
    if account_update.description is not None:
        db_account.description = account_update.description  # type: ignore
    if account_update.notes is not None:
        db_account.notes = account_update.notes  # type: ignore

    db_account.updated_at = datetime.now()  # type: ignore

    db.commit()
    db.refresh(db_account)
    return db_account


def get_account_owner_suggestions(db: Session, ledger_id: int, search_text: str):
    """Get distinct owner suggestions matching the search text."""
    results = (
        db.query(Account.owner)
        .filter(Account.ledger_id == ledger_id)
        .filter(Account.owner.isnot(None))
        .filter(Account.owner != "")
        .filter(Account.owner.ilike(f"%{search_text}%"))
        .distinct()
        .limit(10)
        .all()
    )
    return [r[0] for r in results if r[0]]
