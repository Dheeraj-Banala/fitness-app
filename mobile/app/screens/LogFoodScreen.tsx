import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { FoodSearchResult } from '../services/foodSearch';

type RecipeOption = {
  id: number;
  name: string;
  servings: number;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

type Params = {
  mealType: string;
  date: string;
  food?: FoodSearchResult;
  recipe?: RecipeOption;
  logId?: number;
  initialQuantity?: number;
};

export default function LogFoodScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { mealType, date, food, recipe, logId, initialQuantity } = route.params as Params;

  const [quantity, setQuantity] = useState(initialQuantity ? String(initialQuantity) : '');

  const isEditing = !!logId;
  const isRecipe = !!recipe;
  const name = food?.name ?? recipe?.name ?? '';
  const servingUnit = food?.serving_unit ?? 'g';

  function macroPreview() {
    const qty = parseFloat(quantity) || 0;
    const scale = isRecipe ? qty / (recipe!.servings) : qty / 100;
    const source = isRecipe ? recipe! : food!;
    return {
      calories: source.calories != null ? Math.round(source.calories * scale) : null,
      protein:  source.protein  != null ? Math.round(source.protein  * scale) : null,
      carbs:    source.carbs    != null ? Math.round(source.carbs    * scale) : null,
      fat:      source.fat      != null ? Math.round(source.fat      * scale) : null,
    };
  }

  async function handleConfirm() {
    if (!quantity) return;
    try {
      if (isEditing) {
        await apiFetch(`/food-logs/${logId}`, token, {
          method: 'PATCH',
          body: JSON.stringify({ quantity: parseFloat(quantity) }),
        });
      } else if (isRecipe) {
        await apiFetch('/food-logs/', token, {
          method: 'POST',
          body: JSON.stringify({
            recipe_id: recipe!.id,
            meal_type: mealType,
            quantity: parseFloat(quantity),
            unit: 'serving',
            date,
          }),
        });
      } else {
        let foodId = food!.id;
        if (!food!.is_local) {
          const saved = await apiFetch('/foods/', token, {
            method: 'POST',
            body: JSON.stringify(food),
          });
          foodId = saved.id;
        }
        await apiFetch('/food-logs/', token, {
          method: 'POST',
          body: JSON.stringify({
            food_id: foodId,
            meal_type: mealType,
            quantity: parseFloat(quantity),
            unit: food!.serving_unit,
            date,
          }),
        });
      }
      (navigation as any).navigate('FoodLog');
    } catch (e) {
      Alert.alert('Error', 'Could not save food log');
    }
  }

  const preview = macroPreview();

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.subtitle}>
        {isRecipe ? `per serving (${recipe!.servings} servings total)` : `per 100 ${servingUnit}`}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={isRecipe ? 'Servings' : `Quantity (${servingUnit})`}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="decimal-pad"
        autoFocus
      />

      <View style={styles.macroBox}>
        <Text style={styles.macroCals}>{preview.calories ?? '?'} kcal</Text>
        <View style={styles.macroRow}>
          <Text style={styles.macroItem}>P: {preview.protein ?? '?'}g</Text>
          <Text style={styles.macroItem}>C: {preview.carbs ?? '?'}g</Text>
          <Text style={styles.macroItem}>F: {preview.fat ?? '?'}g</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>{isEditing ? 'Update' : 'Log Food'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  name: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  macroBox: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 24 },
  macroCals: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  macroRow: { flexDirection: 'row', gap: 20 },
  macroItem: { fontSize: 15, color: '#555' },
  confirmButton: { backgroundColor: '#34C759', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12 },
  confirmButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  cancelText: { color: '#FF3B30', textAlign: 'center', padding: 8 },
});
