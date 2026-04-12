import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, Keyboard } from 'react-native';
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";

type Goals = {
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  water_ml: number | null;
}

export default function GoalsScreen() {
  const { token } = useAuth();
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [water, setWater] = useState('');
  const [goalsExist, setGoalsExist] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    try {
      const data = await apiFetch('/goals/', token);
      setCalories(data.calories?.toString() ?? '')
      setProtein(data.protein_g?.toString() ?? '')
      setCarbs(data.carbs_g?.toString() ?? '')
      setFat(data.fat_g?.toString() ?? '')
      setWater(data.water_ml?.toString() ?? '')
      setGoalsExist(true)
    } catch (e) {
      // 404 means no goals set yet, which is fine
    }
  }

  async function handleSave() {
    Keyboard.dismiss();
    let method = 'PUT';
    if (!goalsExist) {
      method = 'POST';
    }
    try {
      await apiFetch('/goals/', token, {
        method: method,
        body: JSON.stringify({
          calories: parseFloat(calories) || null,
          protein_g: parseFloat(protein) || null,
          carbs_g: parseFloat(carbs) || null,
          fat_g: parseFloat(fat) || null,
          water_ml: parseFloat(water) || null,
        }),
      });
      loadGoals();
      setGoalsExist(true);
    } catch (e) {
      Alert.alert('Error', 'Could not save goals');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Goals</Text>
      <TextInput
        style={styles.input}
        placeholder="Calories"
        value={calories}
        onChangeText={setCalories}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Protein"
        value={protein}
        onChangeText={setProtein}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Carbohydrates"
        value={carbs}
        onChangeText={setCarbs}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Fat"
        value={fat}
        onChangeText={setFat}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Water (ml)"
        value={water}
        onChangeText={setWater}
        keyboardType="decimal-pad"
      />
      <Button title="Save" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
});