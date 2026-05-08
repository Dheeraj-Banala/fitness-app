import React, { useState } from 'react';
import { View, ScrollView, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { searchFoods, FoodSearchResult } from '../services/foodSearch';
import { colors, globalStyles } from '../theme';
import KeyboardDismissButton from '../components/KeyboardDismissButton';

type IngredientInput = {
  food_id: number;
  food_name: string;
  quantity: number;
  unit: string;
};

export default function CreateRecipeScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('1');
  const [ingredients, setIngredients] = useState<IngredientInput[]>([]);

  const [foodQuery, setFoodQuery] = useState('');
  const [foodResults, setFoodResults] = useState<FoodSearchResult[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [quantity, setQuantity] = useState('');

  async function handleFoodSearch() {
    if (!foodQuery) return;
    try {
      const data = await searchFoods(foodQuery, token);
      setFoodResults(data);
    } catch (e) {
      Alert.alert('Error', 'Could not search foods');
    }
  }

  async function handleAddIngredient() {
    if (!selectedFood || !quantity) return;
    try {
      let foodId = selectedFood.id;
      if (!selectedFood.is_local) {
        const saved = await apiFetch('/foods/', token, {
          method: 'POST',
          body: JSON.stringify(selectedFood),
        });
        foodId = saved.id;
      }
      setIngredients([...ingredients, {
        food_id: foodId!,
        food_name: selectedFood.name,
        quantity: parseFloat(quantity),
        unit: 'g',
      }]);
      setSelectedFood(null);
      setFoodQuery('');
      setFoodResults([]);
      setQuantity('');
    } catch (e) {
      Alert.alert('Error', 'Could not add ingredient');
    }
  }

  async function handleSubmit() {
    if (!name || ingredients.length === 0) return;
    try {
      await apiFetch('/recipes/', token, {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: description || null,
          servings: parseFloat(servings) || 1,
          ingredients: ingredients.map(i => ({ food_id: i.food_id, quantity: i.quantity, unit: i.unit })),
        }),
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save recipe');
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={globalStyles.card}>
          <TextInput
                keyboardAppearance="dark" style={styles.input} placeholder="Recipe Name" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} />
          <View style={styles.inputDivider} />
          <TextInput
                keyboardAppearance="dark" style={styles.input} placeholder="Description (optional)" placeholderTextColor={colors.textSecondary} value={description} onChangeText={setDescription} />
          <View style={styles.inputDivider} />
          <TextInput
                keyboardAppearance="dark" style={styles.input} placeholder="Servings" placeholderTextColor={colors.textSecondary} value={servings} onChangeText={setServings} keyboardType="decimal-pad" />
        </View>

        <Text style={styles.sectionTitle}>Add Ingredient</Text>

        {selectedFood ? (
          <View style={[globalStyles.card, styles.selectedCard]}>
            <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
            <TextInput
                keyboardAppearance="dark"
              style={[globalStyles.input, { marginTop: 12, marginBottom: 0 }]}
              placeholder="Quantity (g)"
              placeholderTextColor={colors.textSecondary}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddIngredient}>
              <Text style={styles.addBtnText}>+ Add to Recipe</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedFood(null)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.searchRow}>
              <TextInput
                keyboardAppearance="dark"
                style={styles.searchInput}
                placeholder="Search foods..."
                placeholderTextColor={colors.textSecondary}
                value={foodQuery}
                onChangeText={setFoodQuery}
                onSubmitEditing={handleFoodSearch}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleFoodSearch}>
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
            {foodResults.length > 0 && (
              <View style={globalStyles.card}>
                {foodResults.map((food, index) => (
                  <View key={index}>
                    {index > 0 && <View style={styles.divider} />}
                    <TouchableOpacity style={styles.resultItem} onPress={() => setSelectedFood(food)}>
                      <Text style={styles.resultName}>
                        {food.name}
                        {food.data_type ? <Text style={styles.resultMeta}>  ·  {food.data_type}</Text> : ''}
                      </Text>
                      <Text style={styles.resultSub}>{food.calories != null ? Math.round(food.calories * 100) : '?'} kcal per 100g</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {ingredients.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Ingredients ({ingredients.length})</Text>
            <View style={globalStyles.card}>
              {ingredients.map((ing, index) => (
                <View key={index}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.ingredientRow}>
                    <Text style={styles.ingredientName}>{ing.food_name}</Text>
                    <Text style={styles.ingredientDetail}>{ing.quantity}{ing.unit}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
          <Text style={styles.saveBtnText}>Save Recipe</Text>
        </TouchableOpacity>
      </ScrollView>
      <KeyboardDismissButton />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },

  input: { paddingHorizontal: 16, paddingVertical: 13, color: colors.textPrimary, fontSize: 15 },
  inputDivider: { height: 1, backgroundColor: colors.divider, marginHorizontal: 16 },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 24, marginBottom: 10 },

  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    padding: 12,
    color: colors.textPrimary,
  },
  searchButton: { backgroundColor: colors.blue, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
  searchButtonText: { color: 'white', fontWeight: '600' },

  divider: { height: 1, backgroundColor: colors.divider, marginHorizontal: 16 },
  resultItem: { paddingHorizontal: 16, paddingVertical: 12 },
  resultName: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  resultMeta: { fontSize: 13, fontWeight: '400', color: colors.textSecondary },
  resultSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  selectedCard: { padding: 16 },
  selectedFoodName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  addBtn: { backgroundColor: colors.success, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 12, marginBottom: 8 },
  addBtnText: { color: 'white', fontWeight: '600' },
  cancelText: { color: colors.destructive, textAlign: 'center', paddingVertical: 8, fontWeight: '500' },

  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  ingredientName: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  ingredientDetail: { fontSize: 14, color: colors.textSecondary },

  saveBtn: { backgroundColor: colors.blue, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
