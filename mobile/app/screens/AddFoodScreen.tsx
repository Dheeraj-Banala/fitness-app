import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { searchFoods, FoodSearchResult } from '../services/foodSearch';

type MyFood = {
  id: number;
  name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  saturated_fat: number | null;
  sodium: number | null;
  potassium: number | null;
  calcium: number | null;
  magnesium: number | null;
  iron: number | null;
  zinc: number | null;
  vitamin_d: number | null;
  vitamin_c: number | null;
  vitamin_a: number | null;
  vitamin_b12: number | null;
  folate: number | null;
  default_serving_g: number | null;
  default_serving_name: string | null;
  is_public: boolean;
  serving_size: number;
  serving_unit: string;
};

export default function AddFoodScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { mealType, date } = route.params as { mealType: string; date: string };

  const [mode, setMode] = useState<'food' | 'recipe' | 'mine'>('food');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);

  const [recipeQuery, setRecipeQuery] = useState('');
  const [recipes, setRecipes] = useState<{ id: number; name: string; servings: number; calories: number | null }[]>([]);

  const [myFoods, setMyFoods] = useState<MyFood[]>([]);
  const [myFoodsQuery, setMyFoodsQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      const code = (route.params as any)?.barcode;
      if (code) handleBarcodeResult(code);
    }, [route.params])
  );

  useFocusEffect(
    useCallback(() => {
      if (mode === 'mine') loadMyFoods();
    }, [mode])
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

  async function loadRecipes(q = recipeQuery) {
    try {
      const url = q ? `/recipes/?search=${encodeURIComponent(q)}` : '/recipes/';
      const data = await apiFetch(url, token);
      setRecipes(data);
    } catch (e) {}
  }

  async function loadMyFoods(q = myFoodsQuery) {
    try {
      const url = q ? `/foods/mine?search=${encodeURIComponent(q)}` : '/foods/mine';
      const data = await apiFetch(url, token);
      setMyFoods(data);
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
        {(['food', 'recipe', 'mine'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.toggleOption, mode === tab && styles.toggleActive]}
            onPress={() => {
              setMode(tab);
              if (tab === 'recipe') loadRecipes('');
              if (tab === 'mine') loadMyFoods('');
            }}>
            <Text style={[styles.toggleText, mode === tab && styles.toggleTextActive]}>
              {tab === 'food' ? 'Food' : tab === 'recipe' ? 'Recipe' : 'My Foods'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'food' && (
        <>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => (navigation as any).navigate('Barcode', { mealType, date })}>
            <Text style={styles.createButtonText}>Scan Barcode</Text>
          </TouchableOpacity>
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

          <FlatList
            data={results}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem} onPress={() => (navigation as any).navigate('LogFood', { food: item, mealType, date })}>
                <Text style={styles.resultName}>
                  {item.name}
                  {item.data_type ? <Text style={styles.resultDataType}>  ·  {item.data_type}</Text> : ''}
                </Text>
                <Text style={styles.resultCals}>{item.calories != null ? Math.round(item.calories * 100) : '?'} kcal per 100g</Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {mode === 'recipe' && (
        <>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => (navigation as any).navigate('CreateRecipe')}>
            <Text style={styles.createButtonText}>+ Create Recipe</Text>
          </TouchableOpacity>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes..."
              value={recipeQuery}
              onChangeText={setRecipeQuery}
              onSubmitEditing={() => loadRecipes(recipeQuery)}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchButton} onPress={() => loadRecipes(recipeQuery)}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
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
        </>
      )}

      {mode === 'mine' && (
        <>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => (navigation as any).navigate('CreateFood', { mealType, date })}>
            <Text style={styles.createButtonText}>+ Create Custom Food</Text>
          </TouchableOpacity>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search my foods..."
              value={myFoodsQuery}
              onChangeText={setMyFoodsQuery}
              onSubmitEditing={() => loadMyFoods(myFoodsQuery)}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchButton} onPress={() => loadMyFoods(myFoodsQuery)}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={myFoods}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => (navigation as any).navigate('LogFood', {
                  food: { ...item, is_local: true, data_type: null, external_id: null, source: 'user' },
                  mealType, date,
                })}>
                <Text style={styles.resultName}>
                  {item.name}
                  {!item.is_public && <Text style={styles.privateTag}>  · private</Text>}
                </Text>
                <Text style={styles.resultCals}>{item.calories != null ? Math.round(item.calories * 100) : '?'} kcal per 100g</Text>
              </TouchableOpacity>
            )}
          />
        </>
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
  createButton: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 12 },
  createButtonText: { fontSize: 15, fontWeight: '600', color: '#007AFF' },
  resultItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  resultName: { fontSize: 16, fontWeight: '500' },
  resultDataType: { color: '#999', fontWeight: '400', fontSize: 14 },
  resultCals: { color: '#666', marginTop: 2 },
  privateTag: { color: '#999', fontWeight: '400', fontSize: 14 },
});
