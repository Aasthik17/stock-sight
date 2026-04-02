from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./stocksight.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _migrate_sqlite_columns():
    """Add columns introduced after first deploy (SQLite does not auto-alter)."""
    insp = inspect(engine)
    if "stock_prices" not in insp.get_table_names():
        return
    existing = {c["name"] for c in insp.get_columns("stock_prices")}
    with engine.begin() as conn:
        if "week52_high" not in existing:
            conn.execute(text("ALTER TABLE stock_prices ADD COLUMN week52_high FLOAT"))
        if "week52_low" not in existing:
            conn.execute(text("ALTER TABLE stock_prices ADD COLUMN week52_low FLOAT"))


def init_db():
    from backend.models import StockPrice, Company  # noqa
    Base.metadata.create_all(bind=engine)
    _migrate_sqlite_columns()
