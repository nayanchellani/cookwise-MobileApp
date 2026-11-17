from fastapi import HTTPException

from app.schemas.meal import AIPlan, DayOut, MealOut, MealPlan, MealPlanRequest
from app.services import catalog, dietary
from app.services.gemini_service import generate_structured


_DIET_RULES = (
    "Dietary rules must be strictly enforced:\n"
    "- If Vegetarian: NEVER include any meat, chicken, poultry, beef, pork, bacon, fish, seafood, gelatin, or lard. "
    "Eggs and dairy (milk, cheese, yogurt, paneer, butter) are allowed ONLY if the user permits, but absolutely NO meat or poultry.\n"
    "- If Vegan: NEVER include meat, poultry, fish, seafood, eggs, dairy, cheese, butter, or honey. Plant-based only.\n"
    "- If Non-vegetarian: Any ingredients allowed.\n"
)


def generate_meal_plan(req: MealPlanRequest) -> MealPlan:
    cur = catalog.currency(req.country)
    prompt = (
        f"Create a {req.days}-day meal plan with these meals per day: {', '.join(req.meals)}. "
        f"Diet: {req.diet}. {_DIET_RULES} "
        f"CRITICAL: The user has selected '{req.diet}'. Every single meal and ingredient MUST comply with {req.diet}. "
        f"Servings per meal: {req.servings}. "
        f"Total grocery budget for the whole plan: {cur['symbol']}{req.budget:.0f} ({req.country.upper()} prices), "
        "so reuse ingredients across days and keep it affordable. "
        "Use slot values exactly: breakfast, lunch, dinner (lowercase). Days numbered from 1. "
        "calories is per serving. Ingredients are the total for all servings, metric units (g, ml) or pcs, tbsp, tsp. "
        + (f"NEVER include these allergens: {', '.join(req.allergies)}. " if req.allergies else "")
    )
    plan = generate_structured(prompt, AIPlan)
    if len(plan.days) < req.days:
        raise HTTPException(502, "AI returned an incomplete plan, please retry")

    days: list[DayOut] = []
    for d in sorted(plan.days, key=lambda d: d.day)[: req.days]:
        meals = [
            MealOut(
                slot=m.slot.lower(),
                name=m.name,
                calories=m.calories,
                ingredients=m.ingredients,
                est_cost=round(sum(catalog.estimate_cost(i.name, i.quantity, i.unit) for i in m.ingredients), 2),
            )
            for m in d.meals
            if m.slot.lower() in req.meals
        ]
        days.append(
            DayOut(
                day=d.day,
                meals=meals,
                calories=sum(m.calories for m in meals),
                est_cost=round(sum(m.est_cost for m in meals), 2),
            )
        )

    total = round(sum(d.est_cost for d in days), 2)
    return MealPlan(
        days=days,
        total_est_cost=total,
        budget=req.budget,
        over_budget=total > req.budget,
        currency=cur["currency"],
        note="Estimated costs from a predefined price table, not live store prices.",
    )
