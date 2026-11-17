from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.schemas.recipe import Ingredient, Recipe, ShortStr

Slot = Literal["breakfast", "lunch", "dinner"]


# AI-facing (response_schema for Gemini): no defaults or constraints.
class AIMeal(BaseModel):
    slot: str
    name: str
    calories: int  # per serving
    ingredients: list[Ingredient]  # total for all servings

    @model_validator(mode="after")
    def _check(self) -> "AIMeal":
        if not self.name.strip() or not self.slot.strip():
            raise ValueError("meal needs a name and slot")
        if not 1 <= self.calories <= 3000:
            raise ValueError("meal calories must be between 1 and 3000")
        if not self.ingredients:
            raise ValueError("meal needs at least one ingredient")
        return self


class AIDay(BaseModel):
    day: int
    meals: list[AIMeal]

    @model_validator(mode="after")
    def _check(self) -> "AIDay":
        if not self.meals:
            raise ValueError("day needs at least one meal")
        return self


class AIPlan(BaseModel):
    days: list[AIDay]


# Request / response.
class MealPlanRequest(BaseModel):
    days: int = Field(default=7, ge=1, le=7)
    budget: float = Field(default=75, gt=0, le=1000)
    diet: str = Field(default="Vegetarian", max_length=40)
    meals: list[Slot] = Field(default=["breakfast", "lunch", "dinner"], min_length=1)
    servings: int = Field(default=2, ge=1, le=4)
    country: str = Field(default="US", max_length=2)
    allergies: list[ShortStr] = Field(default_factory=list, max_length=15)


class MealOut(BaseModel):
    slot: str
    name: str
    calories: int
    ingredients: list[Ingredient]
    est_cost: float


class DayOut(BaseModel):
    day: int
    meals: list[MealOut]
    calories: int
    est_cost: float


class MealPlan(BaseModel):
    days: list[DayOut]
    total_est_cost: float
    budget: float
    over_budget: bool
    currency: str
    note: str


class GroceryRequest(BaseModel):
    ingredients: list[Ingredient] = Field(default_factory=list, max_length=500)
    plan: MealPlan | None = None
    recipes: list[Recipe] = Field(default_factory=list, max_length=50)
    have: list[ShortStr] = Field(default_factory=list, max_length=200)


class GroceryItem(BaseModel):
    name: str
    quantity: float
    unit: str
    category: str
    purchased: bool = False


class GroceryList(BaseModel):
    total_items: int
    items: list[GroceryItem]
