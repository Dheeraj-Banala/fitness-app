import { apiFetch } from './api';

export type FoodSearchResult = {
  id: number | null;
  name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  saturated_fat: number | null;
  sodium: number | null;
  potassium: number | null;
  calcium: number | null;
  magnesium: number | null;
  iron: number | null;
  zinc: number | null;
  vitamin_d: number | null;
  vitamin_c: number | null;
  vitamin_a: number | null;
  vitamin_b12: number | null;
  folate: number | null;
  source: string;
  external_id: string | null;
  serving_size: number;
  serving_unit: string;
  default_serving_g: number | null;
  default_serving_name: string | null;
  data_type: string | null;
  is_local: boolean;
};

const MICRO_KEYS = [
  'fiber', 'sugar', 'saturated_fat', 'sodium', 'potassium', 'calcium',
  'magnesium', 'iron', 'zinc', 'vitamin_d', 'vitamin_c', 'vitamin_a',
  'vitamin_b12', 'folate',
] as const;

function pickMicros(f: any): Pick<FoodSearchResult, typeof MICRO_KEYS[number]> {
  return Object.fromEntries(MICRO_KEYS.map(k => [k, f[k] ?? null])) as any;
}

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
        ...pickMicros(f),
        source: f.source,
        external_id: f.external_id,
        serving_size: f.serving_size,
        serving_unit: f.serving_unit,
        default_serving_g: f.default_serving_g ?? null,
        default_serving_name: f.default_serving_name ?? null,
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
          ...pickMicros(f),
          source: f.source,
          external_id: f.external_id,
          serving_size: f.serving_size,
          serving_unit: f.serving_unit,
          default_serving_g: f.default_serving_g ?? null,
          default_serving_name: f.default_serving_name ?? null,
          data_type: f.data_type,
          is_local: false,
        }))
    : [];

  return [...localFoods, ...usdaFoods];
}
