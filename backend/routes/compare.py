from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import StockPrice
from datetime import date, timedelta
import numpy as np

router = APIRouter(prefix="/compare", tags=["Compare"])


@router.get("", summary="Compare two stocks side-by-side")
def compare_stocks(
    symbol1: str = Query(..., description="First stock symbol e.g. INFY"),
    symbol2: str = Query(..., description="Second stock symbol e.g. TCS"),
    days: int = Query(default=90, ge=7, le=365),
    db: Session = Depends(get_db),
):
    """
    Compare two stocks: returns CAGR-style return, volatility, correlation,
    and daily close series for both over the specified period.
    """
    def normalize(sym):
        s = sym.upper()
        return s if s.endswith(".NS") else s + ".NS"

    s1, s2 = normalize(symbol1), normalize(symbol2)
    cutoff = date.today() - timedelta(days=days)

    def fetch(sym):
        rows = (
            db.query(StockPrice)
            .filter(StockPrice.symbol == sym, StockPrice.date >= cutoff)
            .order_by(StockPrice.date)
            .all()
        )
        return rows

    rows1, rows2 = fetch(s1), fetch(s2)
    if not rows1:
        raise HTTPException(status_code=404, detail=f"No data for {symbol1}")
    if not rows2:
        raise HTTPException(status_code=404, detail=f"No data for {symbol2}")

    def series(rows):
        return {r.date.isoformat(): r.close for r in rows if r.close}

    d1 = series(rows1)
    d2 = series(rows2)
    common_dates = sorted(set(d1.keys()) & set(d2.keys()))

    if len(common_dates) < 2:
        raise HTTPException(status_code=400, detail="Insufficient overlapping data")

    closes1 = np.array([d1[d] for d in common_dates])
    closes2 = np.array([d2[d] for d in common_dates])

    ret1 = (closes1[-1] - closes1[0]) / closes1[0] * 100
    ret2 = (closes2[-1] - closes2[0]) / closes2[0] * 100

    dr1 = np.diff(closes1) / closes1[:-1]
    dr2 = np.diff(closes2) / closes2[:-1]
    vol1 = float(np.std(dr1) * np.sqrt(252) * 100)
    vol2 = float(np.std(dr2) * np.sqrt(252) * 100)
    corr = float(np.corrcoef(dr1, dr2)[0, 1]) if len(dr1) > 1 else 0.0

    return {
        "period_days": days,
        "common_trading_days": len(common_dates),
        "correlation": round(corr, 4),
        "stocks": {
            s1: {
                "symbol": s1,
                "period_return_pct": round(ret1, 2),
                "annualised_volatility_pct": round(vol1, 2),
                "start_price": round(closes1[0], 2),
                "end_price": round(closes1[-1], 2),
            },
            s2: {
                "symbol": s2,
                "period_return_pct": round(ret2, 2),
                "annualised_volatility_pct": round(vol2, 2),
                "start_price": round(closes2[0], 2),
                "end_price": round(closes2[-1], 2),
            },
        },
        "chart_data": {
            "dates": common_dates,
            "series1": [round(float(c), 2) for c in closes1],
            "series2": [round(float(c), 2) for c in closes2],
            # Normalised to 100 for relative comparison
            "series1_normalised": [round(float(c / closes1[0] * 100), 4) for c in closes1],
            "series2_normalised": [round(float(c / closes2[0] * 100), 4) for c in closes2],
        },
    }
