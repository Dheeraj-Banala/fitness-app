import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { FoodSearchResult } from '../services/foodSearch';
import { colors, globalStyles } from '../theme';
import KeyboardDismissButton from '../components/KeyboardDismissButton';

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

  const isEditing = !!logId;
  const isRecipe = !!recipe;
  const name = food?.name ?? recipe?.name ?? '';

  const availableUnits: string[] = isRecipe
    ? ['serving']
    : food?.default_serving_name
      ? [food.default_serving_name, 'g', 'oz']
      : food?.default_serving_g != null
        ? ['serving', 'g', 'oz']
        : ['g', 'oz'];

  function unitLabel(unit: string): string {
    if (unit === 'serving' && !food?.default_serving_name && food?.default_serving_g != null) {
      return `serving (${food.default_serving_g}g)`;
    }
    return unit;
  }

  const [selectedUnit, setSelectedUnit] = useState(availableUnits[0]);
  const [quantity, setQuantity] = useState(initialQuantity ? String(initialQuantity) : '');

  function getScale(qty: number): number {
    if (isRecipe) return qty / (recipe!.servings);
    if (selectedUnit === 'g') return qty;
    if (selectedUnit === 'oz') return qty * 28.3495;
    return qty * (food!.default_serving_g ?? 1);
  }

  function macroPreview() {
    const qty = parseFloat(quantity) || 0;
    const scale = getScale(qty);
    const source = isRecipe ? recipe! : food!;
    return {
      calories: source.calories != null ? Math.round(source.calories * scale) : null,
      protein:  source.protein  != null ? Math.round(source.protein  * scale) : null,
      carbs:    source.carbs    != null ? Math.round(source.carbs    * scale) : null,
      fat:      source.fat      != null ? Math.round(source.fat      * scale) : null,
    };
  }

  function handleUnitChange(unit: string) {
    setSelectedUnit(unit);
    setQuantity('');
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
          body: JSON.stringify({ recipe_id: recipe!.id, meal_type: mealType, quantity: parseFloat(quantity), unit: 'serving', date }),
        });
      } else {
        let foodId = food!.id;
        if (!food!.is_local) {
          const saved = await apiFetch('/foods/', token, { method: 'POST', body: JSON.stringify(food) });
          foodId = saved.id;
        }
        await apiFetch('/food-logs/', token, {
          method: 'POST',
          body: JSON.stringify({ food_id: foodId, meal_type: mealType, quantity: parseFloat(quantity), unit: selectedUnit, date }),
        });
      }
      (navigation as any).popToTop();
    } catch (e) {
      Alert.alert('Error', 'Could not save food log');
    }
  }

  const preview = macroPreview();

  return (
    <View style={styles.screen}>
      <Text style={styles.name}>{name}</Text>
      {isRecipe && <Text style={styles.subtitle}>per serving ({recipe!.servings} servings total)</Text>}

      {!isRecipe && !isEditing && (
        <View style={styles.unitPicker}>
          {availableUnits.map(unit => (
            <TouchableOpacity
              key={unit}
              style={[styles.unitOption, selectedUnit === unit && styles.unitOptionActive]}
              onPress={() => handleUnitChange(unit)}>
              <Text style={[styles.unitOptionText, selectedUnit === unit && styles.unitOptionTextActive]}>
                {unitLabel(unit)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!isRecipe && food?.default_serving_name && selectedUnit === food.default_serving_name && (
        <Text style={styles.servingHint}>({food.default_serving_g}g each)</Text>
      )}

      <TextInput
                keyboardAppearance="dark"
        style={globalStyles.input}
        placeholder={isRecipe ? 'Servings' : `Quantity (${selectedUnit})`}
        placeholderTextColor={colors.textSecondary}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="decimal-pad"
        autoFocus
      />

      <View style={[globalStyles.card, styles.macroBox]}>
        <Text style={styles.macroCals}>{preview.calories ?? '?'} <Text style={styles.macroUnit}>kcal</Text></Text>
        <View style={styles.macroRow}>
          <Text style={styles.macroItem}>P: <Text style={styles.macroValue}>{preview.protein ?? '?'}g</Text></Text>
          <Text style={styles.macroItem}>C: <Text style={styles.macroValue}>{preview.carbs ?? '?'}g</Text></Text>
          <Text style={styles.macroItem}>F: <Text style={styles.macroValue}>{preview.fat ?? '?'}g</Text></Text>
        </View>
      </View>

      <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
        <Text style={styles.confirmBtnText}>{isEditing ? 'Update' : 'Log Food'}</Text>
      </TouchableOpacity>

      {food?.is_local && food.id != null && (
        <TouchableOpacity style={styles.editBtn} onPress={() => (navigation as any).navigate('EditFood', { foodId: food.id })}>
          <Text style={styles.editBtnText}>Edit Food</Text>
        </TouchableOpacity>
      )}

      {isRecipe && recipe?.id != null && (
        <TouchableOpacity style={styles.editBtn} onPress={() => (navigation as any).navigate('EditRecipe', { recipeId: recipe.id })}>
          <Text style={styles.editBtnText}>Edit Recipe</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>

      <KeyboardDismissButton />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 24 },

  name: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 20 },

  unitPicker: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  unitOption: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card },
  unitOptionActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  unitOptionText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  unitOptionTextActive: { color: 'white' },
  servingHint: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },

  macroBox: { padding: 20, alignItems: 'center', marginBottom: 24 },
  macroCals: { fontSize: 32, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  macroUnit: { fontSize: 18, fontWeight: '400', color: colors.textSecondary },
  macroRow: { flexDirection: 'row', gap: 24 },
  macroItem: { fontSize: 14, color: colors.textSecondary },
  macroValue: { fontWeight: '600', color: colors.textPrimary },

  confirmBtn: { backgroundColor: colors.success, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 12 },
  confirmBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  editBtn: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12, backgroundColor: 'rgba(0,122,255,0.08)' },
  editBtnText: { color: colors.blue, fontWeight: '600', fontSize: 15 },
  cancelText: { color: colors.destructive, textAlign: 'center', padding: 8, fontWeight: '500' },
});
