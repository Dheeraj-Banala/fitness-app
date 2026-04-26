import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

type FoodLogEntry = {
  id: number;
  meal_type: string;
  quantity: number;
  unit: string;
  date: string;
  food_id: number | null;
  recipe_id: number | null;
  food: { id: number; name: string; calories: number | null; protein: number | null; carbs: number | null; fat: number | null } | null;};

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function FoodLogScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
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
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  }

  function logsForMeal(mealType: string) {
    return logs.filter(log => log.meal_type === mealType);
  }

  function dailyTotals() {
    let calories = 0, protein = 0, carbs = 0, fat = 0;
    for (const log of logs) {
      const scale = log.quantity / 100;
      calories += log.food?.calories ? log.food.calories * scale : 0;
      protein += log.food?.protein ? log.food.protein * scale : 0;
      carbs += log.food?.carbs ? log.food.carbs * scale : 0;
      fat += log.food?.fat ? log.food.fat * scale : 0;
    }
    return {
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
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
              const scale = log.quantity / 100;
              const cals = log.food?.calories ? Math.round(log.food.calories * scale) : null;
              const protein = log.food?.protein ? Math.round(log.food.protein * scale) : null;
              const carbs = log.food?.carbs ? Math.round(log.food.carbs * scale) : null;
              const fat = log.food?.fat ? Math.round(log.food.fat * scale) : null;

              return (
                  <View key={log.id} style={styles.logItem}>
                      <Text style={styles.logName}>{log.food?.name ?? 'Unknown food'}</Text>
                      <Text style={styles.logDetail}>{log.quantity}{log.unit} · {cals ?? '?'} kcal</Text>
                      <Text style={styles.logDetail}>P: {protein ?? '?'}g · C: {carbs ?? '?'}g · F: {fat ?? '?'}g</Text>
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
});