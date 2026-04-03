from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import StockPrice
from backend.ml.predictor import predict_next_7_days
from backend.data_collector import normalize_symbol, refresh_symbol_data
import pandas as pd

router = APIRouter(prefix="/predict", tags=["ML Prediction"])


@router.get("/{symbol}", summary="7-day price prediction using LinearRegression")
def predict(symbol: str, db: Session = Depends(get_db)):
    """
    Fits a LinearRegression model on the last 60 days of close prices
    and returns a 7-day forward prediction.
    
    ⚠️ This is a simplified statistical model for demonstration purposes only.
    """
    symbol_upper = normalize_symbol(symbol)

    from datetime import date, timedelta
    cutoff = date.today() - timedelta(days=90)
    def fetch_rows():
        return (
            db.query(StockPrice)
            .filter(StockPrice.symbol == symbol_upper, StockPrice.date >= cutoff)
            .order_by(StockPrice.date)
            .all()
        )

    rows = fetch_rows()
    if len(rows) < 10 and refresh_symbol_data(db, symbol_upper):
        rows = fetch_rows()

    if len(rows) < 10:
        raise HTTPException(status_code=404, detail=f"Insufficient data for {symbol}")

    close_series = pd.Series([r.close for r in rows])
    last_date = rows[-1].date
    predictions = predict_next_7_days(close_series, last_date)

    latest_close = rows[-1].close
    return {
        "symbol": symbol_upper,
        "model": "LinearRegression (60-day window)",
        "disclaimer": "For demonstration only. Not investment advice.",
        "latest_close": round(latest_close, 2),
        "predictions": predictions,
    }
