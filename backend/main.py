import tempfile
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from models import Trade
from services.kline_service import kline_service, TIMEFRAMES
from services.trade_importer import trade_importer
from services.trade_analyzer import trade_analyzer
from services.symbol_utils import normalize_symbol, is_valid_symbol

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Trading Replay API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/klines/{symbol}/{timeframe}")
def get_klines(
    symbol: str,
    timeframe: str,
    response: Response,
    nocache: bool = Query(False, description="Disable server-side cache"),
    limit: int = 500,
    start: Optional[int] = Query(None, description="Start timestamp (ms)"),
    end: Optional[int] = Query(None, description="End timestamp (ms)"),
    db: Session = Depends(get_db),
):
    if timeframe not in TIMEFRAMES:
        raise HTTPException(400, f"Invalid timeframe. Supported: {TIMEFRAMES}")
    try:
        response.headers["Cache-Control"] = "no-store, no-cache, max-age=0, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        data = kline_service.fetch_klines_range(
            db,
            symbol,
            timeframe,
            limit=limit,
            start_ts=start,
            end_ts=end,
            force_refresh=nocache,
        )
        if (start is not None or end is not None) and not data:
            raise HTTPException(404, "No klines found for requested range")
        return {"symbol": symbol, "timeframe": timeframe, "data": data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"get_klines failed symbol={symbol} tf={timeframe} start={start} end={end}: {e!r}")
        raise HTTPException(502, f"Failed to fetch klines: {type(e).__name__}")


@app.post("/api/trades/import")
async def import_trades(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(400, "Only Excel files (.xlsx, .xls) are supported")
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        result = trade_importer.parse_excel(db, tmp_path)
        return result
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/api/trades")
def get_trades(
    symbol: Optional[str] = None,
    start_date: Optional[int] = Query(None, description="Start timestamp (ms)"),
    end_date: Optional[int] = Query(None, description="End timestamp (ms)"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(Trade)
    if symbol:
        normalized = normalize_symbol(symbol)
        if not is_valid_symbol(normalized):
            return {"total": 0, "page": page, "limit": limit, "data": []}
        query = query.filter(Trade.symbol == normalized)
    if start_date:
        query = query.filter(Trade.entry_time >= start_date)
    if end_date:
        query = query.filter(Trade.entry_time <= end_date)

    trades = [t for t in query.order_by(Trade.entry_time.desc()).all() if is_valid_symbol(t.symbol)]
    total = len(trades)
    start_idx = (page - 1) * limit
    trades = trades[start_idx:start_idx + limit]

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": [
            {
                "id": t.id,
                "symbol": t.symbol,
                "direction": t.direction,
                "leverage": t.leverage,
                "entry_price": t.entry_price,
                "exit_price": t.exit_price,
                "profit": t.profit,
                "profit_rate": t.profit_rate,
                "margin": t.margin,
                "entry_time": t.entry_time,
                "exit_time": t.exit_time,
            }
            for t in trades
        ],
    }


@app.get("/api/stats/overview")
def get_stats_overview(db: Session = Depends(get_db)):
    return trade_analyzer.calculate_stats(db)
