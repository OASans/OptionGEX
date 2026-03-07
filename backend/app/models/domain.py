from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class OptionContract:
    strike: float
    option_type: str  # "call" or "put"
    gamma: float
    open_interest: int
    expiration: str


@dataclass
class StrikeGEX:
    strike: float
    call_gex: float
    put_gex: float
    net_gex: float
    call_oi: int = 0
    put_oi: int = 0


@dataclass
class GEXResult:
    ticker: str
    spot_price: float
    strikes: list[StrikeGEX] = field(default_factory=list)
    total_gex: float = 0.0
    total_call_gex: float = 0.0
    total_put_gex: float = 0.0
    flip_point: float | None = None
    max_gamma_strike: float | None = None
    max_pain: float | None = None
    expirations_used: list[str] = field(default_factory=list)
    available_expirations: list[str] = field(default_factory=list)
    computed_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    is_stale: bool = False
