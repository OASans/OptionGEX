from __future__ import annotations

import copy
import time

from app.models.domain import GEXResult, OptionContract


class GEXCache:
    def __init__(self, ttl: int = 25):
        self._ttl = ttl
        self._store: dict[str, tuple[GEXResult, float]] = {}
        # Store raw data for on-demand re-computation with different expirations
        self._raw: dict[str, tuple[float, list[str], list[OptionContract]]] = {}

    def get(self, ticker: str) -> GEXResult | None:
        entry = self._store.get(ticker)
        if entry is None:
            return None
        result, expiry = entry
        out = copy.copy(result)
        out.is_stale = time.monotonic() > expiry
        return out

    def set(self, ticker: str, result: GEXResult):
        result.is_stale = False
        self._store[ticker] = (result, time.monotonic() + self._ttl)

    def set_raw(self, ticker: str, spot: float, expirations: list[str], contracts: list[OptionContract]):
        self._raw[ticker] = (spot, expirations, contracts)

    def get_raw(self, ticker: str) -> tuple[float, list[str], list[OptionContract]] | None:
        return self._raw.get(ticker)

    def remove(self, ticker: str):
        self._store.pop(ticker, None)
        self._raw.pop(ticker, None)
