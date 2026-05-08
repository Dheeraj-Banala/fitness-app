import React, { useState } from 'react';
import { View, ScrollView, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../services/api';
import { lbsToKg } from '../utils/units';
import { colors, globalStyles } from '../theme';
import KeyboardDismissButton from '../components/KeyboardDismissButton';

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
    setBlocks(prev => prev.map((b, i) =>
      i === blockIndex ? { ...b, sets: [...b.sets, { reps: '', weight: '' }] } : b
    ));
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
    setBlocks(prev => prev.map((b, bi) =>
      bi !== blockIndex ? b : {
        ...b,
        sets: b.sets.map((s, si) => si !== setIndex ? s : { ...s, [field]: value }),
      }
    ));
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
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={globalStyles.card}>
          <TextInput
                keyboardAppearance="dark" style={styles.cardInput} placeholder="Workout Name (optional)" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} />
          <View style={styles.divider} />
          <TextInput
                keyboardAppearance="dark" style={styles.cardInput} placeholder="Date (YYYY-MM-DD)" placeholderTextColor={colors.textSecondary} value={date} onChangeText={setDate} />
          <View style={styles.divider} />
          <TextInput
                keyboardAppearance="dark" style={styles.cardInput} placeholder="Notes (optional)" placeholderTextColor={colors.textSecondary} value={notes} onChangeText={setNotes} />
        </View>

        {blocks.map((block, bi) => (
          <View key={bi} style={[globalStyles.card, styles.exerciseCard]}>
            <View style={styles.exerciseHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{block.exercise_name}</Text>
                <Text style={styles.exerciseMuscle}>{block.primary_muscle}</Text>
              </View>
              <TouchableOpacity
                style={styles.historyBtn}
                onPress={() => (navigation as any).navigate('ExerciseHistory', { exerciseName: block.exercise_name })}>
                <Text style={styles.historyBtnText}>History</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setBlocks(blocks.filter((_, i) => i !== bi))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.removeBlock}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.setHeaderRow}>
              <Text style={styles.setHeaderLabel}>SET</Text>
              <Text style={styles.setHeaderLabel}>REPS</Text>
              <Text style={styles.setHeaderLabel}>{weightUnit.toUpperCase()}</Text>
              <View style={{ width: 24 }} />
            </View>

            {block.sets.map((s, si) => (
              <View key={si} style={styles.setRow}>
                <Text style={styles.setNumber}>{si + 1}</Text>
                <TextInput
                keyboardAppearance="dark"
                  style={styles.setInput}
                  placeholder="—"
                  placeholderTextColor={colors.textSecondary}
                  value={s.reps}
                  onChangeText={v => updateSet(bi, si, 'reps', v)}
                  keyboardType="number-pad"
                />
                <TextInput
                keyboardAppearance="dark"
                  style={styles.setInput}
                  placeholder="—"
                  placeholderTextColor={colors.textSecondary}
                  value={s.weight}
                  onChangeText={v => updateSet(bi, si, 'weight', v)}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity onPress={() => removeSet(bi, si)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.removeSet}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(bi)}>
              <Text style={styles.addSetText}>+ Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.sectionLabel}>Add Exercise</Text>

        <View style={styles.searchRow}>
          <TextInput
                keyboardAppearance="dark"
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {searchResults.length > 0 && (
          <View style={[globalStyles.card, { marginBottom: 12 }]}>
            {searchResults.map((ex, index) => (
              <View key={ex.id}>
                {index > 0 && <View style={styles.divider} />}
                <TouchableOpacity style={styles.resultItem} onPress={() => addExerciseBlock(ex)}>
                  <Text style={styles.resultName}>{ex.name}</Text>
                  <Text style={styles.resultMuscle}>{ex.primary_muscle}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {searchQuery.trim().length > 0 && (
          <TouchableOpacity style={styles.createCustomBtn} onPress={() => setShowCustomForm(v => !v)}>
            <Text style={styles.createCustomText}>+ Create "{searchQuery.trim()}" as custom exercise</Text>
          </TouchableOpacity>
        )}

        {showCustomForm && (
          <View style={[globalStyles.card, styles.customForm]}>
            <TextInput
                keyboardAppearance="dark"
              style={styles.cardInput}
              placeholder="Muscle group (e.g. Chest)"
              placeholderTextColor={colors.textSecondary}
              value={customMuscle}
              onChangeText={setCustomMuscle}
            />
            <TouchableOpacity style={styles.createBtn} onPress={handleCreateCustom}>
              <Text style={styles.createBtnText}>Create & Add</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
          <Text style={styles.saveBtnText}>Save Workout</Text>
        </TouchableOpacity>

      </ScrollView>
      <KeyboardDismissButton />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },

  cardInput: { paddingHorizontal: 16, paddingVertical: 13, color: colors.textPrimary, fontSize: 15 },
  divider: { height: 1, backgroundColor: colors.divider },

  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 24, marginBottom: 10 },

  exerciseCard: { marginTop: 16, overflow: 'hidden', padding: 0 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  exerciseMuscle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  historyBtn: { backgroundColor: 'rgba(0,122,255,0.15)', borderRadius: 6, paddingVertical: 5, paddingHorizontal: 10, marginRight: 10, borderWidth: 1, borderColor: colors.cardBorder },
  historyBtnText: { color: colors.blue, fontSize: 12, fontWeight: '600' },
  removeBlock: { fontSize: 16, color: colors.destructive },

  setHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6 },
  setHeaderLabel: { flex: 1, fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.8, textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
  setNumber: { flex: 1, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  setInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    padding: 8,
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 15,
  },
  removeSet: { color: colors.destructive, fontSize: 13, width: 24, textAlign: 'center' },
  addSetBtn: { alignItems: 'center', paddingVertical: 12 },
  addSetText: { color: colors.blue, fontWeight: '600', fontSize: 14 },

  searchRow: { marginBottom: 10 },
  searchInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 15,
  },
  resultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  resultName: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  resultMuscle: { fontSize: 13, color: colors.textSecondary },

  createCustomBtn: { padding: 12, alignItems: 'center', marginBottom: 8 },
  createCustomText: { color: colors.blue, fontSize: 14, fontWeight: '500' },
  customForm: { padding: 16, marginBottom: 8, gap: 10 },
  createBtn: { backgroundColor: colors.success, borderRadius: 8, padding: 11, alignItems: 'center' },
  createBtnText: { color: 'white', fontWeight: '600' },

  saveBtn: { backgroundColor: colors.blue, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
