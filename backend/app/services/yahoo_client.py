from __future__ import annotations

import asyncio
import logging
import math
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

import yfinance as yf

from app.models.domain import OptionContract

logger = logging.getLogger(__name__)

_executor = ThreadPoolExecutor(max_workers=4)


def _norm_pdf(x: float) -> float:
    return math.exp(-0.5 * x * x) / math.sqrt(2.0 * math.pi)


def _calc_gamma(spot: float, strike: float, iv: float, tte: float, r: float = 0.05) -> float:
    """Black-Scholes gamma from implied volatility."""
    if iv <= 0 or tte <= 0 or spot <= 0 or strike <= 0:
        return 0.0
    sqrt_t = math.sqrt(tte)
    d1 = (math.log(spot / strike) + (r + 0.5 * iv * iv) * tte) / (iv * sqrt_t)
    return _norm_pdf(d1) / (spot * iv * sqrt_t)


def _fetch_ticker_data(symbol: str, max_expirations: int):
    """Synchronous yfinance calls (run in thread pool)."""
    tk = yf.Ticker(symbol)

    # Get spot price
    info = tk.fast_info
    spot = float(info.last_price)

    # Get expirations
    all_expirations = list(tk.options)
    expirations = all_expirations[:max_expirations]

    # Get chains
    now = datetime.now()
    contracts = []
    for exp_str in expirations:
        try:
            chain = tk.option_chain(exp_str)
        except Exception as e:
            logger.error(f"Failed to get chain for {symbol} {exp_str}: {e}")
            continue

        exp_date = datetime.strptime(exp_str, "%Y-%m-%d")
        tte = max((exp_date - now).days / 365.0, 1 / 365.0)

        for _, row in chain.calls.iterrows():
            iv = row.get("impliedVolatility", 0) or 0
            oi = int(row.get("openInterest", 0) or 0)
            strike = float(row["strike"])
            gamma = _calc_gamma(spot, strike, iv, tte)
            if gamma > 0 and oi > 0:
                contracts.append(
                    OptionContract(
                        strike=strike,
                        option_type="call",
                        gamma=gamma,
                        open_interest=oi,
                        expiration=exp_str,
                    )
                )

        for _, row in chain.puts.iterrows():
            iv = row.get("impliedVolatility", 0) or 0
            oi = int(row.get("openInterest", 0) or 0)
            strike = float(row["strike"])
            gamma = _calc_gamma(spot, strike, iv, tte)
            if gamma > 0 and oi > 0:
                contracts.append(
                    OptionContract(
                        strike=strike,
                        option_type="put",
                        gamma=gamma,
                        open_interest=oi,
                        expiration=exp_str,
                    )
                )

    return spot, expirations, contracts


def _validate_symbol(symbol: str) -> float:
    """Validate symbol exists and return spot price."""
    tk = yf.Ticker(symbol)
    info = tk.fast_info
    return float(info.last_price)


class YahooClient:
    def __init__(self, max_expirations: int = 4):
        self._max_expirations = max_expirations

    async def get_quote(self, ticker: str) -> float:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(_executor, _validate_symbol, ticker)

    async def fetch_all(self, ticker: str) -> tuple[float, list[str], list[OptionContract]]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            _executor, _fetch_ticker_data, ticker, self._max_expirations
        )
