import { apiFetch } from './api';

export type FoodSearchResult = {
  id: number | null;
  name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  source: string;
  external_id: string | null;
  serving_size: number;
  serving_unit: string;
  data_type: string | null;
  is_local: boolean;
};

export async function searchFoods(query: string, token: string | null): Promise<FoodSearchResult[]> {
  const [localResult, usdaResult] = await Promise.allSettled([
    apiFetch(`/foods/?search=${encodeURIComponent(query)}`, token),
    apiFetch(`/foods/search/external?query=${encodeURIComponent(query)}`, token),
  ]);

  const localFoods: FoodSearchResult[] = localResult.status === 'fulfilled'
    ? localResult.value.map((f: any) => ({
        id: f.id,
        name: f.name,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        source: f.source,
        external_id: f.external_id,
        serving_size: f.serving_size,
        serving_unit: f.serving_unit,
        data_type: null,
        is_local: true,
      }))
    : [];

  const localExternalIds = new Set(localFoods.map(f => f.external_id).filter(Boolean));

  const usdaFoods: FoodSearchResult[] = usdaResult.status === 'fulfilled'
    ? usdaResult.value
        .filter((f: any) => !localExternalIds.has(f.external_id))
        .map((f: any) => ({
          id: null,
          name: f.name,
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
          source: f.source,
          external_id: f.external_id,
          serving_size: f.serving_size,
          serving_unit: f.serving_unit,
          data_type: f.data_type,
          is_local: false,
        }))
    : [];

  return [...localFoods, ...usdaFoods];
}