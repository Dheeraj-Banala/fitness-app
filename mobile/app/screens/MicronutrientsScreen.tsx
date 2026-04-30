import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

const RDAS: { key: string; label: string; rda: number; unit: string }[] = [
  { key: 'sodium',     label: 'Sodium',      rda: 2300, unit: 'mg' },
  { key: 'potassium',  label: 'Potassium',   rda: 4700, unit: 'mg' },
  { key: 'calcium',    label: 'Calcium',     rda: 1300, unit: 'mg' },
  { key: 'magnesium',  label: 'Magnesium',   rda: 420,  unit: 'mg' },
  { key: 'iron',       label: 'Iron',        rda: 18,   unit: 'mg' },
  { key: 'zinc',       label: 'Zinc',        rda: 11,   unit: 'mg' },
  { key: 'vitamin_d',  label: 'Vitamin D',   rda: 20,   unit: 'mcg' },
  { key: 'vitamin_c',  label: 'Vitamin C',   rda: 90,   unit: 'mg' },
  { key: 'vitamin_a',  label: 'Vitamin A',   rda: 900,  unit: 'mcg' },
  { key: 'vitamin_b12',label: 'Vitamin B12', rda: 2.4,  unit: 'mcg' },
  { key: 'folate',     label: 'Folate',      rda: 400,  unit: 'mcg' },
];

export default function MicronutrientsScreen() {
  const route = useRoute();
  const { micros, date } = route.params as { micros: Record<string, number>; date: string };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.date}>{date}</Text>
      {RDAS.map(({ key, label, rda, unit }) => {
        const value = micros[key] ?? 0;
        const pct = Math.min(value / rda, 1);
        return (
          <View key={key} style={styles.row}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value} / {rda} {unit}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct * 100}%` }]} />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  date: { fontSize: 14, color: '#888', marginBottom: 16, textAlign: 'center' },
  row: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '500', color: '#333' },
  value: { fontSize: 13, color: '#666' },
  track: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4 },
  fill: { height: 8, borderRadius: 4, backgroundColor: '#32ADE6' },
});
