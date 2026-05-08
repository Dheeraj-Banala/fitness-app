import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
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

function uniqueExercises(sets: WorkoutSet[]): string[] {
  return [...new Set(sets.map(s => s.exercise_name))];
}

export default function WorkoutsScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [])
  );

  async function loadWorkouts() {
    try {
      const data = await apiFetch('/workouts/', token);
      setWorkouts([...data].reverse());
    } catch (e) {
      Alert.alert('Error', 'Could not load workouts');
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={workouts}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <>
            <Text style={styles.screenTitle}>Workouts</Text>
            <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('CreateWorkout' as never)}>
              <Text style={styles.newBtnText}>+ New Workout</Text>
            </TouchableOpacity>
          </>
        }
        renderItem={({ item }) => {
          const exercises = uniqueExercises(item.sets);
          return (
            <TouchableOpacity
              style={[globalStyles.card, styles.workoutCard]}
              onPress={() => (navigation as any).navigate('WorkoutDetail', { workout: item })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.workoutName}>{item.name ?? 'Workout'}</Text>
                <Text style={styles.workoutDate}>{item.date}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.cardBody}>
                <Text style={styles.exerciseList} numberOfLines={2}>
                  {exercises.join('  ·  ')}
                </Text>
                <Text style={styles.setCount}>{item.sets.length} sets</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  screenTitle: { fontSize: 34, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  newBtn: {
    backgroundColor: colors.blue,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  newBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },

  workoutCard: { padding: 0, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  workoutName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  workoutDate: { fontSize: 13, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.divider },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  exerciseList: { flex: 1, fontSize: 13, color: colors.textSecondary, marginRight: 12 },
  setCount: { fontSize: 13, color: colors.blue, fontWeight: '600' },
});
