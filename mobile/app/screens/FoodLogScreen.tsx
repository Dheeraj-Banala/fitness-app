import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

type NutritionSummary = {
  id: number; name: string;
  calories: number | null; protein: number | null; carbs: number | null; fat: number | null; fiber: number | null;
  sodium: number | null; potassium: number | null; calcium: number | null; magnesium: number | null;
  iron: number | null; zinc: number | null; vitamin_d: number | null; vitamin_c: number | null;
  vitamin_a: number | null; vitamin_b12: number | null; folate: number | null;
};

type FoodLogEntry = {
  id: number;
  meal_type: string;
  quantity: number;
  unit: string;
  date: string;
  food_id: number | null;
  recipe_id: number | null;
  food: NutritionSummary | null;
  recipe: (NutritionSummary & { servings: number }) | null;
};

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function FoodLogScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const [date, setDate] = useState(toLocalDateString(new Date()));
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);
  const [goals, setGoals] = useState<{ calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null } | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
      loadGoals();
    }, [date])
  );

  async function loadGoals() {
    try {
      const data = await apiFetch('/goals/', token);
      setGoals(data);
    } catch (e) {}
  }

  async function loadLogs() {
    try {
      const data = await apiFetch('/food-logs/', token);
      setLogs(data.filter((log: FoodLogEntry) => log.date === date));
    } catch (e) {}
  }

  function changeDate(days: number) {
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + days);
    setDate(toLocalDateString(d));
  }

  function logsForMeal(mealType: string) {
    return logs.filter(log => log.meal_type === mealType);
  }

  async function handleDelete(logId: number) {
    try {
      await apiFetch(`/food-logs/${logId}`, token,  { method: 'DELETE' });
      loadLogs();
    } catch (e) {}
  }

  function dailyTotals() {
    let calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0;
    const micros: Record<string, number> = {
      sodium: 0, potassium: 0, calcium: 0, magnesium: 0, iron: 0,
      zinc: 0, vitamin_d: 0, vitamin_c: 0, vitamin_a: 0, vitamin_b12: 0, folate: 0,
    };
    for (const log of logs) {
      const isRecipe = !!log.recipe_id;
      const scale = isRecipe ? log.quantity / (log.recipe?.servings ?? 1) : log.quantity / 100;
      const source = isRecipe ? log.recipe : log.food;
      calories += source?.calories ? source.calories * scale : 0;
      protein  += source?.protein  ? source.protein  * scale : 0;
      carbs    += source?.carbs    ? source.carbs    * scale : 0;
      fat      += source?.fat      ? source.fat      * scale : 0;
      if (!isRecipe && log.food) {
        fiber += log.food.fiber ? log.food.fiber * scale : 0;
        for (const key of Object.keys(micros)) {
          const val = (log.food as any)[key];
          micros[key] += val ? val * scale : 0;
        }
      }
    }
    return {
      calories: Math.round(calories), protein: Math.round(protein),
      carbs: Math.round(carbs), fat: Math.round(fat), fiber: Math.round(fiber),
      micros: Object.fromEntries(Object.entries(micros).map(([k, v]) => [k, Math.round(v * 10) / 10])),
    };
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => changeDate(-1)}>
          <Text style={styles.arrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.date}>{date}</Text>
        <TouchableOpacity onPress={() => changeDate(1)}>
          <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {(() => {
        const totals = dailyTotals();
        return (
          <View style={styles.summaryCard}>
            {[
              { label: 'Calories', value: totals.calories, goal: goals?.calories, unit: 'kcal', color: '#FF9500' },
              { label: 'Protein',  value: totals.protein,  goal: goals?.protein_g, unit: 'g',    color: '#007AFF' },
              { label: 'Carbs',    value: totals.carbs,    goal: goals?.carbs_g,   unit: 'g',    color: '#34C759' },
              { label: 'Fat',      value: totals.fat,      goal: goals?.fat_g,     unit: 'g',    color: '#AF52DE' },
            ].map(({ label, value, goal, unit, color }) => (
              <View key={label} style={styles.progressRow}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>{label}</Text>
                  <Text style={styles.progressValue}>{value} / {goal ?? '—'} {unit}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min((value / (goal ?? 1)) * 100, 100)}%`, backgroundColor: color }]} />
                </View>
              </View>
            ))}
            <View style={styles.fiberRow}>
              <Text style={styles.fiberLabel}>Fiber</Text>
              <Text style={styles.fiberValue}>{totals.fiber} / 28 g</Text>
            </View>
            <TouchableOpacity
              style={styles.microsButton}
              onPress={() => (navigation as any).navigate('Micronutrients', { micros: totals.micros, date })}
            >
              <Text style={styles.microsButtonText}>Micronutrients</Text>
            </TouchableOpacity>
          </View>
        );
      })()}

      {MEAL_TYPES.map(mealType => (
        <View key={mealType} style={styles.mealSection}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealTitle}>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('AddFood' as never, { mealType, date } as never)}>
              <Text style={styles.addButton}>+</Text>
            </TouchableOpacity>
          </View>
          {logsForMeal(mealType).map(log => {
              const isRecipe = !!log.recipe_id;
              const name = isRecipe ? log.recipe?.name : log.food?.name;
              const scale = isRecipe ? log.quantity / (log.recipe?.servings ?? 1) : log.quantity / 100;
              const source = isRecipe ? log.recipe : log.food;
              const cals    = source?.calories != null ? Math.round(source.calories * scale) : null;
              const protein = source?.protein  != null ? Math.round(source.protein  * scale) : null;
              const carbs   = source?.carbs    != null ? Math.round(source.carbs    * scale) : null;
              const fat     = source?.fat      != null ? Math.round(source.fat      * scale) : null;

              return (
                    <TouchableOpacity key={log.id} style={styles.logItem} onPress={() => (navigation as any).navigate('LogFood', {
                      mealType: log.meal_type,
                      date: log.date,
                      food: log.food ? { ...log.food, id: log.food_id, is_local: true, data_type: null, external_id: null } : undefined,
                      recipe: log.recipe ?? undefined,
                      logId: log.id,
                      initialQuantity: log.quantity,
                    })}>
                      <View style={styles.logRow}>
                          <View style={styles.logInfo}>
                              <Text style={styles.logName}>{name ?? 'Unknown'}</Text>
                              <Text style={styles.logDetail}>{log.quantity}{log.unit} · {cals ?? '?'} kcal</Text>
                              <Text style={styles.logDetail}>P: {protein ?? '?'}g · C: {carbs ?? '?'}g · F: {fat ?? '?'}g</Text>
                          </View>
                          <TouchableOpacity onPress={() => handleDelete(log.id)}>
                              <Text style={styles.deleteButton}>✕</Text>
                          </TouchableOpacity>
                      </View>
                  </TouchableOpacity>
              );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  arrow: { fontSize: 24, paddingHorizontal: 16 },
  date: { fontSize: 18, fontWeight: '600' },
  mealSection: { marginBottom: 16 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  mealTitle: { fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
  addButton: { fontSize: 24, color: '#007AFF' },
  logItem: { padding: 8, backgroundColor: '#f5f5f5', borderRadius: 6, marginBottom: 4 },
  logName: { fontSize: 15, fontWeight: '500' },
  logDetail: { color: '#666', marginTop: 2, fontSize: 13 },
  summaryCard: { backgroundColor: '#f0f0f0', borderRadius: 10, padding: 14, marginBottom: 16 },
  summaryCalories: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  summaryMacros: { flexDirection: 'row', gap: 16 },
  summaryMacro: { fontSize: 14, color: '#555' },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logInfo: { flex: 1 },
  deleteButton: { color: '#FF3B30', fontSize: 16, paddingLeft: 12 },
  progressRow: { marginBottom: 12 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 14, fontWeight: '500', color: '#333' },
  progressValue: { fontSize: 13, color: '#666' },
  progressTrack: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4 },
  fiberRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 8 },
  fiberLabel: { fontSize: 13, color: '#555' },
  fiberValue: { fontSize: 13, color: '#666' },
  microsButton: { backgroundColor: '#E5E5EA', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4 },
  microsButtonText: { fontSize: 14, fontWeight: '600', color: '#333' },
});