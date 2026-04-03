from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import StockPrice
from backend.data_collector import normalize_symbol, refresh_symbol_data
from datetime import date, timedelta

router = APIRouter(prefix="/summary", tags=["Summary"])


@router.get("/{symbol}", summary="52-week summary for a stock")
def get_summary(symbol: str, db: Session = Depends(get_db)):
    """
    Returns 52-week high, 52-week low, average close, latest RSI,
    latest volatility score, and latest daily return for the symbol.
    """
    symbol_upper = normalize_symbol(symbol)

    cutoff = date.today() - timedelta(days=365)
    def fetch_rows():
        return (
            db.query(StockPrice)
            .filter(StockPrice.symbol == symbol_upper, StockPrice.date >= cutoff)
            .order_by(StockPrice.date)
            .all()
        )

    rows = fetch_rows()
    if not rows and refresh_symbol_data(db, symbol_upper):
        rows = fetch_rows()

    if not rows:
        raise HTTPException(status_code=404, detail=f"No data for {symbol}")

    closes = [r.close for r in rows if r.close is not None]
    highs = [r.high for r in rows if r.high is not None]
    lows = [r.low for r in rows if r.low is not None]
    returns = [r.daily_return for r in rows if r.daily_return is not None]

    latest = rows[-1]

    return {
        "symbol": symbol_upper,
        "week52_high": round(max(highs), 2),
        "week52_low": round(min(lows), 2),
        "avg_close": round(sum(closes) / len(closes), 2),
        "latest_close": round(latest.close, 2),
        "latest_rsi": round(latest.rsi, 2) if latest.rsi else None,
        "latest_volatility_score": round(latest.volatility_score, 4) if latest.volatility_score else None,
        "latest_daily_return_pct": round((latest.daily_return or 0) * 100, 2),
        "avg_daily_return_pct": round((sum(returns) / len(returns)) * 100, 4) if returns else 0,
        "data_start": rows[0].date.isoformat(),
        "data_end": latest.date.isoformat(),
        "total_trading_days": len(rows),
    }
