from sqlalchemy import Column, Integer, String, Float, BigInteger, Index
from database import Base


class Kline(Base):
    __tablename__ = "klines"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(32), nullable=False)
    timeframe = Column(String(8), nullable=False)
    timestamp = Column(BigInteger, nullable=False)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)

    __table_args__ = (
        Index("ix_kline_symbol_tf_ts", "symbol", "timeframe", "timestamp", unique=True),
    )


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(32), nullable=False)
    direction = Column(String(8), nullable=False)
    leverage = Column(Float, default=1.0)
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float)
    profit = Column(Float)
    profit_rate = Column(Float)
    entry_time = Column(BigInteger, nullable=False)
    exit_time = Column(BigInteger)
    margin = Column(Float)

    __table_args__ = (Index("ix_trade_symbol", "symbol"),)
