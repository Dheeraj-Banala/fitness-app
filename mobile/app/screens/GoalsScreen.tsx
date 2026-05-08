import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Keyboard, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../services/api';
import { mlToOz, ozToMl } from '../utils/units';
import { colors, globalStyles } from '../theme';
import KeyboardDismissButton from '../components/KeyboardDismissButton';

export default function GoalsScreen() {
  const { token } = useAuth();
  const { volumeUnit } = usePreferences();
  const insets = useSafeAreaInsets();
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [water, setWater] = useState('');
  const [goalsExist, setGoalsExist] = useState(false);

  useEffect(() => { loadGoals(); }, [volumeUnit]);

  async function loadGoals() {
    try {
      const data = await apiFetch('/goals/', token);
      setCalories(data.calories?.toString() ?? '');
      setProtein(data.protein_g?.toString() ?? '');
      setCarbs(data.carbs_g?.toString() ?? '');
      setFat(data.fat_g?.toString() ?? '');
      setWater(data.water_ml != null ? (volumeUnit === 'oz' ? mlToOz(data.water_ml) : data.water_ml).toString() : '');
      setGoalsExist(true);
    } catch (e) {}
  }

  async function handleSave() {
    Keyboard.dismiss();
    try {
      await apiFetch('/goals/', token, {
        method: goalsExist ? 'PUT' : 'POST',
        body: JSON.stringify({
          calories: parseFloat(calories) || null,
          protein_g: parseFloat(protein) || null,
          carbs_g: parseFloat(carbs) || null,
          fat_g: parseFloat(fat) || null,
          water_ml: water ? (volumeUnit === 'oz' ? ozToMl(parseFloat(water)) : parseFloat(water)) : null,
        }),
      });
      loadGoals();
      setGoalsExist(true);
    } catch (e) {
      Alert.alert('Error', 'Could not save goals');
    }
  }

  const fields = [
    { label: 'Calories', unit: 'kcal', value: calories, setter: setCalories },
    { label: 'Protein',  unit: 'g',    value: protein,  setter: setProtein },
    { label: 'Carbs',    unit: 'g',    value: carbs,    setter: setCarbs },
    { label: 'Fat',      unit: 'g',    value: fat,      setter: setFat },
    { label: 'Water',    unit: volumeUnit, value: water, setter: setWater },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.screenTitle}>Goals</Text>

        <View style={globalStyles.card}>
          {fields.map(({ label, unit, value, setter }, index) => (
            <View key={label}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                keyboardAppearance="dark"
                    style={styles.fieldInput}
                    value={value}
                    onChangeText={setter}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={styles.fieldUnit}>{unit}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Goals</Text>
        </TouchableOpacity>
      </ScrollView>
      <KeyboardDismissButton />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenTitle: { fontSize: 34, fontWeight: '700', color: colors.textPrimary, marginBottom: 24 },

  divider: { height: 1, backgroundColor: colors.divider, marginHorizontal: 16 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  fieldLabel: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  inputWithUnit: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldUnit: { fontSize: 13, color: colors.textSecondary },
  fieldInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    padding: 8,
    fontSize: 15,
    width: 100,
    textAlign: 'right',
    color: colors.textPrimary,
  },

  saveBtn: { backgroundColor: colors.blue, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
