from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.data_collector import get_stock_df, normalize_symbol, refresh_symbol_data

router = APIRouter(prefix="/data", tags=["Stock Data"])


@router.get("/{symbol}", summary="Get historical stock data")
def get_stock_data(
    symbol: str,
    days: int = Query(default=30, ge=7, le=365, description="Number of past days to fetch"),
    db: Session = Depends(get_db),
):
    """
    Returns OHLCV data + computed metrics: daily_return, MA7, MA20, rolling 52-week
    high/low, RSI-14, and volatility score for the specified symbol over the period.
    """
    symbol_upper = normalize_symbol(symbol)

    df = get_stock_df(symbol_upper, db, days=days)
    if df.empty:
        if refresh_symbol_data(db, symbol_upper):
            df = get_stock_df(symbol_upper, db, days=days)

    if df.empty:
        raise HTTPException(status_code=404, detail=f"No data found for symbol: {symbol}")

    records = df.to_dict(orient="records")
    return {
        "symbol": symbol_upper,
        "period_days": days,
        "count": len(records),
        "data": records,
    }
