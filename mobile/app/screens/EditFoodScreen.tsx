import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { colors, globalStyles } from '../theme';
import KeyboardDismissButton from '../components/KeyboardDismissButton';

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
      await apiFetch(`/foods/${foodId}`, token, { method: 'PATCH', body: JSON.stringify(body) });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not update food');
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: colors.bg }} color={colors.blue} />;

  const macroFields = [
    { label: 'Calories (kcal)', value: calories, setter: setCalories },
    { label: 'Protein (g)',     value: protein,  setter: setProtein },
    { label: 'Carbs (g)',       value: carbs,    setter: setCarbs },
    { label: 'Fat (g)',         value: fat,      setter: setFat },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Text style={styles.sectionLabel}>Name</Text>
        <View style={globalStyles.card}>
          <TextInput
                keyboardAppearance="dark"
            style={styles.cardInput}
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <Text style={styles.sectionLabel}>Serving Size</Text>
        <View style={[globalStyles.card, styles.row]}>
          <TextInput
                keyboardAppearance="dark"
            style={[styles.cardInput, styles.flex1, styles.borderRight]}
            value={servingG}
            onChangeText={setServingG}
            placeholder="Grams"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
          />
          <TextInput
                keyboardAppearance="dark"
            style={[styles.cardInput, styles.flex1]}
            value={servingName}
            onChangeText={setServingName}
            placeholder="Name (optional)"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <Text style={styles.sectionLabel}>Macros per serving</Text>
        <View style={globalStyles.card}>
          {macroFields.map(({ label, value, setter }, index) => (
            <View key={label}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                keyboardAppearance="dark"
                  style={styles.fieldInput}
                  value={value}
                  onChangeText={setter}
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.toggleMicrosBtn} onPress={() => setShowMicros(v => !v)}>
          <Text style={styles.toggleMicrosText}>{showMicros ? 'Hide micronutrients' : 'Edit micronutrients'}</Text>
        </TouchableOpacity>

        {showMicros && (
          <View style={globalStyles.card}>
            {MICROS.map(({ key, label }, index) => (
              <View key={key}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                keyboardAppearance="dark"
                    style={styles.fieldInput}
                    value={micros[key] ?? ''}
                    onChangeText={v => setMicro(key, v)}
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={[globalStyles.card, styles.visibilityRow]} onPress={() => setIsPublic(v => !v)}>
          <View style={styles.flex1}>
            <Text style={styles.visibilityLabel}>Make public</Text>
            <Text style={styles.visibilityHint}>Public foods appear in search for all users</Text>
          </View>
          <View style={[styles.toggle, isPublic && styles.toggleOn]}>
            <View style={[styles.toggleThumb, isPublic && styles.toggleThumbOn]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

      </ScrollView>
      <KeyboardDismissButton />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },

  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20, marginBottom: 8 },

  cardInput: { paddingHorizontal: 16, paddingVertical: 13, color: colors.textPrimary, fontSize: 15 },
  row: { flexDirection: 'row', padding: 0, overflow: 'hidden' },
  flex1: { flex: 1 },
  borderRight: { borderRightWidth: 1, borderRightColor: colors.divider },

  divider: { height: 1, backgroundColor: colors.divider, marginHorizontal: 16 },

  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  fieldLabel: { fontSize: 15, color: colors.textPrimary },
  fieldInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    padding: 8,
    fontSize: 15,
    width: 90,
    textAlign: 'right',
    color: colors.textPrimary,
  },

  toggleMicrosBtn: { marginTop: 16, marginBottom: 16, padding: 13, backgroundColor: 'rgba(0,122,255,0.1)', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,122,255,0.2)' },
  toggleMicrosText: { fontSize: 14, fontWeight: '600', color: colors.blue },

  visibilityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, padding: 16 },
  visibilityLabel: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  visibilityHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', paddingHorizontal: 2 },
  toggleOn: { backgroundColor: colors.success },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'white' },
  toggleThumbOn: { alignSelf: 'flex-end' },

  saveBtn: { backgroundColor: colors.blue, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
