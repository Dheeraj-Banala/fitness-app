import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

type Recipe = {
  id: number;
  name: string;
  description: string | null;
  servings: number;
};

export default function RecipesScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [])
  );

  async function loadRecipes() {
    try {
      const data = await apiFetch('/recipes/', token);
      setRecipes(data);
    } catch (e) {}
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => (navigation as any).navigate('CreateRecipe')}>
        <Text style={styles.addButtonText}>+ New Recipe</Text>
      </TouchableOpacity>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.recipeItem} onPress={() => (navigation as any).navigate('RecipeDetail', { recipeId: item.id })}>
            <Text style={styles.recipeName}>{item.name}</Text>
            {item.description && <Text style={styles.recipeDescription}>{item.description}</Text>}
            <Text style={styles.recipeServings}>{item.servings} serving{item.servings !== 1 ? 's' : ''}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  addButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, marginBottom: 16, alignItems: 'center' },
  addButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  recipeItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  recipeName: { fontSize: 18, fontWeight: '600' },
  recipeDescription: { color: '#666', marginTop: 4 },
  recipeServings: { color: '#999', marginTop: 4 },
});