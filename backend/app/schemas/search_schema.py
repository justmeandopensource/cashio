from typing import Literal

from pydantic import BaseModel


class SearchResultItem(BaseModel):
    type: Literal["account", "transaction", "mutual_fund", "physical_asset"]
    id: int
    title: str
    subtitle: str | None = None
    ledger_id: int | None = None
    ledger_name: str | None = None
    currency_symbol: str | None = None
    matched_field: str | None = None


class SearchResponse(BaseModel):
    results: list[SearchResultItem]
    total_count: int
    query: str
