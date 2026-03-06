from datetime import datetime
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.domain import GEXResult, StrikeGEX
from app.services.cache import GEXCache


def _mock_result():
    return GEXResult(
        ticker="SPY",
        spot_price=500.0,
        strikes=[
            StrikeGEX(strike=495.0, call_gex=1000, put_gex=-2000, net_gex=-1000),
            StrikeGEX(strike=500.0, call_gex=5000, put_gex=-3000, net_gex=2000),
            StrikeGEX(strike=505.0, call_gex=3000, put_gex=-1000, net_gex=2000),
        ],
        total_gex=3000,
        total_call_gex=9000,
        total_put_gex=-6000,
        flip_point=498.0,
        max_gamma_strike=500.0,
        expirations_used=["2026-03-20"],
        computed_at=datetime(2026, 3, 5, 12, 0, 0),
    )


@pytest.fixture
def client():
    app.state.settings = MagicMock()
    app.state.settings.max_tickers = 10
    app.state.cache = GEXCache(ttl=9999)
    app.state.scheduler = MagicMock()
    app.state.scheduler.tickers = ["SPY"]
    app.state.tradier_client = MagicMock()

    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


def test_get_tickers(client):
    resp = client.get("/api/tickers")
    assert resp.status_code == 200
    assert resp.json() == {"tickers": ["SPY"]}


def test_get_gex_cached(client):
    app.state.cache.set("SPY", _mock_result())
    resp = client.get("/api/gex/SPY")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ticker"] == "SPY"
    assert data["spot_price"] == 500.0
    assert len(data["strikes"]) == 3


def test_get_gex_not_watched(client):
    app.state.scheduler.tickers = ["SPY"]
    resp = client.get("/api/gex/AAPL")
    assert resp.status_code == 404


def test_get_gex_computing(client):
    app.state.scheduler.tickers = ["SPY"]
    resp = client.get("/api/gex/SPY")
    assert resp.status_code == 202


def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
