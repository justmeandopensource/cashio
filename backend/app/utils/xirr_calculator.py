import math
from datetime import datetime
from typing import List, Dict, Any, Optional

import structlog

logger = structlog.get_logger()

# Rate domain: (1 + rate) must stay positive; the upper bound is a generous cap.
_RATE_MIN = -0.9999
_RATE_MAX = 10.0
_NEWTON_START = 0.1
_NEWTON_MAX_ITER = 50
_NEWTON_TOL = 1.48e-8
_BISECT_MAX_ITER = 200
_BISECT_TOL = 1e-10


def _npv(rate: float, cash_flows: List[float], years: List[float]) -> float:
    return sum(cf / (1 + rate) ** t for cf, t in zip(cash_flows, years))


def _npv_derivative(rate: float, cash_flows: List[float], years: List[float]) -> float:
    return -sum(cf * t / (1 + rate) ** (t + 1) for cf, t in zip(cash_flows, years))


def _newton(cash_flows: List[float], years: List[float]) -> Optional[float]:
    """Newton–Raphson from _NEWTON_START with the analytic derivative.

    Returns None if the iteration leaves the domain, hits a zero derivative or
    does not converge within _NEWTON_MAX_ITER steps.
    """
    rate = _NEWTON_START
    for _ in range(_NEWTON_MAX_ITER):
        f = _npv(rate, cash_flows, years)
        df = _npv_derivative(rate, cash_flows, years)
        if df == 0 or not math.isfinite(df):
            return None
        step = f / df
        next_rate = rate - step
        if not math.isfinite(next_rate) or next_rate <= -1:
            return None
        if abs(step) <= _NEWTON_TOL:
            return next_rate
        rate = next_rate
    return None


def _bisect(cash_flows: List[float], years: List[float]) -> Optional[float]:
    """Bracketing fallback on (_RATE_MIN, _RATE_MAX).

    Scans for a sign change across the domain, then bisects. Returns None if
    no sign change exists.
    """
    lo, hi = _RATE_MIN, _RATE_MAX
    f_lo = _npv(lo, cash_flows, years)
    f_hi = _npv(hi, cash_flows, years)
    if f_lo * f_hi > 0:
        # Scan for a bracket in case the function crosses zero more than once.
        steps = 200
        prev_r, prev_f = lo, f_lo
        found = False
        for i in range(1, steps + 1):
            r = lo + (hi - lo) * i / steps
            fr = _npv(r, cash_flows, years)
            if prev_f * fr <= 0:
                lo, f_lo, hi, f_hi = prev_r, prev_f, r, fr
                found = True
                break
            prev_r, prev_f = r, fr
        if not found:
            return None
    for _ in range(_BISECT_MAX_ITER):
        mid = (lo + hi) / 2
        f_mid = _npv(mid, cash_flows, years)
        if f_mid == 0 or (hi - lo) / 2 < _BISECT_TOL:
            return mid
        if f_lo * f_mid < 0:
            hi, f_hi = mid, f_mid
        else:
            lo, f_lo = mid, f_mid
    return (lo + hi) / 2


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

    # Solve for XIRR
    try:
        base_date = min(dates)
        years = [(dt - base_date).days / 365.25 for dt in dates]
        xirr = _newton(cash_flows, years)
        if xirr is None:
            xirr = _bisect(cash_flows, years)
        if xirr is None:
            raise ValueError("no root found in rate domain")
        return round(xirr * 100, 2)
    except Exception as e:
        logger.warning("xirr_calculation_failed", error=str(e))
        return None
