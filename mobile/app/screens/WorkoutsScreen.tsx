import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

type WorkoutSet = {
  id: number;
  exercise_name: string;
  set_number: number;
  primary_muscle: string;
  reps: number | null;
  weight: number | null;
  duration_seconds: number | null;
  distance_km: number | null;
};

type Workout = {
  id: number;
  name: string | null;
  date: string;
  notes: string | null;
  sets: WorkoutSet[];
};

export default function WorkoutsScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [])
  );

  async function loadWorkouts() {
    try {
      const data = await apiFetch('/workouts/', token);
      setWorkouts(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load workouts');
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CreateWorkout' as never)}>
        <Text style={styles.addButtonText}>+ New Workout</Text>
      </TouchableOpacity>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item}) => (
          <View style={styles.workoutItem}>
            <Text style={styles.workoutName}>{item.name ?? 'Workout'}</Text>
            <Text style={styles.workoutDate}>{item.date}</Text>
            <Text style={styles.setCount}>{item.sets.length} sets</Text>
          </View>
        )}
      />
    </View>
  );  
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  addButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, marginBottom: 16, alignItems: 'center' },
  addButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  workoutItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  workoutName: { fontSize: 18, fontWeight: '600' },
  workoutDate: { color: '#666', marginTop: 4 },
  setCount: { color: '#999', marginTop: 4 },
});