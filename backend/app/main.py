import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings
from app.routers import gex, tickers
from app.services.cache import GEXCache
from app.services.scheduler import GEXScheduler
from app.services.yahoo_client import YahooClient
from app.routers.tickers import load_tickers

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = Settings()
    app.state.settings = settings

    cache = GEXCache(ttl=settings.cache_ttl)
    app.state.cache = cache

    client = YahooClient(max_expirations=settings.max_expirations)
    app.state.client = client

    saved = load_tickers()
    ticker_list = saved if saved else list(settings.default_tickers)

    scheduler = GEXScheduler(
        client=client,
        cache=cache,
        tickers=ticker_list,
        interval=settings.refresh_interval,
    )
    app.state.scheduler = scheduler
    scheduler.start()
    logger.info(f"Scheduler started with tickers: {ticker_list}")

    yield

    await scheduler.stop()
    logger.info("Shutdown complete")


app = FastAPI(title="OptionGEX", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://oasans.github.io",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(gex.router)
app.include_router(tickers.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
