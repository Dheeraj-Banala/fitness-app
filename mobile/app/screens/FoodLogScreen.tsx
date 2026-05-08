import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { colors, globalStyles } from '../theme';

type NutritionSummary = {
  id: number; name: string;
  calories: number | null; protein: number | null; carbs: number | null; fat: number | null; fiber: number | null;
  sodium: number | null; potassium: number | null; calcium: number | null; magnesium: number | null;
  iron: number | null; zinc: number | null; vitamin_d: number | null; vitamin_c: number | null;
  vitamin_a: number | null; vitamin_b12: number | null; folate: number | null;
  default_serving_g: number | null;
  default_serving_name: string | null;
};

function scaleFood(qty: number, unit: string, defaultServingG: number | null): number {
  if (unit === 'g') return qty;
  if (unit === 'oz') return qty * 28.3495;
  return qty * (defaultServingG ?? 1);
}

function displayUnit(qty: number, unit: string): string {
  if (unit === 'g' || unit === 'oz') return unit;
  if (qty !== 1 && !unit.endsWith('s')) return unit + 's';
  return unit;
}

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

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const today = toLocalDateString(new Date());
  const yesterday = (() => { const y = new Date(); y.setDate(y.getDate() - 1); return toLocalDateString(y); })();
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
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
      await apiFetch(`/food-logs/${logId}`, token, { method: 'DELETE' });
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
      const scale = isRecipe
        ? log.quantity / (log.recipe?.servings ?? 1)
        : scaleFood(log.quantity, log.unit, log.food?.default_serving_g ?? null);
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

  const insets = useSafeAreaInsets();
  const totals = dailyTotals();

  const macroRows = [
    { label: 'Protein', value: totals.protein, goal: goals?.protein_g, unit: 'g',    color: colors.blue },
    { label: 'Carbs',   value: totals.carbs,   goal: goals?.carbs_g,   unit: 'g',    color: colors.success },
    { label: 'Fat',     value: totals.fat,     goal: goals?.fat_g,     unit: 'g',    color: colors.purple },
    { label: 'Fiber',   value: totals.fiber,   goal: 28,               unit: 'g',    color: colors.teal },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16 }}>
      {/* Date navigation */}
      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.arrowBtn}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>{formatDate(date)}</Text>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.arrowBtn}>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Summary card */}
      <View style={[globalStyles.card, styles.summaryCard]}>
        {/* Calories — large bar */}
        <View style={styles.calorieRow}>
          <Text style={styles.calorieHeadline}>
            {totals.calories} <Text style={styles.calorieGoal}>/ {goals?.calories ?? '—'} kcal</Text>
          </Text>
        </View>
        <View style={styles.calorieTrack}>
          <View style={[styles.calorieFill, {
            width: `${Math.min((totals.calories / (goals?.calories ?? 1)) * 100, 100)}%`,
          }]} />
        </View>

        <View style={styles.macroDivider} />

        {macroRows.map(({ label, value, goal, unit, color }) => (
          <View key={label} style={styles.macroRow}>
            <Text style={styles.macroLabel}>{label}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {
                width: `${Math.min((value / (goal ?? 1)) * 100, 100)}%`,
                backgroundColor: color,
              }]} />
            </View>
            <Text style={styles.macroValue}>{value}<Text style={styles.macroGoal}> / {goal ?? '—'}{unit}</Text></Text>
          </View>
        ))}

        <TouchableOpacity
          style={styles.microsBtn}
          onPress={() => (navigation as any).navigate('Micronutrients', { micros: totals.micros, date })}
        >
          <Text style={styles.microsBtnText}>Micronutrients  ›</Text>
        </TouchableOpacity>
      </View>

      {/* Meal sections */}
      {MEAL_TYPES.map(mealType => {
        const mealLogs = logsForMeal(mealType);
        return (
          <View key={mealType} style={[globalStyles.card, styles.mealCard]}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealTitle}>{mealType.toUpperCase()}</Text>
              <TouchableOpacity onPress={() => (navigation as any).navigate('AddFood', { mealType, date })}>
                <Text style={styles.addBtn}>＋</Text>
              </TouchableOpacity>
            </View>

            {mealLogs.length > 0 && <View style={styles.divider} />}

            {mealLogs.map((log, index) => {
              const isRecipe = !!log.recipe_id;
              const name = isRecipe ? log.recipe?.name : log.food?.name;
              const scale = isRecipe
                ? log.quantity / (log.recipe?.servings ?? 1)
                : scaleFood(log.quantity, log.unit, log.food?.default_serving_g ?? null);
              const source = isRecipe ? log.recipe : log.food;
              const cals    = source?.calories != null ? Math.round(source.calories * scale) : null;
              const protein = source?.protein  != null ? Math.round(source.protein  * scale) : null;
              const carbs   = source?.carbs    != null ? Math.round(source.carbs    * scale) : null;
              const fat     = source?.fat      != null ? Math.round(source.fat      * scale) : null;

              return (
                <View key={log.id}>
                  {index > 0 && <View style={styles.itemDivider} />}
                  <TouchableOpacity
                    style={styles.logItem}
                    onPress={() => (navigation as any).navigate('LogFood', {
                      mealType: log.meal_type,
                      date: log.date,
                      food: log.food ? { ...log.food, id: log.food_id, is_local: true, data_type: null, external_id: null } : undefined,
                      recipe: log.recipe ?? undefined,
                      logId: log.id,
                      initialQuantity: log.quantity,
                    })}
                  >
                    <View style={styles.logRow}>
                      <View style={styles.logInfo}>
                        <Text style={styles.logName}>{name ?? 'Unknown'}</Text>
                        <Text style={styles.logDetail}>
                          {log.quantity} {displayUnit(log.quantity, log.unit)} · {cals ?? '?'} kcal · P:{protein ?? '?'}g C:{carbs ?? '?'}g F:{fat ?? '?'}g
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDelete(log.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.deleteBtn}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  arrowBtn: { padding: 8 },
  arrow: { fontSize: 28, color: colors.blue, fontWeight: '300' },
  dateText: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },

  summaryCard: { padding: 16, marginBottom: 16 },
  calorieRow: { marginBottom: 8 },
  calorieHeadline: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  calorieGoal: { fontSize: 18, fontWeight: '400', color: colors.textSecondary },
  calorieTrack: { height: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 5, marginBottom: 4 },
  calorieFill: { height: 10, borderRadius: 5, backgroundColor: colors.warning },
  macroDivider: { height: 1, backgroundColor: colors.divider, marginVertical: 12 },

  macroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  macroLabel: { fontSize: 13, color: colors.textSecondary, width: 58 },
  progressTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, marginHorizontal: 10 },
  progressFill: { height: 6, borderRadius: 3 },
  macroValue: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, minWidth: 72, textAlign: 'right' },
  macroGoal: { fontSize: 12, fontWeight: '400', color: colors.textSecondary },

  microsBtn: { backgroundColor: 'rgba(0,122,255,0.12)', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,122,255,0.2)' },
  microsBtnText: { fontSize: 14, fontWeight: '600', color: colors.blue },

  mealCard: { marginBottom: 14, overflow: 'hidden' },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  mealTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.5 },
  addBtn: { fontSize: 22, color: colors.blue, lineHeight: 26 },

  divider: { height: 1, backgroundColor: colors.divider },
  itemDivider: { height: 1, backgroundColor: colors.divider, marginLeft: 16 },

  logItem: { paddingHorizontal: 16, paddingVertical: 11 },
  logRow: { flexDirection: 'row', alignItems: 'center' },
  logInfo: { flex: 1 },
  logName: { fontSize: 15, fontWeight: '500', color: colors.textPrimary, marginBottom: 2 },
  logDetail: { fontSize: 12, color: colors.textSecondary },
  deleteBtn: { color: colors.destructive, fontSize: 14, paddingLeft: 12 },
});
