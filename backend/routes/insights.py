from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import StockPrice
from backend.data_collector import COMPANIES
from datetime import date, timedelta

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("/top-movers", summary="Top 5 gainers and losers")
def top_movers(db: Session = Depends(get_db)):
    """
    Returns the top 5 gainers and top 5 losers based on yesterday's daily return.
    Falls back to the last available trading day.
    """
    today = date.today()
    # Try last 5 days to find a trading day
    for offset in range(1, 6):
        target_date = today - timedelta(days=offset)
        rows = db.query(StockPrice).filter(StockPrice.date == target_date).all()
        if rows:
            break

    if not rows:
        return {
            "trading_date": None,
            "top_gainers": [],
            "top_losers": [],
            "message": "No recent trading data available"
        }

    scored = []
    for r in rows:
        if r.daily_return is not None:
            info = COMPANIES.get(r.symbol, {})
            scored.append({
                "symbol": r.symbol,
                "display_symbol": r.symbol.replace(".NS", ""),
                "name": info.get("name", r.symbol),
                "sector": info.get("sector", "—"),
                "close": round(r.close, 2),
                "daily_return_pct": round(r.daily_return * 100, 2),
                "date": r.date.isoformat(),
            })

    scored.sort(key=lambda x: x["daily_return_pct"], reverse=True)
    return {
        "trading_date": target_date.isoformat(),
        "top_gainers": scored[:5],
        "top_losers": scored[-5:][::-1],
    }


@router.get("/market-overview", summary="Market-wide summary stats")
def market_overview(db: Session = Depends(get_db)):
    """Returns aggregated market stats: average return, most volatile, most RSI overbought."""
    today = date.today()
    for offset in range(1, 6):
        target_date = today - timedelta(days=offset)
        rows = db.query(StockPrice).filter(StockPrice.date == target_date).all()
        if rows:
            break

    if not rows:
        return {
            "trading_date": None,
            "market_avg_return_pct": 0,
            "advancing_stocks": 0,
            "declining_stocks": 0,
            "total_stocks": 0,
            "overbought_rsi": [],
            "oversold_rsi": [],
            "most_volatile": [],
            "message": "No data available"
        }

    stats = []
    for r in rows:
        info = COMPANIES.get(r.symbol, {})
        stats.append({
            "symbol": r.symbol,
            "display_symbol": r.symbol.replace(".NS", ""),
            "name": info.get("name", r.symbol),
            "sector": info.get("sector", "—"),
            "rsi": r.rsi,
            "volatility_score": r.volatility_score,
            "daily_return_pct": round((r.daily_return or 0) * 100, 2),
            "close": round(r.close, 2),
        })

    avg_return = sum(s["daily_return_pct"] for s in stats) / len(stats)
    positive_count = sum(1 for s in stats if s["daily_return_pct"] > 0)

    overbought = [s for s in stats if s["rsi"] and s["rsi"] > 70]
    oversold = [s for s in stats if s["rsi"] and s["rsi"] < 30]

    most_volatile = sorted([s for s in stats if s["volatility_score"]], key=lambda x: x["volatility_score"], reverse=True)[:3]

    return {
        "trading_date": target_date.isoformat(),
        "market_avg_return_pct": round(avg_return, 2),
        "advancing_stocks": positive_count,
        "declining_stocks": len(stats) - positive_count,
        "total_stocks": len(stats),
        "overbought_rsi": overbought,
        "oversold_rsi": oversold,
        "most_volatile": most_volatile,
    }
