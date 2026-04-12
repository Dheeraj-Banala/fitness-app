import React, { useState } from 'react';
import { View, ScrollView, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

type WorkoutSetInput = {
  exercise_name: string;
  set_number: number;
  primary_muscle: string;
  reps: number | null;
  weight: number | null;
  duration_seconds: number | null;
  distance_km: number | null;
};

export default function CreateWorkoutScreen() {
    const { token } = useAuth();
    const navigation = useNavigation();

    const [name, setName] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [sets, setSets] = useState<WorkoutSetInput[]>([]);

    // for the current set being built
    const [exerciseName, setExerciseName] = useState('');
    const [muscle, setMuscle] = useState('');
    const [setNumber, setSetNumber] = useState('');
    const [reps, setReps] = useState('');
    const [weight, setWeight] = useState('');

    function handleAddSet() {
        if (!exerciseName || !muscle || !setNumber) return;
        setSets([...sets, {
            exercise_name: exerciseName,
            set_number: parseInt(setNumber),
            primary_muscle: muscle,
            reps: reps ? parseInt(reps) : null,
            weight: weight ? parseFloat(weight) : null,
            duration_seconds: null,
            distance_km: null,
        }]);
        setExerciseName('');
        setMuscle('');
        setSetNumber('');
        setReps('');
        setWeight('');
    }

    async function handleSubmit() {
        if (sets.length === 0) return;
        try {
            await apiFetch('/workouts/', token, {
                method: 'POST',
                body: JSON.stringify({
                    name: name || null,
                    notes: notes || null,
                    date,
                    sets,
                }),
            });
            navigation.goBack();
        }   catch (e) {
            Alert.alert('Error', 'Could not save workout');
        }
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>New Workout</Text>

            <TextInput
                style={styles.input}
                placeholder="Workout Name (optional)"
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={styles.input}
                placeholder="Date (YYYY-MM-DD)"
                value={date}
                onChangeText={setDate}
            />
            <TextInput
                style={styles.input}
                placeholder="Notes (optional)"
                value={notes}
                onChangeText={setNotes}
            />

            <Text style={styles.sectionTitle}>Add Set</Text>
        
            <TextInput
                style={styles.input}
                placeholder="Exercise Name"
                value={exerciseName}
                onChangeText={setExerciseName}
            />
            <TextInput
                style={styles.input}
                placeholder="Muscle Group"
                value={muscle}
                onChangeText={setMuscle}
            />
            <TextInput
                style={styles.input}
                placeholder="Set Number"
                value={setNumber}
                onChangeText={setSetNumber}
                keyboardType="number-pad"
            />
            <TextInput
                style={styles.input}
                placeholder="Reps (optional)"
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
            />
            <TextInput
                style={styles.input}
                placeholder="Weight kg (optional)"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddSet}>
                <Text style={styles.addButtonText}>+ Add Set</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Sets ({sets.length})</Text>
            {sets.map((set, index) => (
                <View key={index} style={styles.setItem}>
                    <Text style={styles.setExercise}>{set.exercise_name} — Set {set.set_number}</Text>
                    <Text style={styles.setDetail}>{set.primary_muscle}</Text>
                    {set.reps && <Text style={styles.setDetail}>{set.reps} reps</Text>}
                    {set.weight && <Text style={styles.setDetail}>{set.weight} kg</Text>}
                </View>
            ))}

            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                <Text style={styles.saveButtonText}>Save Workout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
    addButton: { backgroundColor: '#34C759', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
    addButtonText: { color: 'white', fontWeight: '600' },
    setItem: { padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 8 },
    setExercise: { fontWeight: '600' },
    setDetail: { color: '#666', marginTop: 2 },
    saveButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 16, marginBottom: 32 },
    saveButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
