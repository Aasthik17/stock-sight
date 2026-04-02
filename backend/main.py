"""
main.py — StockSight FastAPI Application
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db, SessionLocal
from backend.data_collector import seed_database
from backend.routes import companies, stock_data, summary, compare, insights, predict

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """On startup: initialise DB schema and seed stock data."""
    logger.info("🚀 Starting StockSight backend...")
    init_db()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    logger.info("✅ Database ready")
    yield
    logger.info("🛑 Shutting down StockSight backend")


app = FastAPI(
    title="StockSight API",
    description="""
## 📈 StockSight — NSE Stock Data Intelligence API

A financial data platform providing real-time market insights for 15 NSE blue-chip stocks.

### Features
- **Real data** via yfinance — updated on every startup
- **Computed metrics**: Daily Return, MA7, MA20, RSI-14, Volatility Score
- **52-week** high/low/avg summaries
- **Stock comparison** with correlation analysis
- **Market insights**: top gainers/losers, overbought/oversold
- **ML predictions**: 7-day forward price forecast (LinearRegression)

> ⚠️ For educational/demonstration purposes only. Not investment advice.
""",
    version="1.0.0",
    contact={
        "name": "StockSight",
        "url": "https://github.com/yourusername/stock-sight",
    },
    lifespan=lifespan,
)

# CORS for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(companies.router)
app.include_router(stock_data.router)
app.include_router(summary.router)
app.include_router(compare.router)
app.include_router(insights.router)
app.include_router(predict.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "message": "Welcome to StockSight API 📈",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
