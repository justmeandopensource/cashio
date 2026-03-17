from datetime import datetime, timezone
from decimal import Decimal
from typing import List

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.model import Budget, Category
from app.schemas.budget_schema import BudgetCreate, BudgetUpdate


def _period_bounds(period: str) -> tuple[datetime, datetime]:
    """Return [start, end) UTC bounds for the current period."""
    now = datetime.now(timezone.utc)
    if period == "monthly":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if start.month == 12:
            end = start.replace(year=start.year + 1, month=1)
        else:
            end = start.replace(month=start.month + 1)
    else:  # yearly
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = start.replace(year=start.year + 1)
    return start, end


def _period_label(period: str) -> str:
    now = datetime.now(timezone.utc)
    if period == "monthly":
        return now.strftime("%B %Y")
    return str(now.year)


def _compute_actual_spend(db: Session, ledger_id: int, category_id: int, period: str) -> Decimal:
    start, end = _period_bounds(period)
    sql = text("""
        SELECT COALESCE(SUM(spend), 0) FROM (
            SELECT t.debit AS spend
            FROM transactions t
            JOIN accounts a ON a.account_id = t.account_id
            WHERE a.ledger_id = :ledger_id
              AND t.category_id = :category_id
              AND t.is_split = FALSE
              AND t.is_transfer = FALSE
              AND t.debit > 0
              AND t.date >= :start
              AND t.date < :end
            UNION ALL
            SELECT s.debit AS spend
            FROM transaction_splits s
            JOIN transactions t ON t.transaction_id = s.transaction_id
            JOIN accounts a ON a.account_id = t.account_id
            WHERE a.ledger_id = :ledger_id
              AND s.category_id = :category_id
              AND t.is_transfer = FALSE
              AND s.debit > 0
              AND t.date >= :start
              AND t.date < :end
        ) combined
    """)
    result = db.execute(sql, {
        "ledger_id": ledger_id,
        "category_id": category_id,
        "start": start,
        "end": end,
    }).scalar()
    return Decimal(str(result)) if result is not None else Decimal("0")


def get_budgets_for_ledger(db: Session, ledger_id: int, user_id: int, period: str) -> dict:
    budgets = (
        db.query(Budget)
        .filter(Budget.ledger_id == ledger_id, Budget.user_id == user_id, Budget.period == period)
        .order_by(Budget.category_id)
        .all()
    )

    budget_list = []
    total_budgeted = Decimal("0")
    total_spent = Decimal("0")

    for b in budgets:
        actual_spend = _compute_actual_spend(db, ledger_id, b.category_id, period)
        total_budgeted += b.amount
        total_spent += actual_spend
        budget_list.append({
            "budget_id": b.budget_id,
            "user_id": b.user_id,
            "ledger_id": b.ledger_id,
            "category_id": b.category_id,
            "category_name": b.category.name,
            "period": b.period,
            "amount": b.amount,
            "actual_spend": actual_spend,
            "created_at": b.created_at,
            "updated_at": b.updated_at,
        })

    return {
        "period": period,
        "period_label": _period_label(period),
        "total_budgeted": total_budgeted,
        "total_spent": total_spent,
        "budgets": budget_list,
    }


def create_budget(db: Session, ledger_id: int, user_id: int, data: BudgetCreate) -> dict:
    # Validate category belongs to user, is expense, and is non-group
    category = (
        db.query(Category)
        .filter(
            Category.category_id == data.category_id,
            Category.user_id == user_id,
        )
        .first()
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if category.type != "expense":
        raise HTTPException(status_code=400, detail="Only expense categories can be budgeted")
    if category.is_group:
        raise HTTPException(status_code=400, detail="Group categories cannot be budgeted")

    budget = Budget(
        user_id=user_id,
        ledger_id=ledger_id,
        category_id=data.category_id,
        period=data.period,
        amount=data.amount,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(budget)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A budget already exists for this category and period",
        )
    db.refresh(budget)

    actual_spend = _compute_actual_spend(db, ledger_id, budget.category_id, data.period)
    return {
        "budget_id": budget.budget_id,
        "user_id": budget.user_id,
        "ledger_id": budget.ledger_id,
        "category_id": budget.category_id,
        "category_name": budget.category.name,
        "period": budget.period,
        "amount": budget.amount,
        "actual_spend": actual_spend,
        "created_at": budget.created_at,
        "updated_at": budget.updated_at,
    }


def update_budget(db: Session, ledger_id: int, user_id: int, budget_id: int, data: BudgetUpdate) -> dict:
    budget = (
        db.query(Budget)
        .filter(Budget.budget_id == budget_id, Budget.ledger_id == ledger_id, Budget.user_id == user_id)
        .first()
    )
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    budget.amount = data.amount
    budget.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(budget)

    actual_spend = _compute_actual_spend(db, ledger_id, budget.category_id, budget.period)
    return {
        "budget_id": budget.budget_id,
        "user_id": budget.user_id,
        "ledger_id": budget.ledger_id,
        "category_id": budget.category_id,
        "category_name": budget.category.name,
        "period": budget.period,
        "amount": budget.amount,
        "actual_spend": actual_spend,
        "created_at": budget.created_at,
        "updated_at": budget.updated_at,
    }


def delete_budget(db: Session, ledger_id: int, user_id: int, budget_id: int) -> None:
    budget = (
        db.query(Budget)
        .filter(Budget.budget_id == budget_id, Budget.ledger_id == ledger_id, Budget.user_id == user_id)
        .first()
    )
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
