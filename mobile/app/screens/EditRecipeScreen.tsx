import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
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

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={colors.blue} />
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Text style={styles.sectionLabel}>Recipe Details</Text>
        <View style={globalStyles.card}>
          <TextInput
                keyboardAppearance="dark"
            style={[styles.cardInput, styles.borderBottom]}
            placeholder="Recipe Name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
          <TextInput
                keyboardAppearance="dark"
            style={[styles.cardInput, styles.borderBottom]}
            placeholder="Description (optional)"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
                keyboardAppearance="dark"
            style={styles.cardInput}
            placeholder="Servings"
            placeholderTextColor={colors.textSecondary}
            value={servings}
            onChangeText={setServings}
            keyboardType="decimal-pad"
          />
        </View>

        {ingredients.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Ingredients</Text>
            <View style={globalStyles.card}>
              {ingredients.map((ing, index) => (
                <View key={index}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.ingredientRow}>
                    <View style={styles.ingredientInfo}>
                      <Text style={styles.ingredientName}>{ing.food_name}</Text>
                      <Text style={styles.ingredientDetail}>{ing.quantity}{ing.unit}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeIngredient(index)} style={styles.removeBtn}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Add Ingredient</Text>
        {selectedFood ? (
          <View style={globalStyles.card}>
            <View style={[styles.cardInput, styles.borderBottom]}>
              <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
            </View>
            <TextInput
                keyboardAppearance="dark"
              style={[styles.cardInput, styles.borderBottom]}
              placeholder="Quantity (g)"
              placeholderTextColor={colors.textSecondary}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
            />
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.addIngredientBtn} onPress={handleAddIngredient}>
                <Text style={styles.addIngredientText}>+ Add to Recipe</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedFood(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.searchRow}>
              <TextInput
                keyboardAppearance="dark"
                style={[globalStyles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Search foods..."
                placeholderTextColor={colors.textSecondary}
                value={foodQuery}
                onChangeText={setFoodQuery}
                onSubmitEditing={handleFoodSearch}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleFoodSearch}>
                <Text style={styles.searchBtnText}>Search</Text>
              </TouchableOpacity>
            </View>
            {foodResults.length > 0 && (
              <View style={[globalStyles.card, { marginTop: 10 }]}>
                {foodResults.map((food, index) => (
                  <View key={index}>
                    {index > 0 && <View style={styles.divider} />}
                    <TouchableOpacity style={styles.resultItem} onPress={() => setSelectedFood(food)}>
                      <Text style={styles.resultName}>
                        {food.name}
                        {food.data_type ? <Text style={styles.resultDataType}>  ·  {food.data_type}</Text> : ''}
                      </Text>
                      <Text style={styles.resultCals}>{food.calories != null ? Math.round(food.calories * 100) : '?'} kcal per 100g</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
      <KeyboardDismissButton />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },

  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 24, marginBottom: 10 },
  divider: { height: 1, backgroundColor: colors.divider, marginHorizontal: 16 },

  cardInput: { paddingHorizontal: 16, paddingVertical: 13, color: colors.textPrimary, fontSize: 15 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: colors.divider },

  ingredientRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  ingredientInfo: { flex: 1 },
  ingredientName: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  ingredientDetail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  removeBtn: { paddingLeft: 12 },
  removeText: { fontSize: 13, color: colors.destructive },

  selectedFoodName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  addIngredientBtn: { flex: 1, backgroundColor: 'rgba(0,122,255,0.12)', borderWidth: 1, borderColor: 'rgba(0,122,255,0.25)', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  addIngredientText: { color: colors.blue, fontWeight: '600', fontSize: 14 },
  cancelBtn: { flex: 1, backgroundColor: 'rgba(255,59,48,0.08)', borderWidth: 1, borderColor: 'rgba(255,59,48,0.2)', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  cancelText: { color: colors.destructive, fontWeight: '600', fontSize: 14 },

  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchBtn: { backgroundColor: colors.blue, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16 },
  searchBtnText: { color: 'white', fontWeight: '600', fontSize: 15 },

  resultItem: { paddingHorizontal: 16, paddingVertical: 12 },
  resultName: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  resultDataType: { color: colors.textSecondary, fontWeight: '400', fontSize: 14 },
  resultCals: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  saveBtn: { backgroundColor: colors.blue, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
