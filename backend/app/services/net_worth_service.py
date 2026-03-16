from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.model import Account, MutualFund, PhysicalAsset
from app.schemas.net_worth_schema import (
    AccountNetWorthItem,
    AssetAllocationItem,
    MutualFundNetWorthItem,
    NetWorthResponse,
    PhysicalAssetNetWorthItem,
)


def get_net_worth(db: Session, ledger_id: int) -> NetWorthResponse:
    # Accounts
    accounts = db.query(Account).filter(
        Account.ledger_id == ledger_id,
        Account.is_group == False,
    ).all()

    asset_accounts = [
        AccountNetWorthItem(
            account_id=a.account_id,
            name=a.name,
            type=a.type,
            net_balance=a.net_balance,
        )
        for a in accounts if a.type == "asset"
    ]
    liability_accounts = [
        AccountNetWorthItem(
            account_id=a.account_id,
            name=a.name,
            type=a.type,
            net_balance=a.net_balance,
        )
        for a in accounts if a.type == "liability"
    ]

    accounts_assets_total = sum((a.net_balance for a in asset_accounts), Decimal("0"))
    accounts_liabilities_total = sum((a.net_balance for a in liability_accounts), Decimal("0"))

    # Mutual funds
    mf_records = db.query(MutualFund).filter(MutualFund.ledger_id == ledger_id).all()

    mutual_funds = [
        MutualFundNetWorthItem(
            mutual_fund_id=mf.mutual_fund_id,
            name=mf.name,
            current_value=mf.current_value,
            total_invested_cash=mf.total_invested_cash,
            unrealized_gain=mf.current_value - mf.total_invested_cash,
        )
        for mf in mf_records
    ]

    mutual_funds_total = sum((mf.current_value for mf in mutual_funds), Decimal("0"))
    mutual_funds_total_invested = sum((mf.total_invested_cash for mf in mutual_funds), Decimal("0"))
    mutual_funds_unrealized_gain = sum((mf.unrealized_gain for mf in mutual_funds), Decimal("0"))

    # Physical assets
    pa_records = db.query(PhysicalAsset).filter(PhysicalAsset.ledger_id == ledger_id).all()

    physical_assets = [
        PhysicalAssetNetWorthItem(
            physical_asset_id=pa.physical_asset_id,
            name=pa.name,
            asset_type_name=pa.asset_type.name if pa.asset_type else "",
            current_value=pa.current_value,
        )
        for pa in pa_records
    ]

    physical_assets_total = sum((pa.current_value for pa in physical_assets), Decimal("0"))

    # Totals
    total_assets = accounts_assets_total + mutual_funds_total + physical_assets_total
    total_liabilities = accounts_liabilities_total
    net_worth = total_assets - total_liabilities

    # Asset allocation
    grand_total = total_assets
    allocation: list[AssetAllocationItem] = []
    if grand_total > 0:
        for label, value in [
            ("Bank Accounts", accounts_assets_total),
            ("Mutual Funds", mutual_funds_total),
            ("Physical Assets", physical_assets_total),
        ]:
            if value > 0:
                allocation.append(
                    AssetAllocationItem(
                        label=label,
                        value=value,
                        percentage=float(value / grand_total * 100),
                    )
                )

    return NetWorthResponse(
        net_worth=net_worth,
        total_assets=total_assets,
        total_liabilities=total_liabilities,
        accounts_assets_total=accounts_assets_total,
        accounts_liabilities_total=accounts_liabilities_total,
        mutual_funds_total=mutual_funds_total,
        physical_assets_total=physical_assets_total,
        mutual_funds_total_invested=mutual_funds_total_invested,
        mutual_funds_unrealized_gain=mutual_funds_unrealized_gain,
        asset_accounts=asset_accounts,
        liability_accounts=liability_accounts,
        mutual_funds=mutual_funds,
        physical_assets=physical_assets,
        asset_allocation=allocation,
    )
