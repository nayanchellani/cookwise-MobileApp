// Lightweight global store: workflow state that survives navigation + AsyncStorage persistence.
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IngredientDetection, Recipe, MealPlan, GroceryItem } from '../types/api';

const STORAGE_KEYS = {
  SAVED_RECIPES: '@cookwise_saved_recipes',
  PROFILE: '@cookwise_profile',
  MEAL_PLAN: '@cookwise_meal_plan',
};

// ── State shape ───────────────────────────────────────────────
interface AppState {
  // Scan workflow
  scannedImageUri: string | null;
  detectedIngredients: IngredientDetection[];
  confirmedIngredients: string[]; // names after user edits

  // Recipe results
  recipeResults: Recipe[];
  recipeNotice: string;

  // Saved recipes (device-local & persistent)
  savedRecipes: Recipe[];

  // Meal plan
  currentMealPlan: MealPlan | null;

  // Grocery list (checked state lives here)
  groceryItems: GroceryItem[];

  // Profile (device-local & persistent)
  profile: {
    dietaryPreference: 'Vegetarian' | 'Vegan' | 'Non-vegetarian';
    allergies: string[];
    defaultServings: number;
    preferredCuisine: string | null;
  };
}

const DEFAULT_STATE: AppState = {
  scannedImageUri: null,
  detectedIngredients: [],
  confirmedIngredients: [],
  recipeResults: [],
  recipeNotice: '',
  savedRecipes: [],
  currentMealPlan: null,
  groceryItems: [],
  profile: {
    dietaryPreference: 'Non-vegetarian',
    allergies: [],
    defaultServings: 2,
    preferredCuisine: null,
  },
};

// ── Actions ───────────────────────────────────────────────────
type Action =
  | { type: 'HYDRATE'; payload: Partial<AppState> }
  | { type: 'SET_SCAN'; imageUri: string; ingredients: IngredientDetection[] }
  | { type: 'SET_CONFIRMED'; ingredients: string[] }
  | { type: 'SET_RECIPE_RESULTS'; recipes: Recipe[]; notice: string }
  | { type: 'SAVE_RECIPE'; recipe: Recipe }
  | { type: 'UNSAVE_RECIPE'; name: string }
  | { type: 'SET_MEAL_PLAN'; plan: MealPlan }
  | { type: 'SET_GROCERY_ITEMS'; items: GroceryItem[] }
  | { type: 'TOGGLE_GROCERY_ITEM'; name: string }
  | { type: 'UPDATE_PROFILE'; profile: Partial<AppState['profile']> }
  | { type: 'CLEAR_SCAN' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload };
    case 'SET_SCAN':
      return {
        ...state,
        scannedImageUri: action.imageUri,
        detectedIngredients: action.ingredients,
        confirmedIngredients: [],
      };
    case 'SET_CONFIRMED':
      return { ...state, confirmedIngredients: action.ingredients };
    case 'SET_RECIPE_RESULTS':
      return { ...state, recipeResults: action.recipes, recipeNotice: action.notice };
    case 'SAVE_RECIPE': {
      const already = state.savedRecipes.some((r) => r.name === action.recipe.name);
      if (already) return state;
      const updated = [action.recipe, ...state.savedRecipes];
      AsyncStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(updated)).catch(() => {});
      return { ...state, savedRecipes: updated };
    }
    case 'UNSAVE_RECIPE': {
      const updated = state.savedRecipes.filter((r) => r.name !== action.name);
      AsyncStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(updated)).catch(() => {});
      return { ...state, savedRecipes: updated };
    }
    case 'SET_MEAL_PLAN': {
      AsyncStorage.setItem(STORAGE_KEYS.MEAL_PLAN, JSON.stringify(action.plan)).catch(() => {});
      return { ...state, currentMealPlan: action.plan };
    }
    case 'SET_GROCERY_ITEMS':
      return { ...state, groceryItems: action.items };
    case 'TOGGLE_GROCERY_ITEM':
      return {
        ...state,
        groceryItems: state.groceryItems.map((item) =>
          item.name === action.name ? { ...item, purchased: !item.purchased } : item,
        ),
      };
    case 'UPDATE_PROFILE': {
      const updated = { ...state.profile, ...action.profile };
      AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated)).catch(() => {});
      return { ...state, profile: updated };
    }
    case 'CLEAR_SCAN':
      return {
        ...state,
        scannedImageUri: null,
        detectedIngredients: [],
        confirmedIngredients: [],
      };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);

  // Hydrate persistent state on app launch
  useEffect(() => {
    async function loadStoredData() {
      try {
        const [savedRaw, profileRaw, planRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SAVED_RECIPES),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
          AsyncStorage.getItem(STORAGE_KEYS.MEAL_PLAN),
        ]);

        const payload: Partial<AppState> = {};
        if (savedRaw) payload.savedRecipes = JSON.parse(savedRaw);
        if (profileRaw) payload.profile = JSON.parse(profileRaw);
        if (planRaw) payload.currentMealPlan = JSON.parse(planRaw);

        dispatch({ type: 'HYDRATE', payload });
      } catch (err) {
        // Silently fallback to defaults if storage read fails
      }
    }
    loadStoredData();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used inside AppProvider');
  return ctx;
}
