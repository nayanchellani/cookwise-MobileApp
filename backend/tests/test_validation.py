import json

import pytest
from pydantic import ValidationError

from app.schemas.meal import AIDay, AIMeal
from app.schemas.recipe import Ingredient, Recipe
from tests.test_gemini_service import valid_recipe


def test_valid_recipe_passes():
    Recipe.model_validate(valid_recipe())


@pytest.mark.parametrize(
    "override",
    [
        {"ingredients": []},
        {"steps": []},
        {"steps": ["Chop.", "  "]},
        {"name": " "},
        {"calories": 0},
        {"calories": -5},
        {"calories": 99999},
        {"prep_min": 0, "cook_min": 0},
        {"prep_min": -1, "cook_min": 20},
        {"cook_min": 800},
        {"servings": 0},
        {"ingredients": [{"name": " ", "quantity": 1, "unit": "g"}]},
        {"ingredients": [{"name": "salt", "quantity": -1, "unit": "g"}]},
    ],
    ids=lambda o: ",".join(f"{k}" for k in o),
)
def test_invalid_recipes_are_rejected(override):
    with pytest.raises(ValidationError):
        Recipe.model_validate(valid_recipe(**override))


def test_zero_quantity_is_allowed_for_to_taste_items():
    assert Ingredient(name="salt", quantity=0, unit="to taste").quantity == 0


def test_meal_validation():
    ok = dict(slot="lunch", name="Dal", calories=400, ingredients=[Ingredient(name="lentil", quantity=100, unit="g")])
    AIMeal(**ok)
    for bad in ({"calories": 0}, {"ingredients": []}, {"name": ""}):
        with pytest.raises(ValidationError):
            AIMeal(**{**ok, **bad})
    with pytest.raises(ValidationError):
        AIDay(day=1, meals=[])


def test_validators_do_not_add_json_schema_constraints():
    """Gemini receives this schema. Keep it free of min/max keywords."""
    schema = json.dumps(Recipe.model_json_schema())
    assert "minItems" not in schema and "minimum" not in schema and "minLength" not in schema
