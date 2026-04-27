import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

type FoodResult = {
  name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  source: string;
  external_id: string | null;
  serving_size: number;
  serving_unit: string;
  data_type: string | null;
};

export default function AddFoodScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { mealType, date } = route.params as { mealType: string; date: string };

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodResult[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodResult | null>(null);
  const [quantity, setQuantity] = useState('');

    async function handleSearch() {
    if (!query) return;
    try {
      const data = await apiFetch(`/foods/search/external?query=${encodeURIComponent(query)}`, token);
      setResults(data);
    } catch (e) {
      Alert.alert('Error', 'Could not search foods');
    }
  }

  async function handleLog(food: FoodResult) {
    setSelectedFood(food);
  }

  async function handleConfirmLog() {
    if (!selectedFood || !quantity) return;
    try {
      let foodId: number | null = null;

      if (selectedFood.source === 'usda' || selectedFood.source === 'open_food_facts') {
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

      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not log food');
    }
  }

    return (
    <View style={styles.container}>
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

      {selectedFood ? (
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
                <Text style={styles.macroCalories}>{Math.round((selectedFood.calories ?? 0) * scale)} kcal</Text>
                <View style={styles.macroRow}>
                  <Text style={styles.macroItem}>P: {Math.round((selectedFood.protein ?? 0) * scale)}g</Text>
                  <Text style={styles.macroItem}>C: {Math.round((selectedFood.carbs ?? 0) * scale)}g</Text>
                  <Text style={styles.macroItem}>F: {Math.round((selectedFood.fat ?? 0) * scale)}g</Text>
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
        <FlatList
          data={results}
          keyExtractor={(item, index) => index.toString()}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
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
});