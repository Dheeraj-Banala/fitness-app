import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../services/api';
import { kgToLbs, lbsToKg } from '../utils/units';
import { colors, globalStyles } from '../theme';
import KeyboardDismissButton from '../components/KeyboardDismissButton';

type WeightLog = {
  id: number;
  weight_kg: number;
  date: string;
  notes: string | null;
};

type Range = '30' | '90' | 'all';

function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function WeightScreen() {
  const { token } = useAuth();
  const { weightUnit } = usePreferences();
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [range, setRange] = useState<Range>('90');

  useFocusEffect(useCallback(() => { loadLogs(); }, []));

  async function loadLogs() {
    try {
      const data = await apiFetch('/weight-logs/', token);
      setLogs(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load weight logs');
    }
  }

  async function handleAdd() {
    if (!weight) return;
    try {
      const weightKg = weightUnit === 'lbs' ? lbsToKg(parseFloat(weight)) : parseFloat(weight);
      await apiFetch('/weight-logs/', token, {
        method: 'POST',
        body: JSON.stringify({ weight_kg: weightKg, date: toLocalDateString(new Date()), notes: notes || null }),
      });
      setWeight('');
      setNotes('');
      loadLogs();
    } catch (e) {
      Alert.alert('Error', 'Could not save weight log');
    }
  }

  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const cutoff = range === 'all' ? null : (() => {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(range));
    return toLocalDateString(d);
  })();
  const filtered = cutoff ? sorted.filter(l => l.date >= cutoff) : sorted;
  const latestLog = sorted.length > 0 ? sorted[sorted.length - 1] : null;
  const displayWeight = (kg: number) => weightUnit === 'lbs' ? kgToLbs(kg) : Math.round(kg * 10) / 10;

  const weights = filtered.map(l => displayWeight(l.weight_kg));
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 1;
  const yPadding = Math.max((maxWeight - minWeight) * 0.2, 0.5);
  const labelEvery = filtered.length > 30 ? 7 : filtered.length > 10 ? 3 : 1;
  const chartData = filtered.map((l, i) => ({
    value: displayWeight(l.weight_kg),
    label: i % labelEvery === 0 ? l.date.slice(5) : '',
  }));

  return (
    <View style={styles.container}>
      <FlatList
        data={[...logs].sort((a, b) => b.date.localeCompare(a.date))}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <>
            <Text style={styles.screenTitle}>Weight</Text>

            {latestLog && (
              <View style={[globalStyles.card, styles.currentCard]}>
                <Text style={styles.currentWeight}>{displayWeight(latestLog.weight_kg)}</Text>
                <Text style={styles.currentUnit}>{weightUnit}</Text>
                <Text style={styles.currentDate}>as of {latestLog.date}</Text>
              </View>
            )}

            <View style={[globalStyles.card, styles.chartCard]}>
              <View style={styles.toggleRow}>
                {(['30', '90', 'all'] as Range[]).map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.toggleBtn, range === r && styles.toggleBtnActive]}
                    onPress={() => setRange(r)}>
                    <Text style={[styles.toggleText, range === r && styles.toggleTextActive]}>
                      {r === 'all' ? 'All' : `${r}d`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {chartData.length < 2 ? (
                <Text style={styles.emptyChart}>Log at least 2 entries to see the chart</Text>
              ) : (
                <LineChart
                  data={chartData}
                  height={140}
                  spacing={filtered.length > 30 ? 20 : 40}
                  initialSpacing={8}
                  color={colors.blue}
                  thickness={2}
                  curved
                  scrollToEnd
                  dataPointsColor={colors.blue}
                  dataPointsRadius={3}
                  yAxisOffset={minWeight - yPadding}
                  maxValue={maxWeight - minWeight + yPadding * 2}
                  noOfSections={4}
                  yAxisTextStyle={styles.axisText}
                  xAxisLabelTextStyle={styles.axisText}
                  hideRules={false}
                  rulesColor="rgba(255,255,255,0.06)"
                  yAxisColor="rgba(255,255,255,0.1)"
                  xAxisColor="rgba(255,255,255,0.1)"
                  backgroundColor="transparent"
                />
              )}
            </View>

            <View style={styles.inputRow}>
              <TextInput
                keyboardAppearance="dark"
                style={[globalStyles.input, styles.inputFlex, { marginBottom: 0 }]}
                placeholder={`Weight (${weightUnit})`}
                placeholderTextColor={colors.textSecondary}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
              />
              <TextInput
                keyboardAppearance="dark"
                style={[globalStyles.input, styles.inputFlex2, { marginBottom: 0 }]}
                placeholder="Notes (optional)"
                placeholderTextColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>History</Text>
          </>
        }
        renderItem={({ item, index }) => {
          const total = [...logs].length;
          return (
          <View style={[
            styles.logItem,
            index === 0 && styles.logItemFirst,
            index === total - 1 && styles.logItemLast,
          ]}>
            <View>
              <Text style={styles.logWeight}>{displayWeight(item.weight_kg)} {weightUnit}</Text>
              {item.notes && <Text style={styles.logNotes}>{item.notes}</Text>}
            </View>
            <Text style={styles.logDate}>{item.date}</Text>
          </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.logDivider} />}
      />
      <KeyboardDismissButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  screenTitle: { fontSize: 34, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },

  currentCard: { padding: 20, alignItems: 'center', marginBottom: 14 },
  currentWeight: { fontSize: 48, fontWeight: '700', color: colors.blue },
  currentUnit: { fontSize: 18, color: colors.textSecondary, marginTop: -4 },
  currentDate: { fontSize: 13, color: colors.textSecondary, marginTop: 6 },

  chartCard: { padding: 14, marginBottom: 14 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  toggleBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  toggleBtnActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  toggleText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  toggleTextActive: { color: 'white' },
  emptyChart: { textAlign: 'center', color: colors.textSecondary, paddingVertical: 40 },
  axisText: { fontSize: 10, color: colors.textSecondary },

  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 20 },
  inputFlex: { flex: 1 },
  inputFlex2: { flex: 1.5 },
  addBtn: { backgroundColor: colors.blue, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, justifyContent: 'center' },
  addBtnText: { color: 'white', fontWeight: '600', fontSize: 15 },

  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },

  logItem: { backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logItemFirst: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  logItemLast: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  logDivider: { height: 1, backgroundColor: colors.divider, marginLeft: 16 },
  logWeight: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  logDate: { fontSize: 13, color: colors.textSecondary },
  logNotes: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
