import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../services/api';
import { kgToLbs } from '../utils/units';

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

function groupByExercise(sets: WorkoutSet[]): { exercise: string; sets: WorkoutSet[] }[] {
  const map = new Map<string, WorkoutSet[]>();
  for (const s of sets) {
    if (!map.has(s.exercise_name)) map.set(s.exercise_name, []);
    map.get(s.exercise_name)!.push(s);
  }
  return Array.from(map.entries()).map(([exercise, sets]) => ({ exercise, sets }));
}

function formatSet(s: WorkoutSet, weightUnit: 'kg' | 'lbs'): string {
  const parts: string[] = [];
  if (s.reps != null) parts.push(`${s.reps} reps`);
  if (s.weight != null) {
    const display = weightUnit === 'lbs' ? Math.round(kgToLbs(s.weight) * 10) / 10 : s.weight;
    parts.push(`${display} ${weightUnit}`);
  }
  if (s.duration_seconds != null) {
    const m = Math.floor(s.duration_seconds / 60);
    const sec = s.duration_seconds % 60;
    parts.push(m > 0 ? `${m}m ${sec}s` : `${sec}s`);
  }
  if (s.distance_km != null) parts.push(`${s.distance_km} km`);
  return parts.join(' · ') || '—';
}

export default function WorkoutDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useAuth();
  const { weightUnit } = usePreferences();
  const workout = (route.params as { workout: Workout }).workout;
  const groups = groupByExercise(workout.sets);

  function handleDelete() {
    Alert.alert('Delete Workout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await apiFetch(`/workouts/${workout.id}`, token, { method: 'DELETE' });
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', 'Could not delete workout');
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{workout.name ?? 'Workout'}</Text>
      <Text style={styles.date}>{workout.date}</Text>
      {workout.notes ? <Text style={styles.notes}>{workout.notes}</Text> : null}

      <FlatList
        data={groups}
        keyExtractor={item => item.exercise}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.exerciseBlock}>
            <Text style={styles.exerciseName}>{item.exercise}</Text>
            <Text style={styles.muscle}>{item.sets[0].primary_muscle}</Text>
            {item.sets.map(s => (
              <View key={s.id} style={styles.setRow}>
                <Text style={styles.setNumber}>Set {s.set_number}</Text>
                <Text style={styles.setDetail}>{formatSet(s, weightUnit)}</Text>
              </View>
            ))}
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Workout</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  name: { fontSize: 22, fontWeight: 'bold' },
  date: { color: '#666', marginTop: 4, marginBottom: 4 },
  notes: { color: '#555', fontStyle: 'italic', marginBottom: 12 },
  list: { marginTop: 12 },
  exerciseBlock: { backgroundColor: '#f0f0f0', borderRadius: 10, padding: 14, marginBottom: 12 },
  exerciseName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  muscle: { fontSize: 12, color: '#888', marginBottom: 10 },
  setRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  setNumber: { fontSize: 14, color: '#555' },
  setDetail: { fontSize: 14, fontWeight: '500' },
  deleteButton: { marginTop: 8, marginBottom: 24, padding: 14, borderRadius: 8, backgroundColor: '#FF3B30', alignItems: 'center' },
  deleteButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
