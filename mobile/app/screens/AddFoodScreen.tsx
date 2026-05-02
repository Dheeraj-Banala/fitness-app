import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { searchFoods, FoodSearchResult } from '../services/foodSearch';

export default function AddFoodScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { mealType, date } = route.params as { mealType: string; date: string };

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [mode, setMode] = useState<'food' | 'recipe'>('food');
  const [recipes, setRecipes] = useState<{ id: number; name: string; servings: number; calories: number | null; protein: number | null; carbs: number | null; fat: number | null }[]>([]);

  useFocusEffect(
    useCallback(() => {
      const code = (route.params as any)?.barcode;
      if (code) handleBarcodeResult(code);
    }, [route.params])
  );

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

  async function handleBarcodeResult(code: string) {
    try {
      const data = await apiFetch(`/foods/barcode/${code}`, token);
      const food: FoodSearchResult = { ...data, id: null, is_local: false, data_type: null, external_id: null };
      (navigation as any).navigate('LogFood', { food, mealType, date });
    } catch (e) {
      Alert.alert('Not found', 'No food found for that barcode');
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
              <TouchableOpacity style={styles.resultItem} onPress={() => (navigation as any).navigate('LogFood', { food: item, mealType, date })}>
                <Text style={styles.resultName}>
                  {item.name}
                  {item.data_type ? <Text style={styles.resultDataType}>  ·  {item.data_type}</Text> : ''}
                </Text>
                <Text style={styles.resultCals}>{item.calories ?? '?'} kcal per 100g</Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {mode === 'recipe' && (
        <FlatList
          data={recipes}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultItem} onPress={() => (navigation as any).navigate('LogFood', { recipe: item, mealType, date })}>
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.resultCals}>{item.calories ?? '?'} kcal · {item.servings} servings</Text>
            </TouchableOpacity>
          )}
        />
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
  searchRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  searchButton: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, justifyContent: 'center' },
  searchButtonText: { color: 'white', fontWeight: '600' },
  scanButton: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 12 },
  scanButtonText: { fontSize: 15, fontWeight: '600', color: '#333' },
  resultItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  resultName: { fontSize: 16, fontWeight: '500' },
  resultDataType: { color: '#999', fontWeight: '400', fontSize: 14 },
  resultCals: { color: '#666', marginTop: 2 },
});
