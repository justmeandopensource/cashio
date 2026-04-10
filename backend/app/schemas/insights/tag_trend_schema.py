from decimal import Decimal
from typing import List

from pydantic import BaseModel


class TagAmount(BaseModel):
    tag: str
    amount: Decimal


class CategoryAmount(BaseModel):
    category: str
    amount: Decimal
    type: str


class TagTrendSummary(BaseModel):
    total_amount: Decimal


class TagTrendResponse(BaseModel):
    tag_breakdown: List[TagAmount]
    category_breakdown: List[CategoryAmount]
    summary: TagTrendSummary
