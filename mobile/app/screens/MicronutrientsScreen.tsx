import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { colors, globalStyles } from '../theme';

const RDAS: { key: string; label: string; rda: number; unit: string }[] = [
  { key: 'sodium',      label: 'Sodium',      rda: 2300, unit: 'mg' },
  { key: 'potassium',   label: 'Potassium',   rda: 4700, unit: 'mg' },
  { key: 'calcium',     label: 'Calcium',     rda: 1300, unit: 'mg' },
  { key: 'magnesium',   label: 'Magnesium',   rda: 420,  unit: 'mg' },
  { key: 'iron',        label: 'Iron',        rda: 18,   unit: 'mg' },
  { key: 'zinc',        label: 'Zinc',        rda: 11,   unit: 'mg' },
  { key: 'vitamin_d',   label: 'Vitamin D',   rda: 20,   unit: 'mcg' },
  { key: 'vitamin_c',   label: 'Vitamin C',   rda: 90,   unit: 'mg' },
  { key: 'vitamin_a',   label: 'Vitamin A',   rda: 900,  unit: 'mcg' },
  { key: 'vitamin_b12', label: 'Vitamin B12', rda: 2.4,  unit: 'mcg' },
  { key: 'folate',      label: 'Folate',      rda: 400,  unit: 'mcg' },
];

function barColor(pct: number): string {
  return pct >= 1 ? colors.success : colors.warning;
}

export default function MicronutrientsScreen() {
  const route = useRoute();
  const { micros } = route.params as { micros: Record<string, number>; date: string };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={globalStyles.card}>
        {RDAS.map(({ key, label, rda, unit }, index) => {
          const value = micros[key] ?? 0;
          const pct = Math.min(value / rda, 1);
          return (
            <View key={key}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{label}</Text>
                  <Text style={styles.value}>{value} / {rda} {unit}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: barColor(pct) }]} />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },

  row: { paddingHorizontal: 16, paddingVertical: 12 },
  divider: { height: 1, backgroundColor: colors.divider, marginHorizontal: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  value: { fontSize: 13, color: colors.textSecondary },
  track: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 },
  fill: { height: 6, borderRadius: 3 },
});
