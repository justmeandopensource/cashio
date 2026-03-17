from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.repositories import budget_crud, ledger_crud
from app.schemas import budget_schema, user_schema
from app.security.user_security import get_current_user

budget_router = APIRouter(prefix="/ledger", tags=["budgets"])


@budget_router.get(
    "/{ledger_id}/budgets",
    response_model=budget_schema.BudgetSummary,
)
def get_budgets(
    ledger_id: int,
    period: str = Query(default="monthly", pattern="^(monthly|yearly)$"),
    user: user_schema.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ledger = ledger_crud.get_ledger_by_id(db=db, ledger_id=ledger_id)
    if ledger is None or ledger.user_id != user.user_id:
        raise HTTPException(status_code=404, detail="Ledger not found")

    return budget_crud.get_budgets_for_ledger(
        db=db, ledger_id=ledger_id, user_id=user.user_id, period=period
    )


@budget_router.post(
    "/{ledger_id}/budgets",
    response_model=budget_schema.Budget,
    status_code=status.HTTP_201_CREATED,
)
def create_budget(
    ledger_id: int,
    data: budget_schema.BudgetCreate,
    user: user_schema.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ledger = ledger_crud.get_ledger_by_id(db=db, ledger_id=ledger_id)
    if ledger is None or ledger.user_id != user.user_id:
        raise HTTPException(status_code=404, detail="Ledger not found")

    return budget_crud.create_budget(
        db=db, ledger_id=ledger_id, user_id=user.user_id, data=data
    )


@budget_router.put(
    "/{ledger_id}/budgets/{budget_id}",
    response_model=budget_schema.Budget,
)
def update_budget(
    ledger_id: int,
    budget_id: int,
    data: budget_schema.BudgetUpdate,
    user: user_schema.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ledger = ledger_crud.get_ledger_by_id(db=db, ledger_id=ledger_id)
    if ledger is None or ledger.user_id != user.user_id:
        raise HTTPException(status_code=404, detail="Ledger not found")

    return budget_crud.update_budget(
        db=db, ledger_id=ledger_id, user_id=user.user_id, budget_id=budget_id, data=data
    )


@budget_router.delete(
    "/{ledger_id}/budgets/{budget_id}",
    response_model=dict,
)
def delete_budget(
    ledger_id: int,
    budget_id: int,
    user: user_schema.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ledger = ledger_crud.get_ledger_by_id(db=db, ledger_id=ledger_id)
    if ledger is None or ledger.user_id != user.user_id:
        raise HTTPException(status_code=404, detail="Ledger not found")

    budget_crud.delete_budget(
        db=db, ledger_id=ledger_id, user_id=user.user_id, budget_id=budget_id
    )
    return {"message": "Budget deleted successfully"}
