import { apiClient } from './client';
import type { MealPlan, MealPlanRequest } from '../types/api';

export async function generateMealPlan(req: MealPlanRequest): Promise<MealPlan> {
  const { data } = await apiClient.post<MealPlan>('/meal-plan/generate', req);
  return data;
}
