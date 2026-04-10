from decimal import Decimal
from typing import List

from pydantic import BaseModel


class ExpenseCalendarData(BaseModel):
    date: str
    amount: Decimal


class ExpenseCalendarResponse(BaseModel):
    expenses: List[ExpenseCalendarData]
    total_expense: Decimal