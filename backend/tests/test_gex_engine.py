from app.models.domain import OptionContract
from app.services.gex_engine import compute_gex


def _make_contract(strike, option_type, gamma, oi):
    return OptionContract(
        strike=strike,
        option_type=option_type,
        gamma=gamma,
        open_interest=oi,
        expiration="2026-03-20",
    )


def test_single_call():
    contracts = [_make_contract(100.0, "call", 0.05, 1000)]
    result = compute_gex("TEST", 100.0, contracts, ["2026-03-20"])

    # gex = 0.05 * 1000 * 100 * 100^2 * 0.01 = 50000
    expected = 0.05 * 1000 * 100 * 100.0 * 100.0 * 0.01
    assert len(result.strikes) == 1
    assert abs(result.strikes[0].call_gex - expected) < 0.01
    assert result.strikes[0].put_gex == 0.0
    assert abs(result.total_gex - expected) < 0.01
    assert result.total_put_gex == 0.0


def test_single_put():
    contracts = [_make_contract(100.0, "put", 0.05, 1000)]
    result = compute_gex("TEST", 100.0, contracts, ["2026-03-20"])

    expected = -(0.05 * 1000 * 100 * 100.0 * 100.0 * 0.01)
    assert abs(result.strikes[0].put_gex - expected) < 0.01
    assert result.strikes[0].call_gex == 0.0
    assert abs(result.total_gex - expected) < 0.01


def test_call_put_netting():
    contracts = [
        _make_contract(100.0, "call", 0.05, 1000),
        _make_contract(100.0, "put", 0.03, 1000),
    ]
    result = compute_gex("TEST", 100.0, contracts, ["2026-03-20"])

    call_gex = 0.05 * 1000 * 100 * 10000 * 0.01
    put_gex = -(0.03 * 1000 * 100 * 10000 * 0.01)
    assert len(result.strikes) == 1
    assert abs(result.strikes[0].net_gex - (call_gex + put_gex)) < 0.01


def test_flip_point():
    # Create strikes where net GEX crosses zero
    contracts = [
        _make_contract(95.0, "put", 0.04, 2000),   # strong negative
        _make_contract(100.0, "call", 0.05, 1500),  # strong positive
        _make_contract(105.0, "call", 0.03, 1000),  # positive
    ]
    result = compute_gex("TEST", 100.0, contracts, ["2026-03-20"])
    # Cumulative: 95->-800K, 100->-50K, 105->+250K, crosses zero between 100 and 105
    assert result.flip_point is not None
    assert 100.0 < result.flip_point < 105.0


def test_max_gamma_strike():
    contracts = [
        _make_contract(95.0, "call", 0.01, 100),
        _make_contract(100.0, "call", 0.10, 5000),
        _make_contract(105.0, "call", 0.02, 200),
    ]
    result = compute_gex("TEST", 100.0, contracts, ["2026-03-20"])
    assert result.max_gamma_strike == 100.0


def test_empty_contracts():
    result = compute_gex("TEST", 100.0, [], ["2026-03-20"])
    assert result.strikes == []
    assert result.total_gex == 0.0
    assert result.flip_point is None
    assert result.max_gamma_strike is None
