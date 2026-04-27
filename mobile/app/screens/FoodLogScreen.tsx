import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

type NutritionSummary = { id: number; name: string; calories: number | null; protein: number | null; carbs: number | null; fat: number | null };

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

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [date])
  );

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
    let calories = 0, protein = 0, carbs = 0, fat = 0;
    for (const log of logs) {
      const isRecipe = !!log.recipe_id;
      const scale = isRecipe ? log.quantity / (log.recipe?.servings ?? 1) : log.quantity / 100;
      const source = isRecipe ? log.recipe : log.food;
      calories += source?.calories ? source.calories * scale : 0;
      protein  += source?.protein  ? source.protein  * scale : 0;
      carbs    += source?.carbs    ? source.carbs    * scale : 0;
      fat      += source?.fat      ? source.fat      * scale : 0;
    }
    return {
      calories: Math.round(calories),
      protein:  Math.round(protein),
      carbs:    Math.round(carbs),
      fat:      Math.round(fat),
    };
  }

  return (
    <View style={styles.container}>
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
            <Text style={styles.summaryCalories}>{totals.calories} kcal</Text>
            <View style={styles.summaryMacros}>
              <Text style={styles.summaryMacro}>P: {totals.protein}g</Text>
              <Text style={styles.summaryMacro}>C: {totals.carbs}g</Text>
              <Text style={styles.summaryMacro}>F: {totals.fat}g</Text>
            </View>
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
                  <View key={log.id} style={styles.logItem}>
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
                  </View>
              );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
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
  summaryCard: { backgroundColor: '#f0f0f0', borderRadius: 10, padding: 14, marginBottom: 16, alignItems: 'center' },
  summaryCalories: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  summaryMacros: { flexDirection: 'row', gap: 16 },
  summaryMacro: { fontSize: 14, color: '#555' },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logInfo: { flex: 1 },
  deleteButton: { color: '#FF3B30', fontSize: 16, paddingLeft: 12 },
});