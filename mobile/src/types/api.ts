// API types — mirrors backend Pydantic schemas exactly.
// Keep in sync with backend/app/schemas/recipe.py and meal.py.

// ── Ingredients ────────────────────────────────────────────────
export type IngredientCategory =
  | 'Vegetables'
  | 'Fruits'
  | 'Dairy & Eggs'
  | 'Meat & Fish'
  | 'Grains & Pasta'
  | 'Pantry'
  | 'Spices'
  | 'Other';

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface IngredientDetection {
  name: string;
  confidence: number; // 0–1
  estimated_quantity: string | null;
  category: IngredientCategory | null;
}

export interface IngredientNames {
  ingredients: IngredientDetection[];
}

// ── Recipes ────────────────────────────────────────────────────
export interface Macros {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface Recipe {
  name: string;
  description: string;
  cuisine: string;
  diet: string;
  prep_min: number;
  cook_min: number;
  total_min: number; // computed_field on backend
  difficulty: string;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  calories: number;
  macros: Macros;
  labels: string[];
}

export interface RecipeResults {
  recipes: Recipe[];
  notice: string;
}

// ── Requests ───────────────────────────────────────────────────
export type DietaryPreference = 'Vegetarian' | 'Vegan' | 'Non-vegetarian';

export interface RecipeRequest {
  ingredients?: string[];
  dietary_preference?: DietaryPreference;
  cuisine?: string | null;
  cooking_time?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  servings?: number;
  allergies?: string[];
}

export interface FromIngredientsRequest extends RecipeRequest {
  ingredients: string[]; // required, min 1
}

// ── Meal Planner ───────────────────────────────────────────────
export type Slot = 'breakfast' | 'lunch' | 'dinner';

export interface MealOut {
  slot: string;
  name: string;
  calories: number;
  ingredients: Ingredient[];
  est_cost: number;
}

export interface DayOut {
  day: number;
  meals: MealOut[];
  calories: number;
  est_cost: number;
}

export interface MealPlan {
  days: DayOut[];
  total_est_cost: number;
  budget: number;
  over_budget: boolean;
  currency: string;
  note: string;
}

export interface MealPlanRequest {
  days?: number;
  budget?: number;
  diet?: string;
  meals?: Slot[];
  servings?: number;
  country?: string;
  allergies?: string[];
}

// ── Grocery ────────────────────────────────────────────────────
export interface GroceryItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  purchased: boolean;
}

export interface GroceryList {
  total_items: number;
  items: GroceryItem[];
}

export interface GroceryRequest {
  ingredients?: Ingredient[];
  plan?: MealPlan | null;
  recipes?: Recipe[];
  have?: string[];
}
