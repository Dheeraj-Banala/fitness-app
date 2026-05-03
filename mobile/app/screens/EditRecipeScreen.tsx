import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { searchFoods, FoodSearchResult } from '../services/foodSearch';

type IngredientInput = {
  food_id: number;
  food_name: string;
  quantity: number;
  unit: string;
};

export default function EditRecipeScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { recipeId } = route.params as { recipeId: number };

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('1');
  const [ingredients, setIngredients] = useState<IngredientInput[]>([]);

  const [foodQuery, setFoodQuery] = useState('');
  const [foodResults, setFoodResults] = useState<FoodSearchResult[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    apiFetch(`/recipes/${recipeId}`, token)
      .then(async (data: any) => {
        setName(data.name);
        setDescription(data.description ?? '');
        setServings(String(data.servings));
        const ingsWithNames = await Promise.all(
          data.ingredients.map(async (ing: any) => {
            const food = await apiFetch(`/foods/${ing.food_id}`, token);
            return { food_id: ing.food_id, food_name: food.name, quantity: ing.quantity, unit: ing.unit };
          })
        );
        setIngredients(ingsWithNames);
      })
      .catch(() => Alert.alert('Error', 'Could not load recipe'))
      .finally(() => setLoading(false));
  }, []);

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
      setIngredients(prev => [...prev, {
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

  function removeIngredient(index: number) {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name || ingredients.length === 0) {
      Alert.alert('Missing info', 'Name and at least one ingredient are required.');
      return;
    }
    try {
      await apiFetch(`/recipes/${recipeId}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          description: description || null,
          servings: parseFloat(servings) || 1,
          ingredients: ingredients.map(i => ({ food_id: i.food_id, quantity: i.quantity, unit: i.unit })),
        }),
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not update recipe');
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <TextInput style={styles.input} placeholder="Recipe Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Description (optional)" value={description} onChangeText={setDescription} />
      <TextInput style={styles.input} placeholder="Servings" value={servings} onChangeText={setServings} keyboardType="decimal-pad" />

      <Text style={styles.sectionTitle}>Ingredients</Text>
      {ingredients.map((ing, index) => (
        <View key={index} style={styles.ingredientItem}>
          <View style={styles.ingredientRow}>
            <Text style={styles.ingredientName}>{ing.food_name}</Text>
            <Text style={styles.ingredientDetail}>{ing.quantity}{ing.unit}</Text>
          </View>
          <TouchableOpacity onPress={() => removeIngredient(index)}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Add Ingredient</Text>
      {selectedFood ? (
        <View style={styles.selectedFood}>
          <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
          <TextInput
            style={styles.input}
            placeholder="Quantity (g)"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddIngredient}>
            <Text style={styles.addButtonText}>+ Add to Recipe</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedFood(null)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search foods..."
              value={foodQuery}
              onChangeText={setFoodQuery}
              onSubmitEditing={handleFoodSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleFoodSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
          {foodResults.map((food, index) => (
            <TouchableOpacity key={index} style={styles.foodResult} onPress={() => setSelectedFood(food)}>
              <Text style={styles.foodResultName}>
                {food.name}
                {food.data_type ? <Text style={styles.foodResultDataType}>  ·  {food.data_type}</Text> : ''}
              </Text>
              <Text style={styles.foodResultCals}>{food.calories != null ? Math.round(food.calories * 100) : '?'} kcal per 100g</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  searchButton: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, justifyContent: 'center' },
  searchButtonText: { color: 'white', fontWeight: '600' },
  foodResult: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  foodResultName: { fontSize: 15, fontWeight: '500' },
  foodResultDataType: { color: '#999', fontWeight: '400', fontSize: 14 },
  foodResultCals: { color: '#666', marginTop: 2 },
  selectedFood: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, marginBottom: 8 },
  selectedFoodName: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  addButton: { backgroundColor: '#34C759', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  addButtonText: { color: 'white', fontWeight: '600' },
  cancelText: { color: '#FF3B30', textAlign: 'center', padding: 8 },
  ingredientItem: { padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 8 },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ingredientName: { fontWeight: '600', flex: 1 },
  ingredientDetail: { color: '#666' },
  removeText: { color: '#FF3B30', marginTop: 4, fontSize: 13 },
  saveButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 16, marginBottom: 32 },
  saveButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
