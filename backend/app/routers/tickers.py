import json
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import TickerAddRequest, TickerListResponse

router = APIRouter(prefix="/api/tickers", tags=["tickers"])
logger = logging.getLogger(__name__)

TICKERS_FILE = Path(__file__).parent.parent.parent / "tickers.json"


def load_tickers() -> list[str]:
    if TICKERS_FILE.exists():
        return json.loads(TICKERS_FILE.read_text())
    return []


def save_tickers(tickers: list[str]):
    TICKERS_FILE.write_text(json.dumps(tickers))


@router.get("", response_model=TickerListResponse)
async def list_tickers(request: Request):
    return TickerListResponse(tickers=list(request.app.state.scheduler.tickers))


@router.post("", response_model=TickerListResponse, status_code=201)
async def add_ticker(body: TickerAddRequest, request: Request):
    symbol = body.symbol.upper().strip()
    if not symbol:
        raise HTTPException(status_code=400, detail="Symbol cannot be empty")

    scheduler = request.app.state.scheduler
    settings = request.app.state.settings

    if symbol in scheduler.tickers:
        raise HTTPException(status_code=409, detail=f"{symbol} is already watched")

    if len(scheduler.tickers) >= settings.max_tickers:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {settings.max_tickers} tickers allowed",
        )

    # Validate the symbol exists by fetching a quote
    try:
        await request.app.state.client.get_quote(symbol)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid symbol: {symbol}")

    scheduler.tickers.append(symbol)
    save_tickers(scheduler.tickers)

    # Trigger immediate refresh for the new ticker
    await scheduler.force_refresh(symbol)

    return TickerListResponse(tickers=list(scheduler.tickers))


@router.delete("/{symbol}", response_model=TickerListResponse)
async def remove_ticker(symbol: str, request: Request):
    symbol = symbol.upper()
    scheduler = request.app.state.scheduler

    if symbol not in scheduler.tickers:
        raise HTTPException(status_code=404, detail=f"{symbol} is not watched")

    scheduler.tickers.remove(symbol)
    request.app.state.cache.remove(symbol)
    save_tickers(scheduler.tickers)

    return TickerListResponse(tickers=list(scheduler.tickers))
