from sqlalchemy import Column, String, Float, Date, Integer, DateTime
from sqlalchemy.sql import func
from backend.database import Base


class Company(Base):
    __tablename__ = "companies"

    symbol = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sector = Column(String, nullable=False)
    exchange = Column(String, default="NSE")
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())


class StockPrice(Base):
    __tablename__ = "stock_prices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String, index=True, nullable=False)
    date = Column(Date, nullable=False)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)
    daily_return = Column(Float)
    ma7 = Column(Float)
    ma20 = Column(Float)
    rsi = Column(Float)
    volatility_score = Column(Float)
    week52_high = Column(Float)
    week52_low = Column(Float)
