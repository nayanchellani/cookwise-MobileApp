from app.schemas.meal import GroceryItem, GroceryRequest
from app.schemas.recipe import Ingredient
from app.services import catalog
from app.services.units import from_base, normalize_name, to_base

# Display order for the shopping list.
CATEGORY_ORDER = ["Vegetables", "Fruits", "Dairy & Eggs", "Meat & Fish", "Grains & Pasta", "Pantry", "Spices", "Other"]


def collect(req: GroceryRequest) -> list[Ingredient]:
    """Flatten explicit ingredients, a meal plan and recipes into one list."""
    out = list(req.ingredients)
    if req.plan:
        out += [i for day in req.plan.days for meal in day.meals for i in meal.ingredients]
    out += [i for recipe in req.recipes for i in recipe.ingredients]
    return out


def build_grocery_list(ingredients: list[Ingredient], have: list[str]) -> list[GroceryItem]:
    owned = {normalize_name(h) for h in have}
    totals: dict[tuple[str, str], float] = {}
    for ing in ingredients:
        name = normalize_name(ing.name)
        if not name or name in owned or ing.quantity <= 0:
            continue
        qty, base = to_base(ing.quantity, ing.unit)
        # shortcut: "2 pcs tomato" + "200 g tomato" stay separate lines, merge them if it bites
        totals[(name, base)] = totals.get((name, base), 0.0) + qty

    items = []
    for (name, base), qty in totals.items():
        q, unit = from_base(qty, base)
        items.append(GroceryItem(name=name, quantity=q, unit=unit, category=catalog.category(name)))
    items.sort(key=lambda i: (CATEGORY_ORDER.index(i.category) if i.category in CATEGORY_ORDER else 99, i.name))
    return items
