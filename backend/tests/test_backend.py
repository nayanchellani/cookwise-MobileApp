from fastapi.testclient import TestClient

from app.main import app
from app.schemas.meal import AIDay, AIMeal, AIPlan
from app.schemas.recipe import Ingredient
from app.services import catalog, grocery_service, meal_service
from app.services.units import normalize_name

client = TestClient(app)


def ing(name, q, u):
    return Ingredient(name=name, quantity=q, unit=u)


def test_normalize_name():
    assert normalize_name("Fresh Tomatoes (chopped)") == "tomato"
    assert normalize_name("eggs") == "egg"
    assert normalize_name("potatoes") == "potato"
    assert normalize_name("hummus") == "hummus"


def test_grocery_merges_and_converts():
    items = grocery_service.build_grocery_list(
        [ing("tomatoes", 2, "pcs"), ing("tomato", 4, "pcs"), ing("rice", 500, "g"), ing("Rice", 1.5, "kg")],
        have=[],
    )
    by_name = {i.name: i for i in items}
    assert (by_name["tomato"].quantity, by_name["tomato"].unit) == (6, "pcs")
    assert (by_name["rice"].quantity, by_name["rice"].unit) == (2, "kg")


def test_grocery_excludes_have_and_groups_by_category():
    items = grocery_service.build_grocery_list(
        [ing("onion", 2, "pcs"), ing("milk", 500, "ml"), ing("mystery fruit", 1, "pcs")], have=["Onions"]
    )
    assert [i.name for i in items] == ["milk", "mystery fruit"]
    assert [i.category for i in items] == ["Dairy & Eggs", "Other"]


def test_cost_estimate():
    assert catalog.estimate_cost("eggs", 12, "pcs") == 4.2  # 12 * 0.35
    assert catalog.estimate_cost("tomato", 500, "g") == 1.75  # 0.5 kg * 3.5
    assert catalog.estimate_cost("onion", 2, "pcs") == 0.54  # 300 g * 1.8/kg
    assert catalog.estimate_cost("unobtainium", 100, "g") == 0.6  # fallback


def test_grocery_endpoint_and_empty_input():
    r = client.post("/grocery/generate", json={"ingredients": [{"name": "egg", "quantity": 6, "unit": "pcs"}]})
    assert r.status_code == 200 and r.json()["total_items"] == 1
    assert client.post("/grocery/generate", json={}).status_code == 422


def test_meal_plan_costs_and_filters_slots(monkeypatch):
    fake = AIPlan(days=[
        AIDay(day=d, meals=[
            AIMeal(slot="Breakfast", name="Omelette", calories=300, ingredients=[ing("egg", 4, "pcs")]),
            AIMeal(slot="snack", name="Nuts", calories=100, ingredients=[ing("nut", 50, "g")]),
        ])
        for d in (1, 2)
    ])
    monkeypatch.setattr(meal_service, "generate_structured", lambda *a, **k: fake)
    r = client.post("/meal-plan/generate", json={"days": 2, "budget": 2, "meals": ["breakfast"]})
    body = r.json()
    assert r.status_code == 200
    assert [len(d["meals"]) for d in body["days"]] == [1, 1]  # snack dropped
    assert body["total_est_cost"] == 2.8 and body["over_budget"] is True  # 2 days * 4 eggs * 0.35


def test_meal_plan_incomplete_ai_output(monkeypatch):
    monkeypatch.setattr(meal_service, "generate_structured", lambda *a, **k: AIPlan(days=[]))
    assert client.post("/meal-plan/generate", json={"days": 3}).status_code == 502
