from decimal import Decimal
from typing import List, Literal

from pydantic import BaseModel


class StoreExpenseData(BaseModel):
    store: str
    amount: Decimal
    percentage: Decimal


class LocationExpenseData(BaseModel):
    location: str
    amount: Decimal
    percentage: Decimal


class ExpenseByStoreResponse(BaseModel):
    store_data: List[StoreExpenseData]
    total_expense: Decimal
    period_type: Literal["all_time", "last_12_months", "this_month"]


class ExpenseByLocationResponse(BaseModel):
    location_data: List[LocationExpenseData]
    total_expense: Decimal
    period_type: Literal["all_time", "last_12_months", "this_month"]


class CategoryExpenseData(BaseModel):
    category_id: int
    category: str
    amount: Decimal
    percentage: Decimal


class StoreCategoryBreakdownResponse(BaseModel):
    store: str
    category_data: List[CategoryExpenseData]
    total_expense: Decimal
    period_type: str


class LocationCategoryBreakdownResponse(BaseModel):
    location: str
    category_data: List[CategoryExpenseData]
    total_expense: Decimal
    period_type: str