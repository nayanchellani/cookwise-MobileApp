"""Best-effort allergen and diet checks on a generated recipe's ingredient list.

This is a safety net, not a guarantee. It reads ingredient names and the recipe name only (not the
steps), and uses keyword lists, so it can miss hidden or unusual ingredients. The API says so to users.
"""
import re

from app.schemas.recipe import Recipe
from app.services.units import normalize_name

_PLANT_MILKS = [
    "coconut milk", "almond milk", "soy milk", "soya milk", "oat milk", "rice milk", "cashew milk",
    "coconut cream", "coconut yogurt", "peanut butter", "almond butter", "nut butter", "cocoa butter",
    "shea butter", "cream of tartar",
]
_NON_WHEAT_FLOURS = ["rice flour", "gram flour", "chickpea flour", "almond flour", "coconut flour", "corn flour", "cornflour"]

_FISH = {"fish", "salmon", "tuna", "cod", "tilapia", "anchovy", "sardine", "mackerel", "trout", "fish sauce"}
_SHELLFISH = {"shrimp", "prawn", "crab", "lobster", "clam", "mussel", "oyster", "scallop", "crayfish"}
_MEAT = {
    "chicken", "beef", "pork", "lamb", "mutton", "turkey", "duck", "bacon", "ham", "sausage", "salami",
    "pepperoni", "veal", "venison", "meat", "gelatin", "gelatine", "lard", "squid", "octopus",
} | _FISH | _SHELLFISH
_DAIRY = {
    "milk", "cheese", "butter", "cream", "yogurt", "yoghurt", "paneer", "ghee", "whey", "casein", "curd",
    "buttermilk", "custard", "ice cream",
}
_EGG = {"egg", "mayonnaise", "mayo"}
_TREE_NUTS = {"almond", "cashew", "walnut", "pistachio", "hazelnut", "pecan", "macadamia", "pine nut", "brazil nut", "nut"}

# group -> (terms, phrases removed before matching)
_GROUPS: dict[str, tuple[set[str], list[str]]] = {
    "peanut": ({"peanut", "groundnut"}, []),
    "nuts": (_TREE_NUTS | {"peanut", "groundnut"}, []),
    "dairy": (_DAIRY, _PLANT_MILKS),
    "egg": (_EGG, []),
    "gluten": (
        {"wheat", "flour", "bread", "pasta", "spaghetti", "noodle", "couscous", "semolina", "barley", "rye",
         "tortilla", "breadcrumb", "soy sauce", "seitan", "naan", "roti", "chapati", "bulgur"},
        _NON_WHEAT_FLOURS,
    ),
    "shellfish": (_SHELLFISH, []),
    "fish": (_FISH, []),
    "soy": ({"soy", "soya", "tofu", "tempeh", "edamame", "miso"}, []),
    "sesame": ({"sesame", "tahini"}, []),
}
_ALIASES = {
    "nut": "nuts", "tree nut": "nuts", "lactose": "dairy", "milk": "dairy", "wheat": "gluten",
    "crustacean": "shellfish", "soya": "soy",
}

_MEAT_GROUP = (_MEAT, [])
_ANIMAL_BY_PRODUCT = (_DAIRY | _EGG | {"honey"}, _PLANT_MILKS)


def _matches(text: str, terms: set[str], safe: list[str]) -> bool:
    text = f" {re.sub(r'[^a-z]+', ' ', text.lower())} "  # 'corn-flour' -> 'corn flour'
    for phrase in safe:
        text = text.replace(phrase, " ")
    return any(re.search(rf"\b{re.escape(t)}(?:e?s)?\b", text) for t in terms)


def _recipe_text(recipe: Recipe) -> list[str]:
    return [recipe.name, *(i.name for i in recipe.ingredients)]


def _any_match(recipe: Recipe, group: tuple[set[str], list[str]]) -> bool:
    return any(_matches(t, *group) for t in _recipe_text(recipe))


def has_allergen(recipe: Recipe, allergies: list[str]) -> bool:
    for allergy in allergies:
        key = normalize_name(allergy)
        key = _ALIASES.get(key, key)
        group = _GROUPS.get(key, ({key}, []))  # unknown allergy: match the word itself
        if key and _any_match(recipe, group):
            return True
    return False


def classify(recipe: Recipe) -> str:
    """'Non-vegetarian' if any meat/fish, else 'Vegetarian' if egg/dairy/honey, else 'Vegan'."""
    if _any_match(recipe, _MEAT_GROUP):
        return "Non-vegetarian"
    if _any_match(recipe, _ANIMAL_BY_PRODUCT):
        return "Vegetarian"
    return "Vegan"


def allowed(preference: str, derived: str) -> bool:
    if preference == "Vegan":
        return derived == "Vegan"
    if preference == "Vegetarian":
        return derived in ("Vegan", "Vegetarian")
    return True


_DIET_TAGS = {"vegan", "vegetarian", "non-vegetarian", "non vegetarian", "non-veg", "plant-based"}


def clean_labels(labels: list[str], derived: str) -> list[str]:
    """Drop the model's diet tags and every '...-free' / 'allergen' claim, then add the derived diet tag."""
    kept = []
    for label in labels:
        low = label.strip().lower()
        if low and low not in _DIET_TAGS and "free" not in low and "allergen" not in low and label not in kept:
            kept.append(label.strip())
    return [derived, *kept]
