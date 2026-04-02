"""
data_collector.py
Fetches real NSE stock data via yfinance, cleans it with Pandas,
and computes derived metrics. Data is persisted to SQLite.
"""
import logging
from datetime import datetime, date, timedelta
from typing import Optional
import pandas as pd
import numpy as np
import yfinance as yf
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# 15 NSE Blue-chip stocks
COMPANIES = {
    "RELIANCE.NS": {"name": "Reliance Industries", "sector": "Energy"},
    "TCS.NS": {"name": "Tata Consultancy Services", "sector": "IT"},
    "INFY.NS": {"name": "Infosys", "sector": "IT"},
    "HDFCBANK.NS": {"name": "HDFC Bank", "sector": "Banking"},
    "ICICIBANK.NS": {"name": "ICICI Bank", "sector": "Banking"},
    "BAJFINANCE.NS": {"name": "Bajaj Finance", "sector": "NBFC"},
    "HINDUNILVR.NS": {"name": "Hindustan Unilever", "sector": "FMCG"},
    "ITC.NS": {"name": "ITC", "sector": "FMCG"},
    "KOTAKBANK.NS": {"name": "Kotak Mahindra Bank", "sector": "Banking"},
    "LT.NS": {"name": "Larsen & Toubro", "sector": "Infrastructure"},
    "AXISBANK.NS": {"name": "Axis Bank", "sector": "Banking"},
    "MARUTI.NS": {"name": "Maruti Suzuki", "sector": "Automobile"},
    "NESTLEIND.NS": {"name": "Nestle India", "sector": "FMCG"},
    "SUNPHARMA.NS": {"name": "Sun Pharma", "sector": "Pharma"},
    "WIPRO.NS": {"name": "Wipro", "sector": "IT"},
}


def compute_rsi(series: pd.Series, window: int = 14) -> pd.Series:
    """Compute RSI-14 — a widely-used momentum oscillator."""
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(com=window - 1, min_periods=window).mean()
    avg_loss = loss.ewm(com=window - 1, min_periods=window).mean()
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def compute_volatility_score(daily_returns: pd.Series, window: int = 30) -> pd.Series:
    """
    Annualised rolling volatility (custom metric).
    volatility_score = rolling_std(daily_returns, window) * sqrt(252)
    """
    return daily_returns.rolling(window=window, min_periods=5).std() * np.sqrt(252)


def fetch_and_clean(symbol: str, period: str = "1y") -> Optional[pd.DataFrame]:
    """
    Fetch OHLCV data from yfinance, clean it, and add derived metrics.
    Returns None on failure.
    """
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period)

        if df.empty:
            logger.warning(f"No data returned for {symbol}")
            return None

        # --- Cleaning ---
        df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
        df.index = pd.to_datetime(df.index).normalize()
        df.index = df.index.tz_localize(None)  # strip timezone
        df.columns = ["open", "high", "low", "close", "volume"]
        df.dropna(subset=["close"], inplace=True)
        df.sort_index(inplace=True)

        # --- Metrics ---
        # Daily Return = (CLOSE - OPEN) / OPEN (undefined when open is 0 or missing)
        df["daily_return"] = (df["close"] - df["open"]) / df["open"]
        df.loc[df["open"].eq(0) | df["open"].isna(), "daily_return"] = np.nan
        # ~52 trading weeks ≈ 252 sessions — rolling high/low bands
        df["week52_high"] = df["high"].rolling(window=252, min_periods=5).max()
        df["week52_low"] = df["low"].rolling(window=252, min_periods=5).min()
        df["ma7"] = df["close"].rolling(window=7, min_periods=1).mean()
        df["ma20"] = df["close"].rolling(window=20, min_periods=1).mean()
        df["rsi"] = compute_rsi(df["close"])
        df["volatility_score"] = compute_volatility_score(df["daily_return"])

        # Round to 4 decimal places
        numeric_cols = [
            "open", "high", "low", "close", "daily_return", "ma7", "ma20",
            "rsi", "volatility_score", "week52_high", "week52_low",
        ]
        df[numeric_cols] = df[numeric_cols].round(4)

        df.index.name = "date"
        return df

    except Exception as e:
        logger.error(f"Error fetching {symbol}: {e}")
        return None


def seed_database(db: Session):
    """Seed the database with company info and 1-year of stock prices."""
    from backend.models import Company, StockPrice

    # Insert companies
    for symbol, info in COMPANIES.items():
        existing = db.query(Company).filter(Company.symbol == symbol).first()
        if not existing:
            db.add(Company(symbol=symbol, name=info["name"], sector=info["sector"]))
    db.commit()

    # Fetch + insert prices
    for symbol in COMPANIES:
        existing_count = db.query(StockPrice).filter(StockPrice.symbol == symbol).count()
        if existing_count > 200:  # already seeded
            logger.info(f"Skipping {symbol} — already in DB")
            continue

        logger.info(f"Fetching data for {symbol}...")
        df = fetch_and_clean(symbol)
        if df is None:
            continue

        # Delete old entries for this symbol before re-inserting
        db.query(StockPrice).filter(StockPrice.symbol == symbol).delete()

        records = []
        for idx, row in df.iterrows():
            records.append(StockPrice(
                symbol=symbol,
                date=idx.date(),
                open=row["open"],
                high=row["high"],
                low=row["low"],
                close=row["close"],
                volume=row["volume"],
                daily_return=None if pd.isna(row["daily_return"]) else row["daily_return"],
                ma7=row["ma7"],
                ma20=row["ma20"],
                rsi=None if pd.isna(row["rsi"]) else row["rsi"],
                volatility_score=None if pd.isna(row["volatility_score"]) else row["volatility_score"],
                week52_high=None if pd.isna(row["week52_high"]) else row["week52_high"],
                week52_low=None if pd.isna(row["week52_low"]) else row["week52_low"],
            ))
        db.bulk_save_objects(records)
        db.commit()
        logger.info(f"  ✓ Saved {len(records)} rows for {symbol}")


def get_stock_df(symbol: str, db: Session, days: int = 30) -> pd.DataFrame:
    """Retrieve stock data from DB as a DataFrame (last `days` calendar days)."""
    from backend.models import StockPrice
    today = date.today()
    show_cutoff = today - timedelta(days=days)
    # Extra history so rolling 52-week metrics can be computed for early rows in the window
    extend_cutoff = today - timedelta(days=days + 450)
    rows = (
        db.query(StockPrice)
        .filter(StockPrice.symbol == symbol, StockPrice.date >= extend_cutoff)
        .order_by(StockPrice.date)
        .all()
    )
    if not rows:
        return pd.DataFrame()

    data = [{
        "date": r.date.isoformat(),
        "open": r.open,
        "high": r.high,
        "low": r.low,
        "close": r.close,
        "volume": int(r.volume) if r.volume else 0,
        "daily_return": r.daily_return,
        "ma7": r.ma7,
        "ma20": r.ma20,
        "rsi": r.rsi,
        "volatility_score": r.volatility_score,
    } for r in rows]
    df = pd.DataFrame(data)
    # Rolling 52-week high / low from OHLC (matches Part 1 metrics on the returned window)
    df["week52_high"] = df["high"].rolling(window=252, min_periods=5).max().round(4)
    df["week52_low"] = df["low"].rolling(window=252, min_periods=5).min().round(4)
    df = df[df["date"] >= show_cutoff.isoformat()].reset_index(drop=True)
    return df
