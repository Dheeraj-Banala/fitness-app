import React, { useState } from 'react';
import { View, ScrollView, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../services/api';
import { lbsToKg } from '../utils/units';

type ExerciseResult = {
  id: number;
  name: string;
  primary_muscle: string;
};

type SetInput = {
  reps: string;
  weight: string;
};

type ExerciseBlock = {
  exercise_name: string;
  primary_muscle: string;
  sets: SetInput[];
};

function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CreateWorkoutScreen() {
  const { token } = useAuth();
  const { weightUnit } = usePreferences();
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(toLocalDateString(new Date()));
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ExerciseResult[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customMuscle, setCustomMuscle] = useState('');

  async function handleSearch(q: string) {
    setSearchQuery(q);
    setShowCustomForm(false);
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const data = await apiFetch(`/exercises/?q=${encodeURIComponent(q)}`, token);
      setSearchResults(data);
    } catch (e) {}
  }

  function addExerciseBlock(ex: ExerciseResult) {
    if (blocks.some(b => b.exercise_name === ex.name)) {
      Alert.alert('Already added', `${ex.name} is already in this workout`);
      return;
    }
    setBlocks(prev => [...prev, { exercise_name: ex.name, primary_muscle: ex.primary_muscle, sets: [{ reps: '', weight: '' }] }]);
    setSearchQuery('');
    setSearchResults([]);
    setShowCustomForm(false);
  }

  async function handleCreateCustom() {
    if (!searchQuery.trim() || !customMuscle.trim()) return;
    try {
      const data = await apiFetch('/exercises/', token, {
        method: 'POST',
        body: JSON.stringify({ name: searchQuery.trim(), primary_muscle: customMuscle.trim() }),
      });
      addExerciseBlock(data);
      setCustomMuscle('');
    } catch (e) {
      Alert.alert('Error', 'Could not create exercise');
    }
  }

  function addSet(blockIndex: number) {
    setBlocks(prev => {
      const updated = prev.map((b, i) =>
        i === blockIndex ? { ...b, sets: [...b.sets, { reps: '', weight: '' }] } : b
      );
      return updated;
    });
  }

  function removeSet(blockIndex: number, setIndex: number) {
    setBlocks(prev => {
      const updated = [...prev];
      const newSets = updated[blockIndex].sets.filter((_, i) => i !== setIndex);
      if (newSets.length === 0) return updated.filter((_, i) => i !== blockIndex);
      updated[blockIndex] = { ...updated[blockIndex], sets: newSets };
      return updated;
    });
  }

  function updateSet(blockIndex: number, setIndex: number, field: 'reps' | 'weight', value: string) {
    setBlocks(prev => {
      const updated = prev.map((b, bi) =>
        bi !== blockIndex ? b : {
          ...b,
          sets: b.sets.map((s, si) => si !== setIndex ? s : { ...s, [field]: value }),
        }
      );
      return updated;
    });
  }

  async function handleSubmit() {
    if (blocks.length === 0) { Alert.alert('Add at least one exercise'); return; }
    const sets = blocks.flatMap((block, _bi) =>
      block.sets
        .filter(s => s.reps.trim() !== '' || s.weight.trim() !== '')
        .map((s, si) => ({
        exercise_name: block.exercise_name,
        primary_muscle: block.primary_muscle,
        set_number: si + 1,
        reps: s.reps ? parseInt(s.reps) : null,
        weight: s.weight ? (weightUnit === 'lbs' ? lbsToKg(parseFloat(s.weight)) : parseFloat(s.weight)) : null,
        duration_seconds: null,
        distance_km: null,
      }))
    );
    try {
      await apiFetch('/workouts/', token, {
        method: 'POST',
        body: JSON.stringify({ name: name || null, notes: notes || null, date, sets }),
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save workout');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>New Workout</Text>

      <TextInput style={styles.input} placeholder="Workout Name (optional)" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      <TextInput style={styles.input} placeholder="Notes (optional)" value={notes} onChangeText={setNotes} />

      {blocks.map((block, bi) => (
        <View key={bi} style={styles.block}>
          <View style={styles.blockHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.blockName}>{block.exercise_name}</Text>
              <Text style={styles.blockMuscle}>{block.primary_muscle}</Text>
            </View>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => (navigation as any).navigate('ExerciseHistory', { exerciseName: block.exercise_name })}>
              <Text style={styles.historyButtonText}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setBlocks(blocks.filter((_, i) => i !== bi))}>
              <Text style={styles.removeBlock}>✕</Text>
            </TouchableOpacity>
          </View>

          {block.sets.map((s, si) => (
            <View key={si} style={styles.setRow}>
              <Text style={styles.setLabel}>Set {si + 1}</Text>
              <TextInput
                style={styles.setInput}
                placeholder="Reps"
                value={s.reps}
                onChangeText={v => updateSet(bi, si, 'reps', v)}
                keyboardType="number-pad"
              />
              <TextInput
                style={styles.setInput}
                placeholder={weightUnit}
                value={s.weight}
                onChangeText={v => updateSet(bi, si, 'weight', v)}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity onPress={() => removeSet(bi, si)}>
                <Text style={styles.removeSet}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addSetButton} onPress={() => addSet(bi)}>
            <Text style={styles.addSetText}>+ Add Set</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.searchSection}>
        <Text style={styles.sectionTitle}>Add Exercise</Text>
        <TextInput
          style={styles.input}
          placeholder="Search exercises..."
          value={searchQuery}
          onChangeText={handleSearch}
        />

        {searchResults.map(ex => (
          <TouchableOpacity key={ex.id} style={styles.searchResult} onPress={() => addExerciseBlock(ex)}>
            <Text style={styles.resultName}>{ex.name}</Text>
            <Text style={styles.resultMuscle}>{ex.primary_muscle}</Text>
          </TouchableOpacity>
        ))}

        {searchQuery.trim().length > 0 && (
          <TouchableOpacity style={styles.customButton} onPress={() => setShowCustomForm(v => !v)}>
            <Text style={styles.customButtonText}>+ Create "{searchQuery.trim()}" as custom exercise</Text>
          </TouchableOpacity>
        )}

        {showCustomForm && (
          <View style={styles.customForm}>
            <TextInput
              style={styles.input}
              placeholder="Muscle group (e.g. Chest)"
              value={customMuscle}
              onChangeText={setCustomMuscle}
            />
            <TouchableOpacity style={styles.createButton} onPress={handleCreateCustom}>
              <Text style={styles.createButtonText}>Create & Add</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
        <Text style={styles.saveButtonText}>Save Workout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  block: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, marginBottom: 16 },
  blockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  blockName: { fontSize: 16, fontWeight: '600' },
  blockMuscle: { fontSize: 13, color: '#888', marginTop: 2 },
  removeBlock: { fontSize: 18, color: '#FF3B30', paddingLeft: 12 },
  historyButton: { backgroundColor: '#007AFF', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10, marginRight: 8 },
  historyButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  setLabel: { fontSize: 13, color: '#555', width: 42 },
  setInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 8, backgroundColor: 'white', textAlign: 'center' },
  removeSet: { color: '#FF3B30', fontSize: 14, paddingLeft: 4 },
  addSetButton: { alignItems: 'center', paddingVertical: 8, marginTop: 4 },
  addSetText: { color: '#007AFF', fontWeight: '600' },
  searchSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  searchResult: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultName: { fontSize: 15, fontWeight: '500' },
  resultMuscle: { fontSize: 13, color: '#888' },
  customButton: { paddingVertical: 10, alignItems: 'center' },
  customButtonText: { color: '#007AFF', fontSize: 14 },
  customForm: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 12, marginTop: 4 },
  createButton: { backgroundColor: '#34C759', borderRadius: 8, padding: 10, alignItems: 'center' },
  createButtonText: { color: 'white', fontWeight: '600' },
  saveButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  saveButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
