import json
import re
from functools import lru_cache
from pathlib import Path

from app.services.units import normalize_name, to_base

# Fallback prices (USD) for ingredients missing from the dataset.
_DEFAULT_PER_100G = 0.6
_DEFAULT_PER_100ML = 0.4
_DEFAULT_PER_PCS = 0.5


@lru_cache
def _data() -> dict:
    return json.loads((Path(__file__).with_name("price_data.json")).read_text(encoding="utf-8"))


def currency(country: str) -> dict:
    # shortcut: US dataset only, other countries fall back to it. Add per-country tables when needed.
    countries = _data()["countries"]
    return countries.get(country.upper(), countries["US"])


@lru_cache(maxsize=2048)
def lookup(name: str) -> tuple[str, dict] | None:
    """Find the dataset entry for a normalized name: exact, else longest key present as whole words."""
    items = _data()["items"]
    if name in items:
        return name, items[name]
    for key in sorted(items, key=len, reverse=True):
        if re.search(rf"\b{re.escape(key)}\b", name):
            return key, items[key]
    return None


def category(name: str) -> str:
    hit = lookup(normalize_name(name))
    return hit[1]["category"] if hit else "Other"


def estimate_cost(name: str, quantity: float, unit: str) -> float:
    """Estimated USD cost of `quantity unit` of `name` from the predefined price table."""
    qty, base = to_base(quantity, unit)
    hit = lookup(normalize_name(name))
    if hit is None or base not in ("g", "ml", "pcs"):
        return round(_fallback(qty, base), 2)
    entry = hit[1]
    price, price_unit, pcs_g = entry["price"], entry["unit"], entry.get("pcs_g")
    if price_unit == "kg":
        grams = qty if base == "g" else qty * pcs_g if base == "pcs" and pcs_g else None
        if grams is not None:
            return round(grams / 1000 * price, 2)
    elif price_unit == "l" and base == "ml":
        return round(qty / 1000 * price, 2)
    elif price_unit == "pcs":
        pieces = qty if base == "pcs" else qty / pcs_g if base == "g" and pcs_g else None
        if pieces is not None:
            return round(pieces * price, 2)
    return round(_fallback(qty, base), 2)


def _fallback(qty: float, base: str) -> float:
    if base == "g":
        return qty / 100 * _DEFAULT_PER_100G
    if base == "ml":
        return qty / 100 * _DEFAULT_PER_100ML
    return qty * _DEFAULT_PER_PCS if base == "pcs" else 0.0
