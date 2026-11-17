from fastapi import APIRouter

from app.schemas.meal import MealPlan, MealPlanRequest
from app.services import meal_service

router = APIRouter(prefix="/meal-plan", tags=["meal-plan"])


@router.post("/generate", response_model=MealPlan)
def generate(req: MealPlanRequest):
    return meal_service.generate_meal_plan(req)
