from services.binance_trade_aggregate import Fill, aggregate_fills_to_trades


def test_long_round_trip():
    fills = [
        Fill(time_ms=1000, symbol="BTCUSDT", side="BUY", price=100.0, qty=1.0, realized_pnl=0.0),
        Fill(time_ms=2000, symbol="BTCUSDT", side="SELL", price=110.0, qty=1.0, realized_pnl=10.0),
    ]
    trades = aggregate_fills_to_trades(fills)
    assert len(trades) == 1
    t = trades[0]
    assert t.direction == "long"
    assert t.entry_price == 100.0
    assert t.exit_price == 110.0
    assert t.profit == 10.0
    assert t.exit_time == 2000