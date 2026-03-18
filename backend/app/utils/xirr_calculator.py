import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from scipy.optimize import newton
import numpy as np

logger = logging.getLogger(__name__)


def calculate_xirr(transactions: List[Dict[str, Any]], current_value: float, current_date: datetime) -> Optional[float]:
    """
    Calculate XIRR for a mutual fund.

    Args:
        transactions: List of transaction dicts with 'transaction_date' and 'total_amount'
        current_value: Current value of holdings
        current_date: Current date

    Returns:
        XIRR as percentage (e.g., 21.11), or None if not computable
    """
    if not transactions:
        return None

    # Prepare cash flows
    cash_flows = []
    dates = []

    for tx in transactions:
        # For buys and switch_ins: negative cash flow (total cash outflow including charges)
        # For sells and switch_outs: positive cash flow (net cash inflow after charges)
        amount = float(tx['total_amount'])
        if tx['transaction_type'] in ['buy', 'switch_in']:
            cash_flows.append(-amount)
        elif tx['transaction_type'] in ['sell', 'switch_out']:
            cash_flows.append(amount)
        dates.append(tx['transaction_date'])

    # Add final positive cash flow for current value
    cash_flows.append(current_value)
    dates.append(current_date)

    # Function to calculate NPV
    def npv(rate, cash_flows, dates):
        base_date = min(dates)
        pv = 0
        for cf, dt in zip(cash_flows, dates):
            days = (dt - base_date).days
            pv += cf / (1 + rate) ** (days / 365.25)
        return pv

    # Function for Newton-Raphson derivative
    def npv_derivative(rate, cash_flows, dates):
        base_date = min(dates)
        dpv = 0
        for cf, dt in zip(cash_flows, dates):
            days = (dt - base_date).days
            dpv -= cf * days / 365.25 / (1 + rate) ** (days / 365.25 + 1)
        return dpv

    # Solve for XIRR
    try:
        xirr = newton(lambda r: npv(r, cash_flows, dates), 0.1, fprime=lambda r: npv_derivative(r, cash_flows, dates))
        return round(xirr * 100, 2)
    except Exception as e:
        logger.warning("XIRR calculation failed: %s", e)
        return None