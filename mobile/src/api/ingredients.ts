import { apiClient } from './client';
import type { IngredientNames } from '../types/api';

export async function scanIngredients(imageUri: string): Promise<IngredientNames> {
  const form = new FormData();
  // React Native FormData accepts this object shape for file blobs
  form.append('image', {
    uri: imageUri,
    name: 'scan.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const { data } = await apiClient.post<IngredientNames>('/ingredients/scan', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120_000,
  });
  return data;
}
