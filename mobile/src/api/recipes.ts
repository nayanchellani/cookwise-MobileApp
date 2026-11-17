import { apiClient } from './client';
import type {
  FromIngredientsRequest,
  Recipe,
  RecipeRequest,
  RecipeResults,
} from '../types/api';

export async function generateRecipe(req: RecipeRequest): Promise<Recipe> {
  const { data } = await apiClient.post<Recipe>('/recipes/generate', req);
  return data;
}

export async function recipesFromIngredients(
  req: FromIngredientsRequest,
): Promise<RecipeResults> {
  const { data } = await apiClient.post<RecipeResults>('/recipes/from-ingredients', req);
  return data;
}
