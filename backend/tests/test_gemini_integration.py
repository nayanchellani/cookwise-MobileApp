"""Live Gemini test. No mocks. Skipped without GEMINI_API_KEY (env var or backend/.env).

Run from backend/:  python -m pytest -m integration -s
"""
import time

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.schemas.recipe import Recipe
from app.services.units import normalize_name

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(not settings.gemini_api_key, reason="GEMINI_API_KEY not set"),
]


def test_recipe_generation_live():
    payload = {
        "ingredients": ["eggs", "tomatoes", "onions", "potatoes"],
        "cuisine": "Indian",
        "dietary_preference": "Vegetarian",
        "cooking_time": 30,
        "difficulty": "Easy",
        "servings": 2,
        "allergies": ["peanuts"],
    }
    start = time.perf_counter()
    r = TestClient(app).post("/recipes/generate", json=payload)
    latency = time.perf_counter() - start

    print(f"\nmodel={settings.gemini_model} status={r.status_code} latency={latency:.2f}s")
    assert r.status_code == 200, r.text

    body = r.json()
    print("top-level keys:", sorted(body))
    print("ingredient keys:", sorted(body["ingredients"][0]))
    print(f"name={body['name']!r} time={body['prep_min']}+{body['cook_min']}min "
          f"ingredients={len(body['ingredients'])} steps={len(body['steps'])} "
          f"kcal={body['calories']} labels={body['labels']}")

    recipe = Recipe.model_validate(body)  # same schema the API promises
    names = {normalize_name(i.name) for i in recipe.ingredients}
    wanted = {normalize_name(i) for i in payload["ingredients"]}

    assert len(recipe.steps) >= 2
    assert len(recipe.ingredients) >= 3
    assert recipe.calories > 0
    assert recipe.prep_min + recipe.cook_min <= payload["cooking_time"]
    assert len(names & wanted) >= 2, f"recipe ignores requested ingredients: {names}"
    assert not any("peanut" in n for n in names)
    assert settings.gemini_api_key not in r.text  # key never leaks into responses
