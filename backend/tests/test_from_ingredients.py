import json
import logging

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.recipe import Recipe
from app.services import dietary
from tests.test_gemini_service import FakeClient, _env, install, valid_recipe  # noqa: F401  (fixtures)

client = TestClient(app)

BASE = {"ingredients": ["eggs", "tomatoes"], "dietary_preference": "Vegetarian", "cooking_time": 30,
        "difficulty": "Easy", "servings": 2}


def ing(*names):
    return [{"name": n, "quantity": 100, "unit": "g"} for n in names]


def three(**over) -> str:
    return json.dumps({"recipes": [valid_recipe(name=f"Dish {i}", ingredients=ing("tomato", "egg"), **over) for i in range(3)]})


def recipe_model(*names, **over) -> Recipe:
    return Recipe.model_validate(valid_recipe(ingredients=ing(*names), **over))


def post(**over):
    return client.post("/recipes/from-ingredients", json={**BASE, **over})


# ---- request validation ------------------------------------------------------------------------

@pytest.mark.parametrize("over", [
    {"ingredients": []}, {"ingredients": [" "]}, {"ingredients": ["x"] * 31}, {"ingredients": ["x" * 61]},
    {"dietary_preference": "Keto"}, {"difficulty": "Impossible"}, {"servings": 0}, {"servings": 7},
    {"cooking_time": 1}, {"cooking_time": 500}, {"allergies": ["a"] * 16}, {"cuisine": "x" * 41},
])
def test_bad_requests_are_422(over, install):
    install([three()])
    assert post(**over).status_code == 422


def test_missing_ingredients_is_422():
    body = {k: v for k, v in BASE.items() if k != "ingredients"}
    assert client.post("/recipes/from-ingredients", json=body).status_code == 422


# ---- success path ------------------------------------------------------------------------------

def test_returns_exactly_three_with_total_time_notice_and_derived_tags(install):
    fake = install([three(labels=["Vegan", "Gluten-free", "Allergen-free", "High protein"])])
    r = post(allergies=["peanuts"], cuisine="Indian")
    body = r.json()
    assert r.status_code == 200 and len(body["recipes"]) == 3
    first = body["recipes"][0]
    assert first["total_min"] == 25 and first["servings"] == 2 and first["calories"] == 350
    assert first["diet"] == "Vegetarian"  # egg present: the model's "Vegan" tag is not trusted
    assert first["labels"] == ["Vegetarian", "High protein"]
    assert "not a guarantee" in body["notice"]
    prompt = fake.contents[0][0]
    for needle in ("exactly 3", "peanuts", "at most 30 minutes", "Indian", "eggs, tomatoes", "not even as an optional"):
        assert needle in prompt


# ---- enforced rules, each retried once ----------------------------------------------------------

@pytest.mark.parametrize("bad,over", [
    (json.dumps({"recipes": [valid_recipe(ingredients=ing("egg"))] * 2}), {}),  # 2 recipes, not 3
    (three(cook_min=40), {}),  # 50 min > 30
    (three(servings=4), {}),
    (json.dumps({"recipes": [valid_recipe(ingredients=ing("chicken breast"))] * 3}), {}),  # meat for vegetarian
    (json.dumps({"recipes": [valid_recipe(ingredients=ing("peanut butter"))] * 3}), {"allergies": ["peanuts"]}),
    (json.dumps({"recipes": [valid_recipe(ingredients=ing("paneer"))] * 3}), {"dietary_preference": "Vegan"}),
], ids=["count", "time", "servings", "meat-in-vegetarian", "allergen", "dairy-in-vegan"])
def test_rule_violation_is_retried_then_502(bad, over, install):
    fake = install([bad, bad])
    r = post(**over)
    assert r.status_code == 502 and r.json() == {"detail": "AI returned an invalid response, please retry"}
    assert fake.calls == 2


def test_rule_violation_then_good_output_succeeds(install):
    fake = install([three(cook_min=40), three()])
    assert post().status_code == 200 and fake.calls == 2


def test_vegan_accepts_plant_milk_and_rejects_eggs(install):
    ok = json.dumps({"recipes": [valid_recipe(ingredients=ing("coconut milk", "tofu"))] * 3})
    install([ok])
    assert post(dietary_preference="Vegan").json()["recipes"][0]["diet"] == "Vegan"


def test_non_vegetarian_has_no_diet_restriction(install):
    install([json.dumps({"recipes": [valid_recipe(ingredients=ing("chicken breast"))] * 3})])
    r = post(dietary_preference="Non-vegetarian")
    assert r.status_code == 200 and r.json()["recipes"][0]["diet"] == "Non-vegetarian"


def test_user_allergies_never_reach_logs(install, caplog):
    secret = "zzz-private-allergy"
    bad = json.dumps({"recipes": [valid_recipe(name=f"{secret} stew", ingredients=ing(secret))] * 3})
    install([bad, bad])
    caplog.set_level(logging.DEBUG)
    r = post(allergies=[secret])
    assert r.status_code == 502
    assert "rejected=allergen" in caplog.text
    assert secret not in caplog.text + r.text


def test_generate_endpoint_uses_same_rules(install):
    install([json.dumps(valid_recipe(ingredients=ing("chicken breast")))] * 2)
    r = client.post("/recipes/generate", json={"dietary_preference": "Vegan", "ingredients": ["tofu"]})
    assert r.status_code == 502


# ---- dietary classifier ------------------------------------------------------------------------

@pytest.mark.parametrize("names,expected", [
    (["tomato", "rice", "coconut milk"], "Vegan"),
    (["tofu", "peanut butter", "almond milk", "cocoa butter"], "Vegan"),
    (["eggplant", "butternut squash", "cream of tartar"], "Vegan"),
    (["egg", "tomato"], "Vegetarian"),
    (["paneer", "spinach"], "Vegetarian"),
    (["Greek Yogurt"], "Vegetarian"),
    (["honey", "oats"], "Vegetarian"),
    (["egg noodles"], "Vegetarian"),
    (["chicken breast", "rice"], "Non-vegetarian"),
    (["fish sauce"], "Non-vegetarian"),
    (["bacon", "egg"], "Non-vegetarian"),
    (["prawns"], "Non-vegetarian"),
    (["gelatin"], "Non-vegetarian"),
])
def test_classify(names, expected):
    assert dietary.classify(recipe_model(*names)) == expected


@pytest.mark.parametrize("allergy,names,hit", [
    ("peanuts", ["peanut butter"], True),
    ("peanut", ["groundnut oil"], True),
    ("nuts", ["almond milk"], True),
    ("nuts", ["coconut milk", "nutmeg"], False),
    ("dairy", ["almond milk", "coconut milk", "peanut butter"], False),
    ("dairy", ["ghee"], True),
    ("lactose", ["cheddar cheese"], True),
    ("eggs", ["eggplant"], False),
    ("egg", ["mayonnaise"], True),
    ("gluten", ["whole wheat flour"], True),
    ("gluten", ["rice flour", "gram flour"], False),
    ("shellfish", ["shrimp"], True),
    ("sesame", ["tahini"], True),
    ("kiwi", ["kiwi fruit"], True),  # unknown allergy: match the word itself
])
def test_allergen_detection(allergy, names, hit):
    assert dietary.has_allergen(recipe_model(*names), [allergy]) is hit


def test_allergen_in_recipe_name_is_caught():
    assert dietary.has_allergen(recipe_model("rice", name="Peanut Rice"), ["peanuts"])


def test_clean_labels():
    assert dietary.clean_labels(["Vegan", "Dairy-free", "allergen safe", "Quick", "Quick", " "], "Vegetarian") == [
        "Vegetarian", "Quick"
    ]
