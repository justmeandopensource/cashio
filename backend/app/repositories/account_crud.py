from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select, union_all
from sqlalchemy.orm import Session

from app.models.model import Account, Category, Transaction, TransactionSplit
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

    # Fetch last transaction date per account in a single query
    if accounts:
        account_ids = [a.account_id for a in accounts]
        last_dates = (
            db.query(
                Transaction.account_id,
                func.max(Transaction.date).label("last_transaction_date"),
            )
            .filter(Transaction.account_id.in_(account_ids))
            .group_by(Transaction.account_id)
            .all()
        )
        date_map = {row.account_id: row.last_transaction_date for row in last_dates}
        for account in accounts:
            account.last_transaction_date = date_map.get(account.account_id)  # type: ignore

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


def get_account_summary(db: Session, account_id: int):
    """Get aggregate summary stats for an account."""
    result = db.query(
        func.coalesce(func.sum(Transaction.credit), 0).label("total_credit"),
        func.coalesce(func.sum(Transaction.debit), 0).label("total_debit"),
        func.count().label("transaction_count"),
        func.min(Transaction.date).label("first_transaction_date"),
        func.max(Transaction.date).label("last_transaction_date"),
    ).filter(Transaction.account_id == account_id).one()

    return {
        "total_credit": float(result.total_credit),
        "total_debit": float(result.total_debit),
        "transaction_count": result.transaction_count,
        "first_transaction_date": result.first_transaction_date,
        "last_transaction_date": result.last_transaction_date,
    }


def get_account_insights(db: Session, account_id: int):
    """Get monthly trend and top category breakdown for an account."""
    now = datetime.now()
    start_date = now - timedelta(days=365)
    date_format = "month"

    # --- Monthly income/expense trend (last 12 months) ---

    # Regular (non-split, non-transfer) transactions
    regular_query = (
        select(
            func.date_trunc(date_format, Transaction.date).label("period"),
            func.sum(Transaction.credit).label("income"),
            (func.sum(Transaction.debit) - func.sum(Transaction.credit)).label("expense"),
        )
        .where(
            and_(
                Transaction.account_id == account_id,
                Transaction.is_split == False,
                Transaction.is_transfer == False,
                Transaction.date >= start_date,
            )
        )
    )

    # Split transactions (include fee splits on transfers)
    split_query = (
        select(
            func.date_trunc(date_format, Transaction.date).label("period"),
            func.sum(TransactionSplit.credit).label("income"),
            (func.sum(TransactionSplit.debit) - func.sum(TransactionSplit.credit)).label("expense"),
        )
        .select_from(TransactionSplit)
        .join(Transaction, TransactionSplit.transaction_id == Transaction.transaction_id)
        .where(
            and_(
                Transaction.account_id == account_id,
                Transaction.is_split == True,
                Transaction.date >= start_date,
            )
        )
    )

    # Separate by category type for income and expense
    income_regular = regular_query.join(
        Category, Transaction.category_id == Category.category_id
    ).where(Category.type == "income").group_by(func.date_trunc(date_format, Transaction.date))

    expense_regular = regular_query.join(
        Category, Transaction.category_id == Category.category_id
    ).where(Category.type == "expense").group_by(func.date_trunc(date_format, Transaction.date))

    income_split = split_query.join(
        Category, TransactionSplit.category_id == Category.category_id
    ).where(Category.type == "income").group_by(func.date_trunc(date_format, Transaction.date))

    expense_split = split_query.join(
        Category, TransactionSplit.category_id == Category.category_id
    ).where(Category.type == "expense").group_by(func.date_trunc(date_format, Transaction.date))

    # Union and aggregate
    all_income = union_all(income_regular, income_split).alias("all_income")
    all_expense = union_all(expense_regular, expense_split).alias("all_expense")

    income_results = db.query(
        all_income.c.period, func.sum(all_income.c.income).label("income_amount")
    ).group_by(all_income.c.period).all()

    expense_results = db.query(
        all_expense.c.period, func.sum(all_expense.c.expense).label("expense_amount")
    ).group_by(all_expense.c.period).all()

    periods = {}
    for period, income_amount in income_results:
        if period not in periods:
            periods[period] = {"income": Decimal(0), "expense": Decimal(0)}
        periods[period]["income"] += Decimal(income_amount or 0)

    for period, expense_amount in expense_results:
        if period not in periods:
            periods[period] = {"income": Decimal(0), "expense": Decimal(0)}
        periods[period]["expense"] += Decimal(expense_amount or 0)

    sorted_periods = sorted(periods.items())
    trend_data = [
        {
            "period": period.strftime("%Y-%m"),
            "income": float(data["income"]),
            "expense": float(data["expense"]),
        }
        for period, data in sorted_periods
    ]

    # Summary statistics
    income_values = [item["income"] for item in trend_data]
    expense_values = [item["expense"] for item in trend_data]
    total_income = sum(income_values)
    total_expense = sum(expense_values)

    months_with_income = sum(1 for i in income_values if i > 0)
    months_with_expense = sum(1 for e in expense_values if e > 0)
    avg_income = round(total_income / months_with_income) if months_with_income else 0
    avg_expense = round(total_expense / months_with_expense) if months_with_expense else 0

    # --- Top expense categories (all-time) ---
    # Regular transactions
    regular_cat_query = (
        db.query(
            Category.name,
            func.sum(Transaction.debit - Transaction.credit).label("amount"),
        )
        .join(Category, Transaction.category_id == Category.category_id)
        .filter(
            Transaction.account_id == account_id,
            Transaction.is_split == False,
            Transaction.is_transfer == False,
            Category.type == "expense",
        )
        .group_by(Category.name)
    )

    # Split transactions
    split_cat_query = (
        db.query(
            Category.name,
            func.sum(TransactionSplit.debit - TransactionSplit.credit).label("amount"),
        )
        .select_from(TransactionSplit)
        .join(Transaction, TransactionSplit.transaction_id == Transaction.transaction_id)
        .join(Category, TransactionSplit.category_id == Category.category_id)
        .filter(
            Transaction.account_id == account_id,
            Transaction.is_split == True,
            Category.type == "expense",
        )
        .group_by(Category.name)
    )

    # Combine category results
    cat_totals: dict[str, float] = {}
    for name, amount in regular_cat_query.all():
        cat_totals[name] = cat_totals.get(name, 0) + float(amount or 0)
    for name, amount in split_cat_query.all():
        cat_totals[name] = cat_totals.get(name, 0) + float(amount or 0)

    # Sort by amount descending, take top 5
    sorted_cats = sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)[:5]
    total_cat_expense = sum(v for _, v in sorted_cats)

    top_categories = [
        {
            "name": name,
            "amount": amount,
            "percentage": round((amount / total_cat_expense) * 100, 1) if total_cat_expense > 0 else 0,
        }
        for name, amount in sorted_cats
    ]

    return {
        "trend_data": trend_data,
        "top_categories": top_categories,
        "summary": {
            "total_income": round(total_income),
            "total_expense": round(total_expense),
            "avg_income": avg_income,
            "avg_expense": avg_expense,
        },
    }
