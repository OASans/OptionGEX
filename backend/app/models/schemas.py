from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class StrikeGEXSchema(BaseModel):
    strike: float
    call_gex: float
    put_gex: float
    net_gex: float
    call_oi: int
    put_oi: int


class GEXResultSchema(BaseModel):
    ticker: str
    spot_price: float
    strikes: list[StrikeGEXSchema]
    total_gex: float
    total_call_gex: float
    total_put_gex: float
    flip_point: float | None
    max_gamma_strike: float | None
    max_pain: float | None
    expirations_used: list[str]
    computed_at: datetime
    is_stale: bool


class GEXSummarySchema(BaseModel):
    ticker: str
    spot_price: float
    total_gex: float
    total_call_gex: float
    total_put_gex: float
    flip_point: float | None
    max_gamma_strike: float | None
    max_pain: float | None
    computed_at: datetime
    is_stale: bool


class TickerAddRequest(BaseModel):
    symbol: str


class TickerListResponse(BaseModel):
    tickers: list[str]


class ErrorResponse(BaseModel):
    detail: str
