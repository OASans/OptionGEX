from __future__ import annotations

import asyncio
import logging

from app.services.cache import GEXCache
from app.services.gex_engine import compute_gex
from app.services.yahoo_client import YahooClient

logger = logging.getLogger(__name__)


class GEXScheduler:
    def __init__(
        self,
        client: YahooClient,
        cache: GEXCache,
        tickers: list[str],
        interval: int = 30,
    ):
        self._client = client
        self._cache = cache
        self.tickers = tickers
        self._interval = interval
        self._task: asyncio.Task | None = None

    def start(self):
        self._task = asyncio.create_task(self._loop())

    async def stop(self):
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def _loop(self):
        import time
        while True:
            start = time.monotonic()
            await self._refresh_all()
            elapsed = time.monotonic() - start
            sleep_for = max(0, self._interval - elapsed)
            logger.info(f"Refresh took {elapsed:.1f}s, next in {sleep_for:.1f}s")
            await asyncio.sleep(sleep_for)

    async def _refresh_all(self):
        tasks = [self._refresh_ticker(t) for t in list(self.tickers)]
        await asyncio.gather(*tasks, return_exceptions=True)

    async def _refresh_ticker(self, ticker: str):
        try:
            spot_price, expirations, contracts = await self._client.fetch_all(ticker)

            result = compute_gex(ticker, spot_price, contracts, expirations)
            self._cache.set(ticker, result)
            logger.info(
                f"Refreshed {ticker}: spot={spot_price:.2f}, "
                f"gex={result.total_gex:.0f}, strikes={len(result.strikes)}"
            )
        except Exception as e:
            logger.error(f"Failed to refresh {ticker}: {e}")

    async def force_refresh(self, ticker: str):
        await self._refresh_ticker(ticker)
