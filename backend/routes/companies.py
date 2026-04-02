from fastapi import APIRouter
from backend.data_collector import COMPANIES

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("", summary="List all available companies")
def list_companies():
    """Returns a list of all tracked NSE blue-chip companies."""
    result = []
    for symbol, info in COMPANIES.items():
        # Strip .NS suffix for display
        display_symbol = symbol.replace(".NS", "")
        result.append({
            "symbol": symbol,
            "display_symbol": display_symbol,
            "name": info["name"],
            "sector": info["sector"],
            "exchange": "NSE",
        })
    return {"companies": result, "total": len(result)}
