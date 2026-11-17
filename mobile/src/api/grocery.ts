import { apiClient } from './client';
import type { GroceryList, GroceryRequest } from '../types/api';

export async function generateGroceryList(req: GroceryRequest): Promise<GroceryList> {
  const { data } = await apiClient.post<GroceryList>('/grocery/generate', req);
  return data;
}
