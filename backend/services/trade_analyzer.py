from sqlalchemy.orm import Session
from sqlalchemy import func
from models import Trade
from services.symbol_utils import is_valid_symbol


class TradeAnalyzer:
    def calculate_stats(self, db: Session) -> dict:
        trades = [t for t in db.query(Trade).filter(Trade.profit.isnot(None)).all() if is_valid_symbol(t.symbol)]

        if not trades:
            return {
                "total_pnl": 0,
                "win_rate": 0,
                "profit_factor": 0,
                "max_drawdown": 0,
                "avg_holding_time": 0,
                "symbol_distribution": {},
                "trade_count": 0,
            }

        # Total PnL
        total_pnl = sum(t.profit for t in trades)

        # Win rate
        wins = [t for t in trades if t.profit > 0]
        win_rate = len(wins) / len(trades) if trades else 0

        # Profit factor
        total_profit = sum(t.profit for t in wins) if wins else 0
        losses = [t for t in trades if t.profit < 0]
        total_loss = abs(sum(t.profit for t in losses)) if losses else 0
        profit_factor = total_profit / total_loss if total_loss > 0 else total_profit

        # Max drawdown
        cumulative = []
        running = 0
        for t in sorted(trades, key=lambda x: x.entry_time):
            running += t.profit
            cumulative.append(running)

        peak = cumulative[0]
        max_drawdown = 0
        for val in cumulative:
            if val > peak:
                peak = val
            dd = peak - val
            if dd > max_drawdown:
                max_drawdown = dd

        # Avg holding time (ms -> hours)
        holding_times = []
        for t in trades:
            if t.exit_time and t.entry_time:
                holding_times.append(t.exit_time - t.entry_time)
        avg_holding_ms = sum(holding_times) / len(holding_times) if holding_times else 0
        avg_holding_hours = avg_holding_ms / (1000 * 60 * 60)

        # Symbol distribution
        symbol_dist = {}
        for t in trades:
            symbol_dist[t.symbol] = symbol_dist.get(t.symbol, 0) + 1

        return {
            "total_pnl": round(total_pnl, 2),
            "win_rate": round(win_rate * 100, 2),
            "profit_factor": round(profit_factor, 2),
            "max_drawdown": round(max_drawdown, 2),
            "avg_holding_time": round(avg_holding_hours, 2),
            "symbol_distribution": symbol_dist,
            "trade_count": len(trades),
        }


trade_analyzer = TradeAnalyzer()
