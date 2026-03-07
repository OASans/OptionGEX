from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.responses import JSONResponse

from app.models.schemas import GEXResultSchema, GEXSummarySchema
from app.services.gex_engine import compute_gex

router = APIRouter(prefix="/api/gex", tags=["gex"])


@router.get("/all", response_model=list[GEXSummarySchema])
async def get_all_gex(request: Request):
    cache = request.app.state.cache
    scheduler = request.app.state.scheduler
    summaries = []
    for ticker in scheduler.tickers:
        result = cache.get(ticker)
        if result is None:
            continue
        summaries.append(
            GEXSummarySchema(
                ticker=result.ticker,
                spot_price=result.spot_price,
                total_gex=result.total_gex,
                total_call_gex=result.total_call_gex,
                total_put_gex=result.total_put_gex,
                flip_point=result.flip_point,
                max_gamma_strike=result.max_gamma_strike,
                max_pain=result.max_pain,
                computed_at=result.computed_at,
                is_stale=result.is_stale,
            )
        )
    return summaries


def _result_to_schema(result) -> GEXResultSchema:
    return GEXResultSchema(
        ticker=result.ticker,
        spot_price=result.spot_price,
        strikes=[
            {
                "strike": s.strike,
                "call_gex": s.call_gex,
                "put_gex": s.put_gex,
                "net_gex": s.net_gex,
                "call_oi": s.call_oi,
                "put_oi": s.put_oi,
            }
            for s in result.strikes
        ],
        total_gex=result.total_gex,
        total_call_gex=result.total_call_gex,
        total_put_gex=result.total_put_gex,
        flip_point=result.flip_point,
        max_gamma_strike=result.max_gamma_strike,
        max_pain=result.max_pain,
        expirations_used=result.expirations_used,
        available_expirations=result.available_expirations,
        computed_at=result.computed_at,
        is_stale=result.is_stale,
    )


@router.get("/{ticker}", response_model=GEXResultSchema)
async def get_gex(
    ticker: str,
    request: Request,
    expirations: str | None = Query(None, description="Comma-separated expiration dates to include"),
):
    ticker = ticker.upper()
    cache = request.app.state.cache

    # If specific expirations requested, re-compute from raw data
    if expirations:
        raw = cache.get_raw(ticker)
        if raw is None:
            if ticker in request.app.state.scheduler.tickers:
                return JSONResponse(
                    status_code=202,
                    content={"detail": f"Data for {ticker} is being computed"},
                )
            raise HTTPException(status_code=404, detail=f"Ticker {ticker} is not watched")

        spot, all_exps, all_contracts = raw
        selected = [e.strip() for e in expirations.split(",")]
        filtered_contracts = [c for c in all_contracts if c.expiration in selected]
        result = compute_gex(ticker, spot, filtered_contracts, selected)
        result.available_expirations = all_exps
        return _result_to_schema(result)

    # Default: return pre-computed result
    result = cache.get(ticker)
    if result is None:
        if ticker in request.app.state.scheduler.tickers:
            return JSONResponse(
                status_code=202,
                content={"detail": f"Data for {ticker} is being computed"},
            )
        raise HTTPException(status_code=404, detail=f"Ticker {ticker} is not watched")

    # Attach available expirations from raw data
    raw = cache.get_raw(ticker)
    if raw:
        result.available_expirations = raw[1]

    return _result_to_schema(result)
