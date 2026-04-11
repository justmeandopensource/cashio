from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.model import Ledger
from app.repositories import ledger_crud
from app.schemas import user_schema
from app.security.user_security import get_current_user


def get_validated_ledger(
    ledger_id: int,
    current_user: user_schema.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Ledger:
    """Fetch a ledger by ID and verify it belongs to the current user.

    Raises 404 if the ledger does not exist or does not belong to the user.
    """
    ledger = ledger_crud.get_ledger_by_id(db=db, ledger_id=ledger_id)
    if ledger is None or ledger.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ledger not found"
        )
    return ledger
