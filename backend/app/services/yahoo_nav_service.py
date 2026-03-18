"""
UK NAV fetching service using Yahoo Finance (yahooquery).
Fetches all symbols in a single batch request — no rate limiting issues.
Auto-detects GBp (pence) vs GBP and converts accordingly.
"""

import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import List

from yahooquery import Ticker

from app.schemas.mutual_funds_schema import NavFetchResult

_executor = ThreadPoolExecutor(max_workers=2)


class YahooNavService:
    """Service for fetching NAV data from Yahoo Finance via yahooquery."""

    @staticmethod
    def _fetch_symbols(symbols: List[str]) -> List[NavFetchResult]:
        """Fetch price data for all symbols in a single batch call."""
        results: List[NavFetchResult] = []

        try:
            ticker = Ticker(symbols)
            prices = ticker.price
        except Exception as e:
            return [
                NavFetchResult(scheme_code=s, success=False, error_message=str(e))
                for s in symbols
            ]

        for symbol in symbols:
            try:
                data = prices.get(symbol, {}) if isinstance(prices, dict) else {}

                if not isinstance(data, dict) or "regularMarketPrice" not in data:
                    error_msg = str(data) if data else "No quote data available"
                    results.append(
                        NavFetchResult(
                            scheme_code=symbol,
                            success=False,
                            error_message=error_msg,
                        )
                    )
                    continue

                price = float(data["regularMarketPrice"])
                currency = data.get("currency", "")

                # Auto-convert pence (GBp/GBX) to pounds (GBP)
                if currency in ("GBp", "GBX"):
                    price = price / 100.0

                price = round(price, 4)

                # Parse the market timestamp for the nav date
                nav_date = None
                ts = data.get("regularMarketTime")
                if ts:
                    if isinstance(ts, str):
                        dt = datetime.fromisoformat(
                            ts.replace(" ", "T").split("+")[0]
                        )
                        nav_date = dt.strftime("%d-%m-%Y")
                    elif isinstance(ts, datetime):
                        nav_date = ts.strftime("%d-%m-%Y")

                results.append(
                    NavFetchResult(
                        scheme_code=symbol,
                        fund_name=symbol,
                        nav_value=price,
                        nav_date=nav_date,
                        success=True,
                    )
                )

            except Exception as e:
                results.append(
                    NavFetchResult(
                        scheme_code=symbol,
                        success=False,
                        error_message=str(e),
                    )
                )

        return results

    @staticmethod
    async def fetch_nav_bulk(symbols: List[str]) -> List[NavFetchResult]:
        """Fetch price data for multiple symbols (async wrapper around batch call)."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            _executor, YahooNavService._fetch_symbols, symbols
        )
