import re

# Words that describe prep/size, not the ingredient itself.
_NOISE = {
    "fresh", "chopped", "large", "small", "medium", "diced", "sliced", "minced",
    "ripe", "boiled", "cooked", "raw", "grated", "crushed", "peeled", "frozen",
    "finely", "roughly", "optional", "organic",
}

# unit alias -> (base unit, factor to base)
_UNITS = {
    "g": ("g", 1), "gram": ("g", 1), "grams": ("g", 1),
    "kg": ("g", 1000), "kilogram": ("g", 1000), "kilograms": ("g", 1000),
    "oz": ("g", 28.35), "ounce": ("g", 28.35), "ounces": ("g", 28.35),
    "lb": ("g", 453.6), "lbs": ("g", 453.6), "pound": ("g", 453.6), "pounds": ("g", 453.6),
    "ml": ("ml", 1), "milliliter": ("ml", 1), "milliliters": ("ml", 1),
    "l": ("ml", 1000), "liter": ("ml", 1000), "liters": ("ml", 1000),
    "litre": ("ml", 1000), "litres": ("ml", 1000),
    "": ("pcs", 1), "pcs": ("pcs", 1), "pc": ("pcs", 1), "piece": ("pcs", 1),
    "pieces": ("pcs", 1), "whole": ("pcs", 1), "item": ("pcs", 1), "items": ("pcs", 1),
    "clove": ("pcs", 1), "cloves": ("pcs", 1), "count": ("pcs", 1),
}


def normalize_name(name: str) -> str:
    """'Fresh Tomatoes (chopped)' -> 'tomato'. Singularizes the last word only."""
    name = re.sub(r"\(.*?\)", " ", name.lower())
    words = [w for w in re.findall(r"[a-z]+", name) if w not in _NOISE]
    if not words:
        return ""
    last = words[-1]
    if last.endswith("ies") and len(last) > 4:
        last = last[:-3] + "y"
    elif last.endswith("oes"):
        last = last[:-2]
    elif last.endswith("s") and not last.endswith(("ss", "us")) and len(last) > 3:
        last = last[:-1]
    words[-1] = last
    return " ".join(words)


def to_base(quantity: float, unit: str) -> tuple[float, str]:
    """Convert to g / ml / pcs. Unknown units (tbsp, cup, bunch...) are kept as-is,
    so they only merge with the same unit. shortcut: no tsp/cup conversion, add if needed."""
    u = unit.strip().lower().rstrip(".")
    if u in _UNITS:
        base, factor = _UNITS[u]
        return quantity * factor, base
    return quantity, u


def from_base(quantity: float, unit: str) -> tuple[float, str]:
    """Pick a friendly display unit: 1500 g -> 1.5 kg, 2.2 pcs -> 3 pcs."""
    if unit == "g" and quantity >= 1000:
        return round(quantity / 1000, 2), "kg"
    if unit == "ml" and quantity >= 1000:
        return round(quantity / 1000, 2), "l"
    if unit == "pcs":
        return float(-(-quantity // 1)), "pcs"  # ceil: you cannot buy 0.2 of an egg
    if unit in ("g", "ml"):
        return float(round(quantity)), unit
    return round(quantity, 2), unit
