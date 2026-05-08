import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../services/api';
import { kgToLbs } from '../utils/units';
import { colors, globalStyles } from '../theme';

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
      <FlatList
        data={groups}
        keyExtractor={item => item.exercise}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.name}>{workout.name ?? 'Workout'}</Text>
            <Text style={styles.date}>{workout.date}</Text>
            {workout.notes ? <Text style={styles.notes}>{workout.notes}</Text> : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[globalStyles.card, styles.exerciseCard]}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{item.exercise}</Text>
              <Text style={styles.muscle}>{item.sets[0].primary_muscle}</Text>
            </View>
            <View style={styles.divider} />
            {item.sets.map((s, i) => (
              <View key={s.id}>
                {i > 0 && <View style={styles.setDivider} />}
                <View style={styles.setRow}>
                  <Text style={styles.setNumber}>Set {s.set_number}</Text>
                  <Text style={styles.setDetail}>{formatSet(s, weightUnit)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListFooterComponent={
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>Delete Workout</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },

  header: { marginBottom: 20 },
  name: { fontSize: 26, fontWeight: '700', color: colors.textPrimary },
  date: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  notes: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic', marginTop: 6 },

  exerciseCard: { overflow: 'hidden', padding: 0 },
  exerciseHeader: { paddingHorizontal: 16, paddingVertical: 12 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  muscle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.divider },
  setDivider: { height: 1, backgroundColor: colors.divider, marginHorizontal: 16 },
  setRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  setNumber: { fontSize: 14, color: colors.textSecondary },
  setDetail: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },

  deleteBtn: { marginTop: 8, padding: 14, borderRadius: 12, backgroundColor: 'rgba(255,59,48,0.15)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)' },
  deleteBtnText: { color: colors.destructive, fontWeight: '600', fontSize: 16 },
});
