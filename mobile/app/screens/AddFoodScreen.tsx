import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { searchFoods, FoodSearchResult } from '../services/foodSearch';
import { colors } from '../theme';
import KeyboardDismissButton from '../components/KeyboardDismissButton';

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
      {/* Tab toggle */}
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
            style={styles.actionButton}
            onPress={() => (navigation as any).navigate('Barcode', { mealType, date })}>
            <Text style={styles.actionButtonText}>Scan Barcode</Text>
          </TouchableOpacity>
          <View style={styles.searchRow}>
            <TextInput
                keyboardAppearance="dark"
              style={styles.searchInput}
              placeholder="Search foods..."
              placeholderTextColor={colors.textSecondary}
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
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.resultItem, index === 0 && styles.resultItemFirst, index === results.length - 1 && styles.resultItemLast]}
                onPress={() => (navigation as any).navigate('LogFood', { food: item, mealType, date })}>
                <Text style={styles.resultName}>
                  {item.name}
                  {item.data_type ? <Text style={styles.resultMeta}>  ·  {item.data_type}</Text> : ''}
                </Text>
                <Text style={styles.resultSub}>{item.calories != null ? Math.round(item.calories * 100) : '?'} kcal per 100g</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </>
      )}

      {mode === 'recipe' && (
        <>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => (navigation as any).navigate('CreateRecipe')}>
            <Text style={styles.actionButtonText}>+ Create Recipe</Text>
          </TouchableOpacity>
          <View style={styles.searchRow}>
            <TextInput
                keyboardAppearance="dark"
              style={styles.searchInput}
              placeholder="Search recipes..."
              placeholderTextColor={colors.textSecondary}
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
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.resultItem, index === 0 && styles.resultItemFirst, index === recipes.length - 1 && styles.resultItemLast]}
                onPress={() => (navigation as any).navigate('LogFood', { recipe: item, mealType, date })}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultSub}>{item.calories ?? '?'} kcal · {item.servings} servings</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </>
      )}

      {mode === 'mine' && (
        <>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => (navigation as any).navigate('CreateFood', { mealType, date })}>
            <Text style={styles.actionButtonText}>+ Create Custom Food</Text>
          </TouchableOpacity>
          <View style={styles.searchRow}>
            <TextInput
                keyboardAppearance="dark"
              style={styles.searchInput}
              placeholder="Search my foods..."
              placeholderTextColor={colors.textSecondary}
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
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.resultItem, index === 0 && styles.resultItemFirst, index === myFoods.length - 1 && styles.resultItemLast]}
                onPress={() => (navigation as any).navigate('LogFood', {
                  food: { ...item, is_local: true, data_type: null, external_id: null, source: 'user' },
                  mealType, date,
                })}>
                <Text style={styles.resultName}>
                  {item.name}
                  {!item.is_public && <Text style={styles.resultMeta}>  · private</Text>}
                </Text>
                <Text style={styles.resultSub}>{item.calories != null ? Math.round(item.calories * 100) : '?'} kcal per 100g</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </>
      )}
      <KeyboardDismissButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },

  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  toggleOption: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  toggleActive: { backgroundColor: colors.blue },
  toggleText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  toggleTextActive: { color: 'white' },

  actionButton: {
    backgroundColor: 'rgba(0,122,255,0.12)',
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.25)',
  },
  actionButtonText: { fontSize: 15, fontWeight: '600', color: colors.blue },

  searchRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
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

  resultItem: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: colors.card },
  resultItemFirst: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  resultItemLast: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  separator: { height: 1, backgroundColor: colors.divider, marginLeft: 16 },
  resultName: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  resultMeta: { fontSize: 13, fontWeight: '400', color: colors.textSecondary },
  resultSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
