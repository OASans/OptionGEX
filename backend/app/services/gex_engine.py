from __future__ import annotations

from collections import defaultdict

from app.models.domain import GEXResult, OptionContract, StrikeGEX


def compute_gex(
    ticker: str,
    spot_price: float,
    contracts: list[OptionContract],
    expirations_used: list[str],
) -> GEXResult:
    call_by_strike: dict[float, float] = defaultdict(float)
    put_by_strike: dict[float, float] = defaultdict(float)

    for c in contracts:
        gex = c.gamma * c.open_interest * 100 * spot_price * spot_price * 0.01
        if c.option_type == "call":
            call_by_strike[c.strike] += gex
        else:
            put_by_strike[c.strike] -= gex  # puts contribute negative

    all_strikes = sorted(set(call_by_strike.keys()) | set(put_by_strike.keys()))

    strikes = []
    for s in all_strikes:
        cg = call_by_strike.get(s, 0.0)
        pg = put_by_strike.get(s, 0.0)
        strikes.append(StrikeGEX(strike=s, call_gex=cg, put_gex=pg, net_gex=cg + pg))

    total_call_gex = sum(s.call_gex for s in strikes)
    total_put_gex = sum(s.put_gex for s in strikes)
    total_gex = total_call_gex + total_put_gex

    # Flip point: where cumulative net GEX crosses zero
    flip_point = _find_flip_point(strikes)

    # Max gamma strike
    max_gamma_strike = None
    if strikes:
        max_strike = max(strikes, key=lambda s: abs(s.net_gex))
        max_gamma_strike = max_strike.strike

    max_pain = _find_max_pain(contracts, all_strikes)

    return GEXResult(
        ticker=ticker,
        spot_price=spot_price,
        strikes=strikes,
        total_gex=total_gex,
        total_call_gex=total_call_gex,
        total_put_gex=total_put_gex,
        flip_point=flip_point,
        max_gamma_strike=max_gamma_strike,
        max_pain=max_pain,
        expirations_used=expirations_used,
    )


def _find_max_pain(contracts: list[OptionContract], strikes: list[float]) -> float | None:
    """Max pain = strike where total payout to option holders is minimized."""
    if not contracts or not strikes:
        return None

    call_oi: dict[float, int] = defaultdict(int)
    put_oi: dict[float, int] = defaultdict(int)
    for c in contracts:
        if c.option_type == "call":
            call_oi[c.strike] += c.open_interest
        else:
            put_oi[c.strike] += c.open_interest

    min_pain = float("inf")
    max_pain_strike = strikes[0]

    for expiry_price in strikes:
        total_pain = 0.0
        for strike, oi in call_oi.items():
            if expiry_price > strike:
                total_pain += (expiry_price - strike) * oi * 100
        for strike, oi in put_oi.items():
            if expiry_price < strike:
                total_pain += (strike - expiry_price) * oi * 100
        if total_pain < min_pain:
            min_pain = total_pain
            max_pain_strike = expiry_price

    return max_pain_strike


def _find_flip_point(strikes: list[StrikeGEX]) -> float | None:
    """Find the strike where net GEX per strike changes sign (nearest to center)."""
    if len(strikes) < 2:
        return None

    # Find all zero-crossings in net_gex (per-strike, not cumulative)
    crossings = []
    for i in range(1, len(strikes)):
        prev = strikes[i - 1]
        curr = strikes[i]
        if prev.net_gex * curr.net_gex < 0:
            # Linear interpolation
            denom = curr.net_gex - prev.net_gex
            if denom == 0:
                continue
            ratio = -prev.net_gex / denom
            cross = prev.strike + ratio * (curr.strike - prev.strike)
            crossings.append(cross)

    if not crossings:
        return None

    # Return the crossing nearest to the middle of the strike range
    mid = (strikes[0].strike + strikes[-1].strike) / 2
    return min(crossings, key=lambda c: abs(c - mid))
