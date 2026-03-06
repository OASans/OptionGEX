from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    default_tickers: list[str] = ["SPY"]
    refresh_interval: int = 30
    cache_ttl: int = 90
    max_expirations: int = 4
    max_tickers: int = 10

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}
