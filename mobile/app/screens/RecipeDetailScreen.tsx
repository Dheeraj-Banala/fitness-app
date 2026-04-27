import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

type Ingredient = {
  id: number;
  food_id: number;
  quantity: number;
  unit: string;
  food?: {
    name: string;
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  };
};

type Recipe = {
  id: number;
  name: string;
  description: string | null;
  servings: number;
  ingredients: Ingredient[];
};

export default function RecipeDetailScreen() {
  const { token } = useAuth();
  const route = useRoute();
  const { recipeId } = route.params as { recipeId: number };
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    loadRecipe();
  }, []);

  async function loadRecipe() {
    try {
      const data = await apiFetch(`/recipes/${recipeId}`, token);
      const ingredientsWithFood = await Promise.all(
        data.ingredients.map(async (ing: Ingredient) => {
          const food = await apiFetch(`/foods/${ing.food_id}`, token);
          return { ...ing, food };
        })
      );
      setRecipe({ ...data, ingredients: ingredientsWithFood });
    } catch (e) {
      Alert.alert('Error', 'Could not load recipe');
    }
  }

  function totalNutrition() {
    if (!recipe) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    let calories = 0, protein = 0, carbs = 0, fat = 0;
    for (const ing of recipe.ingredients) {
      const scale = ing.quantity / 100;
      calories += (ing.food?.calories ?? 0) * scale;
      protein  += (ing.food?.protein  ?? 0) * scale;
      carbs    += (ing.food?.carbs    ?? 0) * scale;
      fat      += (ing.food?.fat      ?? 0) * scale;
    }
    return {
      calories: Math.round(calories),
      protein:  Math.round(protein),
      carbs:    Math.round(carbs),
      fat:      Math.round(fat),
    };
  }

  if (!recipe) return null;

  const totals = totalNutrition();
  const perServing = {
    calories: Math.round(totals.calories / recipe.servings),
    protein:  Math.round(totals.protein  / recipe.servings),
    carbs:    Math.round(totals.carbs    / recipe.servings),
    fat:      Math.round(totals.fat      / recipe.servings),
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{recipe.name}</Text>
      {recipe.description && <Text style={styles.description}>{recipe.description}</Text>}

      <View style={styles.nutritionCard}>
        <Text style={styles.nutritionLabel}>Per serving ({recipe.servings} total)</Text>
        <Text style={styles.nutritionCalories}>{perServing.calories} kcal</Text>
        <View style={styles.macroRow}>
          <Text style={styles.macroItem}>P: {perServing.protein}g</Text>
          <Text style={styles.macroItem}>C: {perServing.carbs}g</Text>
          <Text style={styles.macroItem}>F: {perServing.fat}g</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Ingredients</Text>
      {recipe.ingredients.map((ing) => {
        const scale = ing.quantity / 100;
        const cals = Math.round((ing.food?.calories ?? 0) * scale);
        return (
          <View key={ing.id} style={styles.ingredientItem}>
            <View style={styles.ingredientRow}>
              <Text style={styles.ingredientName}>{ing.food?.name ?? 'Unknown'}</Text>
              <Text style={styles.ingredientQuantity}>{ing.quantity}{ing.unit}</Text>
            </View>
            <Text style={styles.ingredientCals}>{cals} kcal</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  description: { color: '#666', marginBottom: 16 },
  nutritionCard: { backgroundColor: '#f0f0f0', borderRadius: 10, padding: 14, marginBottom: 20, alignItems: 'center' },
  nutritionLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  nutritionCalories: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  macroRow: { flexDirection: 'row', gap: 16 },
  macroItem: { fontSize: 14, color: '#555' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  ingredientItem: { padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 8 },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ingredientName: { fontWeight: '500', flex: 1 },
  ingredientQuantity: { color: '#666' },
  ingredientCals: { color: '#999', marginTop: 2, fontSize: 13 },
});