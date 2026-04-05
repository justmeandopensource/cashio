from datetime import datetime, timedelta
from typing import Literal

from sqlalchemy.orm import Session, aliased

from app.models.model import Account, Ledger, Transaction


def _get_date_range(period_type: str):
    """Return (start_date, end_date). end_date is None for open-ended ranges."""
    now = datetime.now()
    if period_type == "current_month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return start, None
    elif period_type == "last_month":
        first_of_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_end = first_of_this_month
        last_month_start = (first_of_this_month - timedelta(days=1)).replace(day=1)
        return last_month_start, last_month_end
    else:  # last_12_months
        start = (now - timedelta(days=365)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        return start, None


def _empty_response(period_type: str):
    return {
        "nodes": [],
        "links": [],
        "summary": {
            "total_transfer_volume": 0,
            "total_transfer_count": 0,
            "cross_ledger_count": 0,
            "unique_corridors": 0,
        },
        "period_type": period_type,
    }


def get_fund_flow(
    db: Session,
    user_id: int,
    period_type: Literal["last_12_months", "last_month", "current_month"],
):
    start_date, end_date = _get_date_range(period_type)

    # Get all ledgers for this user
    user_ledgers = (
        db.query(Ledger.ledger_id, Ledger.name, Ledger.currency_symbol)
        .filter(Ledger.user_id == user_id)
        .all()
    )
    ledger_ids = [l.ledger_id for l in user_ledgers]
    ledger_map = {
        l.ledger_id: {"name": l.name, "currency_symbol": l.currency_symbol}
        for l in user_ledgers
    }

    if not ledger_ids:
        return _empty_response(period_type)

    # Aliases for self-join
    SourceTx = aliased(Transaction, name="source_tx")
    DestTx = aliased(Transaction, name="dest_tx")
    SourceAcct = aliased(Account, name="source_acct")
    DestAcct = aliased(Account, name="dest_acct")

    # Self-join: pair source and destination by transfer_id
    pairs = (
        db.query(
            SourceTx.account_id.label("source_account_id"),
            DestTx.account_id.label("dest_account_id"),
            SourceAcct.name.label("source_account_name"),
            DestAcct.name.label("dest_account_name"),
            SourceAcct.ledger_id.label("source_ledger_id"),
            DestAcct.ledger_id.label("dest_ledger_id"),
            SourceAcct.type.label("source_type"),
            SourceAcct.subtype.label("source_subtype"),
            DestAcct.type.label("dest_type"),
            DestAcct.subtype.label("dest_subtype"),
            DestTx.credit.label("dest_amount"),
            SourceTx.debit.label("source_amount"),
        )
        .join(DestTx, SourceTx.transfer_id == DestTx.transfer_id)
        .join(SourceAcct, SourceTx.account_id == SourceAcct.account_id)
        .join(DestAcct, DestTx.account_id == DestAcct.account_id)
        .filter(
            SourceTx.is_transfer == True,
            SourceTx.transfer_type == "source",
            DestTx.transfer_type == "destination",
            SourceAcct.ledger_id.in_(ledger_ids),
            DestAcct.ledger_id.in_(ledger_ids),
            SourceTx.date >= start_date,
            *([SourceTx.date < end_date] if end_date else []),
        )
        .all()
    )

    if not pairs:
        return _empty_response(period_type)

    # Aggregate by corridor (source_account_id -> dest_account_id)
    corridors: dict[tuple[int, int], dict] = {}
    accounts: dict[int, dict] = {}

    for row in pairs:
        src_id = row.source_account_id
        dst_id = row.dest_account_id
        src_ledger_id = row.source_ledger_id
        dst_ledger_id = row.dest_ledger_id
        dest_amount = float(row.dest_amount)
        source_amount = float(row.source_amount)
        is_cross = src_ledger_id != dst_ledger_id

        key = (src_id, dst_id)
        if key not in corridors:
            corridors[key] = {
                "source_account_id": src_id,
                "source_account_name": row.source_account_name,
                "source_ledger_name": ledger_map[src_ledger_id]["name"],
                "target_account_id": dst_id,
                "target_account_name": row.dest_account_name,
                "target_ledger_name": ledger_map[dst_ledger_id]["name"],
                "total_amount": 0.0,
                "total_source_amount": 0.0,
                "transfer_count": 0,
                "is_cross_ledger": is_cross,
                "source_currency": ledger_map[src_ledger_id]["currency_symbol"],
                "target_currency": ledger_map[dst_ledger_id]["currency_symbol"],
            }
        corridors[key]["total_amount"] += dest_amount
        corridors[key]["total_source_amount"] += source_amount
        corridors[key]["transfer_count"] += 1

        # Track accounts for node data
        if src_id not in accounts:
            accounts[src_id] = {
                "account_id": src_id,
                "account_name": row.source_account_name,
                "ledger_id": src_ledger_id,
                "ledger_name": ledger_map[src_ledger_id]["name"],
                "currency_symbol": ledger_map[src_ledger_id]["currency_symbol"],
                "account_type": row.source_type,
                "account_subtype": row.source_subtype,
                "total_outflow": 0.0,
                "total_inflow": 0.0,
            }
        accounts[src_id]["total_outflow"] += dest_amount

        if dst_id not in accounts:
            accounts[dst_id] = {
                "account_id": dst_id,
                "account_name": row.dest_account_name,
                "ledger_id": dst_ledger_id,
                "ledger_name": ledger_map[dst_ledger_id]["name"],
                "currency_symbol": ledger_map[dst_ledger_id]["currency_symbol"],
                "account_type": row.dest_type,
                "account_subtype": row.dest_subtype,
                "total_outflow": 0.0,
                "total_inflow": 0.0,
            }
        accounts[dst_id]["total_inflow"] += dest_amount

    # Build nodes
    nodes = []
    for acct in accounts.values():
        acct["total_volume"] = acct["total_outflow"] + acct["total_inflow"]
        nodes.append(acct)
    nodes.sort(key=lambda x: x["total_volume"], reverse=True)

    # Build links
    links = []
    for corridor in corridors.values():
        link = {
            "source_account_id": corridor["source_account_id"],
            "source_account_name": corridor["source_account_name"],
            "source_ledger_name": corridor["source_ledger_name"],
            "target_account_id": corridor["target_account_id"],
            "target_account_name": corridor["target_account_name"],
            "target_ledger_name": corridor["target_ledger_name"],
            "total_amount": round(corridor["total_amount"], 2),
            "transfer_count": corridor["transfer_count"],
            "is_cross_ledger": corridor["is_cross_ledger"],
            "source_currency": corridor["source_currency"],
            "target_currency": corridor["target_currency"],
        }
        if corridor["is_cross_ledger"]:
            link["target_amount"] = round(corridor["total_amount"], 2)
            link["total_amount"] = round(corridor["total_source_amount"], 2)
        links.append(link)
    links.sort(key=lambda x: x["total_amount"], reverse=True)

    # Build summary
    total_volume = sum(l["total_amount"] for l in links)
    total_count = sum(l["transfer_count"] for l in links)
    cross_ledger_count = sum(1 for l in links if l["is_cross_ledger"])

    summary = {
        "total_transfer_volume": round(total_volume, 2),
        "total_transfer_count": total_count,
        "cross_ledger_count": cross_ledger_count,
        "unique_corridors": len(links),
    }

    if links:
        top = links[0]
        summary["most_active_corridor_source"] = top["source_account_name"]
        summary["most_active_corridor_target"] = top["target_account_name"]
        summary["most_active_corridor_amount"] = top["total_amount"]

    return {
        "nodes": nodes,
        "links": links,
        "summary": summary,
        "period_type": period_type,
    }
