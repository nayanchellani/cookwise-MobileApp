from app.schemas.recipe import FromIngredientsRequest, Recipe, RecipeList, RecipeRequest
from app.services import dietary
from app.services.gemini_service import OutputRejected, generate_structured

RECIPE_COUNT = 3
NOTICE = (
    "AI-generated suggestions. Allergen and diet checks are best-effort, not a guarantee. "
    "Check every ingredient against your allergies and dietary needs before cooking."
)

_RULES = (
    "Use metric units (g, ml) or pcs, tbsp, tsp for ingredient quantities. "
    "Ingredient quantities are the total for all servings. Calories are per serving. "
    "steps: short, clear instructions in order. "
    "labels: dietary tags such as Vegetarian, Vegan, High protein, Quick. "
    "Never claim a recipe is allergen-free. "
    "Pantry staples (salt, oil, water, common spices) may be added even if not listed."
)

_DIET_DEFINITIONS = (
    "Vegetarian = no meat, poultry, fish, seafood or gelatin; eggs and dairy are allowed. "
    "Vegan = no animal products at all: no meat, fish, eggs, dairy or honey. "
    "Non-vegetarian = no restriction. "
    "Tag a recipe Vegan only if it has no egg, dairy or honey; eggs or dairy make it Vegetarian, not Vegan."
)


def _constraints(req: RecipeRequest) -> str:
    lines = [
        f"Cuisine: {req.cuisine or 'any'}.",
        f"Dietary preference: {req.dietary_preference} (strict). {_DIET_DEFINITIONS}",
        f"Total time (prep_min + cook_min) must be at most {req.cooking_time} minutes.",
        f"Difficulty: {req.difficulty}.",
        f"Servings: exactly {req.servings}.",
    ]
    if req.allergies:
        lines.append(
            f"The user is allergic or intolerant to: {', '.join(req.allergies)}. Do not include these, or "
            "anything derived from them, in any recipe, not even as an optional garnish."
        )
    return " ".join(lines)


def _validate(recipes: list[Recipe], req: RecipeRequest) -> None:
    """Reject output that parses but breaks the request. Codes only: no user data in errors."""
    for r in recipes:
        if r.total_min > req.cooking_time:
            raise OutputRejected("time_limit")
        if r.servings != req.servings:
            raise OutputRejected("servings")
        if dietary.has_allergen(r, req.allergies):
            raise OutputRejected("allergen")
        if not dietary.allowed(req.dietary_preference, dietary.classify(r)):
            raise OutputRejected("diet")


def _finalize(recipe: Recipe) -> Recipe:
    """Set the diet from the ingredients rather than trusting the model's own tags."""
    derived = dietary.classify(recipe)
    recipe.diet = derived
    recipe.labels = dietary.clean_labels(recipe.labels, derived)
    return recipe


def generate_recipe(req: RecipeRequest) -> Recipe:
    have = ", ".join(req.ingredients) or "no specific ingredients"
    prompt = (
        f"Create ONE recipe. Ingredients available: {have}. Build the recipe mainly from them. "
        f"{_constraints(req)} {_RULES}"
    )
    return _finalize(generate_structured(prompt, Recipe, check=lambda r: _validate([r], req)))


def recipes_from_ingredients(req: FromIngredientsRequest) -> list[Recipe]:
    prompt = (
        f"Create exactly {RECIPE_COUNT} different recipes. The user confirmed they have: "
        f"{', '.join(req.ingredients)}. Use mostly these ingredients, and you may leave out any of them "
        f"that conflicts with the dietary preference or allergies. Make the recipes clearly distinct. "
        f"{_constraints(req)} {_RULES}"
    )

    def check(result: RecipeList) -> None:
        if len(result.recipes) != RECIPE_COUNT:
            raise OutputRejected("count")
        _validate(result.recipes, req)

    return [_finalize(r) for r in generate_structured(prompt, RecipeList, check=check).recipes]
