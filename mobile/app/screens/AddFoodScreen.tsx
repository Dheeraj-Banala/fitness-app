import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { searchFoods, FoodSearchResult } from '../services/foodSearch'

export default function AddFoodScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { mealType, date, barcode } = route.params as { mealType: string; date: string; barcode?: string };

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [quantity, setQuantity] = useState('');
  const [mode, setMode] = useState<'food' | 'recipe'>('food');
  const [recipes, setRecipes] = useState<{id: number; name: string; servings: number; calories: number | null; protein: number | null; carbs: number | null; fat: number | null}[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<{id: number; name: string; servings: number; calories: number | null; protein: number | null; carbs: number | null; fat: number | null} | null>(null);

  async function handleSearch() {
    if (!query) return;
    try {
      const data = await searchFoods(query, token);
      setResults(data);
    } catch (e) {
      Alert.alert('Error', 'Could not search foods');
    }
  }

  async function loadRecipes() {
    try {
      const data = await apiFetch('/recipes/', token);
      setRecipes(data);
    } catch (e) {}
  }

  async function handleLog(food: FoodSearchResult) {
    setSelectedFood(food);
  }

  useFocusEffect(
    useCallback(() => {
      const code = (route.params as any)?.barcode;
      if (code) handleBarcodeResult(code);
    }, [route.params])
  );

  async function handleBarcodeResult(code: string) {
    try {
      const data = await apiFetch(`/foods/barcode/${code}`, token);
      setSelectedFood({ ...data, id: null, is_local: false, data_type: null, external_id: null });
    } catch (e) {
      Alert.alert('Not found', 'No food found for that barcode');
    }
  }

  async function handleConfirmLog() {
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

      await apiFetch('/food-logs/', token, {
        method: 'POST',
        body: JSON.stringify({
          food_id: foodId,
          meal_type: mealType,
          quantity: parseFloat(quantity),
          unit: selectedFood.serving_unit,
          date,
        }),
      });

      if (barcode) {
        (navigation as any).navigate('FoodLog');
      } else {
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert('Error', 'Could not log food');
    }
  }

  async function handleConfirmRecipeLog() {
    if (!selectedRecipe || !quantity) return;
    try {
      await apiFetch('/food-logs/', token, {
        method: 'POST',
        body: JSON.stringify({
          recipe_id: selectedRecipe.id,
          meal_type: mealType,
          quantity: parseFloat(quantity),
          unit: 'serving',
          date,
        }),
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not log recipe');
    }
  }

  

  return (
    <View style={styles.container}>
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleOption, mode === 'food' && styles.toggleActive]}
          onPress={() => setMode('food')}>
          <Text style={[styles.toggleText, mode === 'food' && styles.toggleTextActive]}>Food</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleOption, mode === 'recipe' && styles.toggleActive]}
          onPress={() => { setMode('recipe'); loadRecipes(); }}>
          <Text style={[styles.toggleText, mode === 'recipe' && styles.toggleTextActive]}>Recipe</Text>
        </TouchableOpacity>
      </View>

      {mode === 'food' && (
        selectedFood ? (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmName}>{selectedFood.name}</Text>
            <Text style={styles.confirmCals}>per 100{selectedFood.serving_unit}</Text>
            <TextInput
              style={styles.input}
              placeholder={`Quantity (${selectedFood.serving_unit})`}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
            />
            {(() => {
              const scale = (parseFloat(quantity) || 0) / 100;
              return (
                <View style={styles.macroBox}>
                  <Text style={styles.macroCalories}>{selectedFood.calories != null ? Math.round(selectedFood.calories * scale) : '?'} kcal</Text>
                  <View style={styles.macroRow}>
                    <Text style={styles.macroItem}>P: {selectedFood.protein != null ? Math.round(selectedFood.protein * scale) : '?'}g</Text>
                    <Text style={styles.macroItem}>C: {selectedFood.carbs   != null ? Math.round(selectedFood.carbs   * scale) : '?'}g</Text>
                    <Text style={styles.macroItem}>F: {selectedFood.fat     != null ? Math.round(selectedFood.fat     * scale) : '?'}g</Text>
                  </View>
                </View>
              );
            })()}
            <TouchableOpacity style={styles.logButton} onPress={handleConfirmLog}>
              <Text style={styles.logButtonText}>Log Food</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedFood(null)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search foods..."
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => (navigation as any).navigate('Barcode', { mealType, date })}>
              <Text style={styles.scanButtonText}>Scan Barcode</Text>
            </TouchableOpacity>
            <FlatList
              data={results}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.resultItem} onPress={() => handleLog(item)}>
                  <Text style={styles.resultName}>
                    {item.name}
                    {item.data_type ? <Text style={styles.resultDataType}>  ·  {item.data_type}</Text> : ''}
                  </Text>
                  <Text style={styles.resultCals}>{item.calories ?? '?'} kcal per 100g</Text>
                </TouchableOpacity>
              )}
            />
          </>
        )
      )}

      {mode === 'recipe' && (
        selectedRecipe ? (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmName}>{selectedRecipe.name}</Text>
            <TextInput
              style={styles.input}
              placeholder="Servings"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
            />
            {(() => {
              const scale = (parseFloat(quantity) || 0) / selectedRecipe.servings;
              return (
                <View style={styles.macroBox}>
                  <Text style={styles.macroCalories}>{selectedRecipe.calories != null ? Math.round(selectedRecipe.calories * scale) : '?'} kcal</Text>
                  <View style={styles.macroRow}>
                    <Text style={styles.macroItem}>P: {selectedRecipe.protein != null ? Math.round(selectedRecipe.protein * scale) : '?'}g</Text>
                    <Text style={styles.macroItem}>C: {selectedRecipe.carbs   != null ? Math.round(selectedRecipe.carbs   * scale) : '?'}g</Text>
                    <Text style={styles.macroItem}>F: {selectedRecipe.fat     != null ? Math.round(selectedRecipe.fat     * scale) : '?'}g</Text>
                  </View>
                </View>
              );
            })()}
            <TouchableOpacity style={styles.logButton} onPress={handleConfirmRecipeLog}>
              <Text style={styles.logButtonText}>Log Recipe</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedRecipe(null)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={recipes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem} onPress={() => setSelectedRecipe(item)}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultCals}>{item.calories ?? '?'} kcal · {item.servings} servings</Text>
              </TouchableOpacity>
            )}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  toggle: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 16 },
  toggleOption: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  toggleActive: { backgroundColor: '#007AFF' },
  toggleText: { fontWeight: '600', color: '#666' },
  toggleTextActive: { color: 'white' },
  searchRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  searchButton: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, justifyContent: 'center' },
  searchButtonText: { color: 'white', fontWeight: '600' },
  resultItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  resultName: { fontSize: 16, fontWeight: '500' },
  resultDataType: { color: '#999', fontWeight: '400', fontSize: 14 },
  resultCals: { color: '#666', marginTop: 2 },
  confirmBox: { backgroundColor: '#f5f5f5', padding: 16, borderRadius: 12 },
  confirmName: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  confirmCals: { color: '#666', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: 'white' },
  logButton: { backgroundColor: '#34C759', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  logButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  cancelText: { color: '#FF3B30', textAlign: 'center', padding: 8 },
  macroBox: { backgroundColor: 'white', borderRadius: 8, padding: 12, marginBottom: 12, alignItems: 'center' },
  macroCalories: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  macroRow: { flexDirection: 'row', gap: 16 },
  macroItem: { fontSize: 14, color: '#555' },
  scanButton: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 12 },
  scanButtonText: { fontSize: 15, fontWeight: '600', color: '#333' },
});