from fastapi import APIRouter

from app.schemas.recipe import FromIngredientsRequest, Recipe, RecipeRequest, RecipeResults
from app.services import recipe_service

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.post("/generate", response_model=Recipe)
def generate(req: RecipeRequest):
    return recipe_service.generate_recipe(req)


@router.post(
    "/from-ingredients",
    response_model=RecipeResults,
    summary="3 recipes from confirmed ingredients",
    description="`ingredients` must be the list the user confirmed or edited, not raw /ingredients/scan output.",
)
def from_ingredients(req: FromIngredientsRequest):
    return RecipeResults(recipes=recipe_service.recipes_from_ingredients(req), notice=recipe_service.NOTICE)
