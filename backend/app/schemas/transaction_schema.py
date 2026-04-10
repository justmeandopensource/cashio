from datetime import datetime
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel

from app.schemas.tag_schema import Tag, TagCreate


class TransactionSplitCreate(BaseModel):
    category_id: Optional[int] = None
    credit: Decimal = Decimal("0")
    debit: Decimal = Decimal("0")
    notes: Optional[str] = None


class TransactionSplit(BaseModel, str_strip_whitespace=True):
    split_id: int
    transaction_id: int
    category_id: Optional[int] = None
    credit: Decimal
    debit: Decimal
    notes: Optional[str]

    class Config:
        from_attributes = True


class TransactionSplitResponse(TransactionSplit):
    category_name: Optional[str] = None


class MatchedSplitInfo(BaseModel):
    split_id: int
    category_id: int
    category_name: str
    debit: Decimal
    credit: Decimal
    notes: Optional[str] = None


class TransactionCreate(BaseModel):
    account_id: int
    category_id: Optional[int] = None
    type: Literal["income", "expense"]
    credit: Decimal = Decimal("0")
    debit: Decimal = Decimal("0")
    date: datetime
    notes: Optional[str] = None
    store: Optional[str] = None
    location: Optional[str] = None
    is_transfer: bool
    transfer_id: Optional[str]
    transfer_type: Optional[str]
    is_split: bool = False
    is_asset_transaction: bool = False
    splits: Optional[List[TransactionSplitCreate]] = None
    tags: Optional[List[TagCreate]] = None


class TransactionSplitUpdate(BaseModel):
    category_id: Optional[int] = None
    credit: Optional[Decimal] = None
    debit: Optional[Decimal] = None
    notes: Optional[str] = None


class TransactionUpdate(BaseModel):
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    type: Optional[Literal["income", "expense"]] = None
    credit: Optional[Decimal] = None
    debit: Optional[Decimal] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None
    store: Optional[str] = None
    location: Optional[str] = None
    is_split: Optional[bool] = None
    is_asset_transaction: Optional[bool] = None
    splits: Optional[List[TransactionSplitUpdate]] = None
    tags: Optional[List[TagCreate]] = None


class Transaction(BaseModel, str_strip_whitespace=True):
    transaction_id: int
    account_id: int
    account_name: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    credit: Decimal
    debit: Decimal
    date: datetime
    notes: Optional[str]
    store: Optional[str]
    location: Optional[str]
    is_split: bool
    is_transfer: bool
    is_cross_ledger_transfer: bool = False
    is_asset_transaction: bool
    is_mf_transaction: bool
    transfer_id: Optional[str]
    transfer_type: Optional[str]
    created_at: datetime
    tags: Optional[List[Tag]] = None
    filter_matched_split: Optional[MatchedSplitInfo] = None

    class Config:
        from_attributes = True


class PaginatedTransactionResponse(BaseModel):
    transactions: List[Transaction]
    total_transactions: int
    total_pages: int
    current_page: int
    per_page: int
    total_credit: Decimal = Decimal("0")
    total_debit: Decimal = Decimal("0")
    net_amount: Decimal = Decimal("0")


class TransferCreate(BaseModel):
    source_account_id: int
    destination_account_id: int
    source_amount: Decimal
    destination_amount: Optional[Decimal] = None
    date: datetime
    notes: Optional[str] = None
    tags: Optional[List[TagCreate]] = None
    fee_amount: Optional[Decimal] = None
    fee_category_id: Optional[int] = None





class TransferUpdate(BaseModel):
    source_account_id: int
    destination_account_id: int
    source_amount: Decimal
    destination_amount: Optional[Decimal] = None
    date: datetime
    notes: Optional[str] = None
    tags: Optional[List[TagCreate]] = None
    fee_amount: Optional[Decimal] = None
    fee_category_id: Optional[int] = None


class TransferTransactionResponse(BaseModel):
    source_transaction: Transaction
    destination_transaction: Transaction
    source_account_name: str
    destination_account_name: str
    source_ledger_name: str
    destination_ledger_name: str
    source_ledger_id: Optional[int] = None
    destination_ledger_id: Optional[int] = None
