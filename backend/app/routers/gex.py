from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

from app.models.schemas import GEXResultSchema, GEXSummarySchema

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


@router.get("/{ticker}", response_model=GEXResultSchema)
async def get_gex(ticker: str, request: Request):
    ticker = ticker.upper()
    cache = request.app.state.cache
    result = cache.get(ticker)
    if result is None:
        if ticker in request.app.state.scheduler.tickers:
            return JSONResponse(
                status_code=202,
                content={"detail": f"Data for {ticker} is being computed"},
            )
        raise HTTPException(status_code=404, detail=f"Ticker {ticker} is not watched")
    return GEXResultSchema(
        ticker=result.ticker,
        spot_price=result.spot_price,
        strikes=[
            {
                "strike": s.strike,
                "call_gex": s.call_gex,
                "put_gex": s.put_gex,
                "net_gex": s.net_gex,
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
        computed_at=result.computed_at,
        is_stale=result.is_stale,
    )
