import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../services/api';
import { cmToFtIn, ftInToCm } from '../utils/units';
import { colors, globalStyles } from '../theme';
import KeyboardDismissButton from '../components/KeyboardDismissButton';

type UserProfile = {
  id: number;
  username: string;
  email: string;
  height_cm: number | null;
  weight_unit: string;
  volume_unit: string;
  height_unit: string;
};

function UnitToggle<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.toggle}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[styles.toggleOption, value === opt && styles.toggleActive]}
          onPress={() => onChange(opt)}>
          <Text style={[styles.toggleText, value === opt && styles.toggleTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ProfileScreen() {
  const { token, refreshToken, setTokens } = useAuth();
  const { weightUnit, volumeUnit, heightUnit, reload: reloadPrefs } = usePreferences();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [selectedWeight, setSelectedWeight] = useState<'kg' | 'lbs'>(weightUnit);
  const [selectedVolume, setSelectedVolume] = useState<'ml' | 'oz'>(volumeUnit);
  const [selectedHeight, setSelectedHeight] = useState<'cm' | 'ft_in'>(heightUnit);
  const [saved, setSaved] = useState({ weight: weightUnit, volume: volumeUnit, height: heightUnit, feet: '', inches: '', cm: '' });

  useEffect(() => { loadProfile(); }, []);
  useEffect(() => {
    setSelectedWeight(weightUnit);
    setSelectedVolume(volumeUnit);
    setSelectedHeight(heightUnit);
  }, [weightUnit, volumeUnit, heightUnit]);

  async function loadProfile() {
    try {
      const data = await apiFetch('/users/me', token);
      setProfile(data);
      let feet = '', inches = '', cm = '';
      if (data.height_cm != null) {
        if (data.height_unit === 'ft_in') {
          const ftIn = cmToFtIn(data.height_cm);
          feet = ftIn.feet.toString();
          inches = ftIn.inches.toString();
        } else {
          cm = Math.round(data.height_cm).toString();
        }
      }
      setHeightFeet(feet);
      setHeightInches(inches);
      setHeightCm(cm);
      setSaved({ weight: data.weight_unit, volume: data.volume_unit, height: data.height_unit, feet, inches, cm });
    } catch (e) {
      Alert.alert('Error', 'Could not load profile');
    }
  }

  async function handleSave() {
    try {
      let height_cm: number | null = null;
      if (selectedHeight === 'ft_in') {
        const f = parseFloat(heightFeet) || 0;
        const i = parseFloat(heightInches) || 0;
        if (f > 0 || i > 0) height_cm = ftInToCm(f, i);
      } else {
        height_cm = parseFloat(heightCm) || null;
      }
      await apiFetch('/users/me', token, {
        method: 'PATCH',
        body: JSON.stringify({ height_cm, weight_unit: selectedWeight, volume_unit: selectedVolume, height_unit: selectedHeight }),
      });
      reloadPrefs();
      setSaved({ weight: selectedWeight, volume: selectedVolume, height: selectedHeight, feet: heightFeet, inches: heightInches, cm: heightCm });
      Alert.alert('Saved', 'Preferences updated');
    } catch (e) {
      Alert.alert('Error', 'Could not save preferences');
    }
  }

  async function handleLogout() {
    try {
      await apiFetch('/users/logout', token, { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) });
    } finally {
      setTokens(null, null);
    }
  }

  const isDirty =
    selectedWeight !== saved.weight || selectedVolume !== saved.volume ||
    selectedHeight !== saved.height || heightFeet !== saved.feet ||
    heightInches !== saved.inches || heightCm !== saved.cm;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.screenTitle}>Profile</Text>

        {profile && (
          <View style={[globalStyles.card, { marginBottom: 24 }]}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Username</Text>
              <Text style={styles.profileValue}>{profile.username}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Email</Text>
              <Text style={styles.profileValue}>{profile.email}</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionLabel}>Units</Text>
        <View style={globalStyles.card}>
          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>Weight</Text>
            <UnitToggle options={['kg', 'lbs'] as const} value={selectedWeight} onChange={setSelectedWeight} />
          </View>
          <View style={styles.divider} />
          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>Volume</Text>
            <UnitToggle options={['ml', 'oz'] as const} value={selectedVolume} onChange={setSelectedVolume} />
          </View>
          <View style={styles.divider} />
          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>Height</Text>
            <UnitToggle options={['cm', 'ft_in'] as const} value={selectedHeight} onChange={setSelectedHeight} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Body</Text>
        <View style={globalStyles.card}>
          {selectedHeight === 'ft_in' ? (
            <View style={styles.heightRow}>
              <TextInput
                keyboardAppearance="dark"
                style={[styles.cardInput, styles.flex1, styles.borderRight]}
                placeholder="Feet"
                placeholderTextColor={colors.textSecondary}
                value={heightFeet}
                onChangeText={setHeightFeet}
                keyboardType="decimal-pad"
              />
              <TextInput
                keyboardAppearance="dark"
                style={[styles.cardInput, styles.flex1]}
                placeholder="Inches"
                placeholderTextColor={colors.textSecondary}
                value={heightInches}
                onChangeText={setHeightInches}
                keyboardType="decimal-pad"
              />
            </View>
          ) : (
            <TextInput
                keyboardAppearance="dark"
              style={styles.cardInput}
              placeholder="Height (cm)"
              placeholderTextColor={colors.textSecondary}
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="decimal-pad"
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, !isDirty && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isDirty}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
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

  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  profileLabel: { fontSize: 13, color: colors.textSecondary },
  profileValue: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },

  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 24, marginBottom: 10 },

  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  prefLabel: { fontSize: 15, color: colors.textPrimary },
  toggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 2 },
  toggleOption: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6 },
  toggleActive: { backgroundColor: colors.blue },
  toggleText: { fontWeight: '600', color: colors.textSecondary, fontSize: 14 },
  toggleTextActive: { color: 'white' },

  heightRow: { flexDirection: 'row' },
  cardInput: { paddingHorizontal: 16, paddingVertical: 13, color: colors.textPrimary, fontSize: 15 },
  flex1: { flex: 1 },
  borderRight: { borderRightWidth: 1, borderRightColor: colors.divider },

  saveBtn: { backgroundColor: colors.success, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 24, marginBottom: 12 },
  saveBtnDisabled: { backgroundColor: 'rgba(52,199,89,0.3)' },
  saveBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },

  logoutBtn: { backgroundColor: 'rgba(255,59,48,0.12)', borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)' },
  logoutBtnText: { color: colors.destructive, fontWeight: '600', fontSize: 16 },
});
