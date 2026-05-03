import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

const MICROS = [
  { key: 'fiber',         label: 'Fiber (g)' },
  { key: 'sugar',         label: 'Sugar (g)' },
  { key: 'saturated_fat', label: 'Saturated Fat (g)' },
  { key: 'sodium',        label: 'Sodium (mg)' },
  { key: 'potassium',     label: 'Potassium (mg)' },
  { key: 'calcium',       label: 'Calcium (mg)' },
  { key: 'magnesium',     label: 'Magnesium (mg)' },
  { key: 'iron',          label: 'Iron (mg)' },
  { key: 'zinc',          label: 'Zinc (mg)' },
  { key: 'vitamin_d',     label: 'Vitamin D (mcg)' },
  { key: 'vitamin_c',     label: 'Vitamin C (mg)' },
  { key: 'vitamin_a',     label: 'Vitamin A (mcg)' },
  { key: 'vitamin_b12',   label: 'Vitamin B12 (mcg)' },
  { key: 'folate',        label: 'Folate (mcg)' },
] as const;

type MicroKey = typeof MICROS[number]['key'];

function fmt(val: number | null | undefined, sg: number): string {
  if (val == null) return '';
  return String(Math.round(val * sg * 100) / 100);
}

export default function EditFoodScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { foodId } = route.params as { foodId: number };

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [servingG, setServingG] = useState('100');
  const [servingName, setServingName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [micros, setMicros] = useState<Partial<Record<MicroKey, string>>>({});
  const [isPublic, setIsPublic] = useState(false);
  const [showMicros, setShowMicros] = useState(false);

  useEffect(() => {
    apiFetch(`/foods/${foodId}`, token)
      .then((food: any) => {
        const sg = food.default_serving_g ?? 100;
        setName(food.name);
        setServingG(String(sg));
        setServingName(food.default_serving_name ?? '');
        setCalories(fmt(food.calories, sg));
        setProtein(fmt(food.protein, sg));
        setCarbs(fmt(food.carbs, sg));
        setFat(fmt(food.fat, sg));
        setIsPublic(food.is_public ?? false);
        setMicros(Object.fromEntries(MICROS.map(({ key }) => [key, fmt(food[key], sg)])) as any);
      })
      .catch(() => Alert.alert('Error', 'Could not load food'))
      .finally(() => setLoading(false));
  }, []);

  function setMicro(key: MicroKey, value: string) {
    setMicros(prev => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (!name.trim()) return 'Name is required.';
    if (!servingG || parseFloat(servingG) <= 0) return 'Serving size must be a positive number.';
    if (!calories || parseFloat(calories) < 0) return 'Calories are required.';
    if (!protein || parseFloat(protein) < 0) return 'Protein is required.';
    if (!carbs || parseFloat(carbs) < 0) return 'Carbs are required.';
    if (!fat || parseFloat(fat) < 0) return 'Fat is required.';
    return null;
  }

  async function handleSave() {
    const error = validate();
    if (error) { Alert.alert('Missing info', error); return; }

    const newSg = parseFloat(servingG);
    const per1g = (val: string) => val ? parseFloat(val) / newSg : null;

    const body: Record<string, any> = {
      name: name.trim(),
      default_serving_g: newSg,
      default_serving_name: servingName.trim() || null,
      calories: parseFloat(calories) / newSg,
      protein: parseFloat(protein) / newSg,
      carbs: parseFloat(carbs) / newSg,
      fat: parseFloat(fat) / newSg,
      is_public: isPublic,
    };

    for (const { key } of MICROS) {
      body[key] = per1g(micros[key] ?? '');
    }

    try {
      await apiFetch(`/foods/${foodId}`, token, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not update food');
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionLabel}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.sectionLabel}>Serving size</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flex1]}
          value={servingG}
          onChangeText={setServingG}
          placeholder="Grams"
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, styles.flex1]}
          value={servingName}
          onChangeText={setServingName}
          placeholder="Name (optional, e.g. slice)"
        />
      </View>

      <Text style={styles.sectionLabel}>Macros per serving</Text>
      {[
        { label: 'Calories (kcal)', value: calories, setter: setCalories },
        { label: 'Protein (g)',     value: protein,  setter: setProtein },
        { label: 'Carbs (g)',       value: carbs,    setter: setCarbs },
        { label: 'Fat (g)',         value: fat,      setter: setFat },
      ].map(({ label, value, setter }) => (
        <View key={label} style={styles.macroRow}>
          <Text style={styles.macroLabel}>{label}</Text>
          <TextInput
            style={styles.macroInput}
            value={value}
            onChangeText={setter}
            keyboardType="decimal-pad"
          />
        </View>
      ))}

      <TouchableOpacity style={styles.toggleMicros} onPress={() => setShowMicros(v => !v)}>
        <Text style={styles.toggleMicrosText}>{showMicros ? 'Hide micronutrients' : 'Edit micronutrients'}</Text>
      </TouchableOpacity>

      {showMicros && MICROS.map(({ key, label }) => (
        <View key={key} style={styles.macroRow}>
          <Text style={styles.macroLabel}>{label}</Text>
          <TextInput
            style={styles.macroInput}
            value={micros[key] ?? ''}
            onChangeText={v => setMicro(key, v)}
            keyboardType="decimal-pad"
          />
        </View>
      ))}

      <TouchableOpacity style={styles.visibilityRow} onPress={() => setIsPublic(v => !v)}>
        <View>
          <Text style={styles.visibilityLabel}>Make public</Text>
          <Text style={styles.visibilityHint}>Public foods appear in search for all users</Text>
        </View>
        <View style={[styles.toggle, isPublic && styles.toggleOn]}>
          <View style={[styles.toggleThumb, isPublic && styles.toggleThumbOn]} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#888', textTransform: 'uppercase', marginTop: 20, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1 },
  macroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  macroLabel: { fontSize: 15, color: '#333' },
  macroInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, fontSize: 15, width: 90, textAlign: 'right' },
  toggleMicros: { marginTop: 20, marginBottom: 4, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8, alignItems: 'center' },
  toggleMicrosText: { fontSize: 14, fontWeight: '600', color: '#555' },
  visibilityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 8, padding: 14, backgroundColor: '#f5f5f5', borderRadius: 10 },
  visibilityLabel: { fontSize: 15, fontWeight: '500', color: '#333' },
  visibilityHint: { fontSize: 12, color: '#888', marginTop: 2 },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#ccc', justifyContent: 'center', paddingHorizontal: 2 },
  toggleOn: { backgroundColor: '#34C759' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'white' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  saveButton: { marginTop: 20, backgroundColor: '#007AFF', borderRadius: 8, padding: 14, alignItems: 'center' },
  saveButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
