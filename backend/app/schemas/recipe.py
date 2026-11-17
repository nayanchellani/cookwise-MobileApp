from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, computed_field, field_validator, model_validator

# AI-facing models (Ingredient, Macros, Recipe, RecipeList, IngredientNames) are
# passed to Gemini as response_schema, so they carry no defaults or constraints.


def require_text(value: str, label: str) -> str:
    if not value.strip():
        raise ValueError(f"{label} must not be blank")
    return value


class Ingredient(BaseModel):
    name: str
    quantity: float
    unit: str

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        return require_text(v, "ingredient name")

    @field_validator("quantity")
    @classmethod
    def _quantity(cls, v: float) -> float:
        if v < 0:  # 0 is allowed: "salt, to taste"
            raise ValueError("ingredient quantity must not be negative")
        return v


class Macros(BaseModel):
    protein_g: float
    carbs_g: float
    fat_g: float


class Recipe(BaseModel):
    name: str
    description: str
    cuisine: str
    diet: str
    prep_min: int
    cook_min: int
    difficulty: str
    servings: int
    ingredients: list[Ingredient]
    steps: list[str]
    calories: int  # per serving
    macros: Macros  # per serving
    labels: list[str]  # dietary tags

    @computed_field  # in API responses only: model_json_schema() (what Gemini sees) leaves it out
    @property
    def total_min(self) -> int:
        return self.prep_min + self.cook_min

    # Validators add no JSON-schema constraints, so Gemini's response_schema stays simple.
    @model_validator(mode="after")
    def _check(self) -> "Recipe":
        require_text(self.name, "recipe name")
        if not self.ingredients:
            raise ValueError("recipe needs at least one ingredient")
        if not self.steps or any(not step.strip() for step in self.steps):
            raise ValueError("recipe needs non-empty instructions")
        if not 1 <= self.calories <= 5000:
            raise ValueError("calories must be between 1 and 5000 per serving")
        if self.prep_min < 0 or self.cook_min < 0 or not 1 <= self.prep_min + self.cook_min <= 720:
            raise ValueError("cooking time must be between 1 and 720 minutes")
        if not 1 <= self.servings <= 20:
            raise ValueError("servings must be between 1 and 20")
        return self


class RecipeList(BaseModel):
    recipes: list[Recipe]


IngredientCategory = Literal[
    "Vegetables", "Fruits", "Dairy & Eggs", "Meat & Fish", "Grains & Pasta", "Pantry", "Spices", "Other"
]


class IngredientDetection(BaseModel):
    """One unconfirmed suggestion from the photo. The user confirms or edits it in the app."""

    name: str
    confidence: float  # the model's own estimate, 0 to 1. Not a calibrated probability.
    estimated_quantity: str | None  # rough, e.g. "about 6"; never an exact amount
    category: IngredientCategory | None

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        return require_text(v, "ingredient name")

    @field_validator("confidence")
    @classmethod
    def _confidence(cls, v: float) -> float:
        if not 0 <= v <= 1:
            raise ValueError("confidence must be between 0 and 1")
        return v


class IngredientNames(BaseModel):
    ingredients: list[IngredientDetection]


# Request models (validated at the trust boundary).
ShortStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)]


DietaryPreference = Literal["Vegetarian", "Vegan", "Non-vegetarian"]  # Non-vegetarian = no restriction


class RecipeRequest(BaseModel):
    ingredients: list[ShortStr] = Field(default_factory=list, max_length=30)
    dietary_preference: DietaryPreference = "Non-vegetarian"
    cuisine: str | None = Field(default=None, max_length=40)
    cooking_time: int = Field(default=30, ge=5, le=240, description="Maximum total minutes (prep + cook)")
    difficulty: Literal["Easy", "Medium", "Hard"] = "Easy"
    servings: int = Field(default=2, ge=1, le=6)
    allergies: list[ShortStr] = Field(default_factory=list, max_length=15)


class FromIngredientsRequest(RecipeRequest):
    """Only ingredients the user has confirmed. Scan results are suggestions until then."""

    ingredients: list[ShortStr] = Field(min_length=1, max_length=30)


class RecipeResults(RecipeList):
    notice: str
