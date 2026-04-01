from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.model import (
    Account,
    Amc,
    AssetType,
    Category,
    Ledger,
    MutualFund,
    PhysicalAsset,
    Transaction,
)
from app.schemas.search_schema import SearchResultItem


def search(
    db: Session,
    user_id: int,
    query: str,
    limit_per_type: int = 5,
) -> list[SearchResultItem]:
    pattern = f"%{query}%"
    results: list[SearchResultItem] = []

    # Get all ledger IDs belonging to this user (with names for badges)
    user_ledgers = (
        db.query(Ledger.ledger_id, Ledger.name, Ledger.currency_symbol)
        .filter(Ledger.user_id == user_id)
        .all()
    )
    ledger_ids = [l.ledger_id for l in user_ledgers]
    ledger_map = {l.ledger_id: (l.name, l.currency_symbol) for l in user_ledgers}

    if not ledger_ids:
        return results

    # Accounts
    accounts = (
        db.query(Account)
        .filter(
            Account.ledger_id.in_(ledger_ids),
            or_(
                Account.name.ilike(pattern),
                Account.owner.ilike(pattern),
            ),
        )
        .limit(limit_per_type)
        .all()
    )
    for a in accounts:
        subtitle_parts = [a.type, a.subtype.replace("_", " ") if a.subtype else None]
        if a.owner:
            subtitle_parts.append(a.owner)
        ledger_name, currency_symbol = ledger_map.get(a.ledger_id, (None, None))
        results.append(
            SearchResultItem(
                type="account",
                id=a.account_id,
                title=a.name,
                subtitle=" · ".join(p for p in subtitle_parts if p),
                ledger_id=a.ledger_id,
                ledger_name=ledger_name,
                currency_symbol=currency_symbol,
            )
        )

    # Transactions
    all_account_ids = (
        db.query(Account.account_id).filter(Account.ledger_id.in_(ledger_ids)).subquery()
    )
    transactions = (
        db.query(
            Transaction,
            Category.name.label("category_name"),
            Account.name.label("account_name"),
            Account.ledger_id.label("account_ledger_id"),
        )
        .join(Account, Transaction.account_id == Account.account_id)
        .outerjoin(Category, Transaction.category_id == Category.category_id)
        .filter(
            Transaction.account_id.in_(all_account_ids),
            or_(
                Transaction.notes.ilike(pattern),
                Transaction.store.ilike(pattern),
                Transaction.location.ilike(pattern),
            ),
        )
        .order_by(Transaction.date.desc())
        .limit(limit_per_type)
        .all()
    )
    query_lower = query.lower()
    for t, category_name, account_name, account_ledger_id in transactions:
        ledger_name, currency_symbol = ledger_map.get(account_ledger_id, (None, None))
        symbol = currency_symbol or "₹"
        amount = f"{symbol}{t.debit:,.2f}" if t.debit else f"{symbol}{t.credit:,.2f}"
        subtitle_parts = []
        if category_name:
            subtitle_parts.append(category_name)
        if account_name:
            subtitle_parts.append(account_name)
        subtitle_parts.append(amount)
        subtitle_parts.append(t.date.strftime("%d %b %Y"))

        # Determine which field matched the search query
        if t.notes and query_lower in t.notes.lower():
            matched_field = "search_text"
        elif t.store and query_lower in t.store.lower():
            matched_field = "store"
        elif t.location and query_lower in t.location.lower():
            matched_field = "location"
        else:
            matched_field = "search_text"

        results.append(
            SearchResultItem(
                type="transaction",
                id=t.transaction_id,
                title=t.notes or t.store or t.location or "Transaction",
                subtitle=" · ".join(subtitle_parts),
                ledger_id=account_ledger_id,
                ledger_name=ledger_name,
                currency_symbol=currency_symbol,
                matched_field=matched_field,
            )
        )

    # Mutual Funds
    mutual_funds = (
        db.query(MutualFund, Amc.name.label("amc_name"))
        .join(Amc, MutualFund.amc_id == Amc.amc_id)
        .filter(
            MutualFund.ledger_id.in_(ledger_ids),
            or_(
                MutualFund.name.ilike(pattern),
                MutualFund.code.ilike(pattern),
            ),
        )
        .limit(limit_per_type)
        .all()
    )
    for mf, amc_name in mutual_funds:
        subtitle_parts = []
        if amc_name:
            subtitle_parts.append(amc_name)
        if mf.plan:
            subtitle_parts.append(mf.plan)
        if mf.code:
            subtitle_parts.append(mf.code)
        ledger_name, currency_symbol = ledger_map.get(mf.ledger_id, (None, None))
        results.append(
            SearchResultItem(
                type="mutual_fund",
                id=mf.mutual_fund_id,
                title=mf.name,
                subtitle=" · ".join(subtitle_parts) if subtitle_parts else None,
                ledger_id=mf.ledger_id,
                ledger_name=ledger_name,
                currency_symbol=currency_symbol,
            )
        )

    # Physical Assets
    physical_assets = (
        db.query(PhysicalAsset, AssetType.name.label("asset_type_name"))
        .join(AssetType, PhysicalAsset.asset_type_id == AssetType.asset_type_id)
        .filter(
            PhysicalAsset.ledger_id.in_(ledger_ids),
            PhysicalAsset.name.ilike(pattern),
        )
        .limit(limit_per_type)
        .all()
    )
    for pa, asset_type_name in physical_assets:
        ledger_name, currency_symbol = ledger_map.get(pa.ledger_id, (None, None))
        results.append(
            SearchResultItem(
                type="physical_asset",
                id=pa.physical_asset_id,
                title=pa.name,
                subtitle=asset_type_name,
                ledger_id=pa.ledger_id,
                ledger_name=ledger_name,
                currency_symbol=currency_symbol,
            )
        )

    return results
