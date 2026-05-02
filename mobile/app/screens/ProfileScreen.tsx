import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../services/api';
import { cmToFtIn, ftInToCm } from '../utils/units';

type UserProfile = {
  id: number;
  username: string;
  email: string;
  height_cm: number | null;
  weight_unit: string;
  volume_unit: string;
  height_unit: string;
};

export default function ProfileScreen() {
  const { token, refreshToken, setTokens } = useAuth();
  const { weightUnit, volumeUnit, heightUnit, reload: reloadPrefs } = usePreferences();
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
        body: JSON.stringify({
          height_cm,
          weight_unit: selectedWeight,
          volume_unit: selectedVolume,
          height_unit: selectedHeight,
        }),
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
      await apiFetch('/users/logout', token, {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } finally {
      setTokens(null, null);
    }
  }

  const isDirty =
    selectedWeight !== saved.weight ||
    selectedVolume !== saved.volume ||
    selectedHeight !== saved.height ||
    heightFeet !== saved.feet ||
    heightInches !== saved.inches ||
    heightCm !== saved.cm;

  function UnitToggle<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
    return (
      <View style={styles.toggle}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.toggleOption, value === opt && styles.toggleActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[styles.toggleText, value === opt && styles.toggleTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Profile</Text>

      {profile && (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>Username</Text>
            <Text style={styles.value}>{profile.username}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{profile.email}</Text>
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Units</Text>

      <View style={styles.prefRow}>
        <Text style={styles.prefLabel}>Weight</Text>
        <UnitToggle options={['kg', 'lbs'] as const} value={selectedWeight} onChange={setSelectedWeight} />
      </View>
      <View style={styles.prefRow}>
        <Text style={styles.prefLabel}>Volume</Text>
        <UnitToggle options={['ml', 'oz'] as const} value={selectedVolume} onChange={setSelectedVolume} />
      </View>
      <View style={styles.prefRow}>
        <Text style={styles.prefLabel}>Height</Text>
        <UnitToggle options={['cm', 'ft_in'] as const} value={selectedHeight} onChange={setSelectedHeight} />
      </View>

      <Text style={styles.sectionTitle}>Body</Text>

      {selectedHeight === 'ft_in' ? (
        <View style={styles.heightRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Feet"
            value={heightFeet}
            onChangeText={setHeightFeet}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Inches"
            value={heightInches}
            onChangeText={setHeightInches}
            keyboardType="decimal-pad"
          />
        </View>
      ) : (
        <TextInput
          style={styles.input}
          placeholder="Height (cm)"
          value={heightCm}
          onChangeText={setHeightCm}
          keyboardType="decimal-pad"
        />
      )}

      <TouchableOpacity
        style={[styles.saveButton, !isDirty && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!isDirty}
      >
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  label: { fontSize: 12, color: '#999', marginBottom: 4 },
  value: { fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 12 },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  prefLabel: { fontSize: 15, color: '#333' },
  toggle: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8 },
  toggleOption: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  toggleActive: { backgroundColor: '#007AFF' },
  toggleText: { fontWeight: '600', color: '#666', fontSize: 14 },
  toggleTextActive: { color: 'white' },
  heightRow: { flexDirection: 'row', gap: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 15 },
  saveButton: { backgroundColor: '#34C759', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 12 },
  saveButtonDisabled: { backgroundColor: '#ccc' },
  saveText: { color: 'white', fontWeight: '600', fontSize: 16 },
  logoutButton: { backgroundColor: '#FF3B30', padding: 14, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
