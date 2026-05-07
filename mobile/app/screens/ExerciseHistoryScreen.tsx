import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { LineChart } from 'react-native-gifted-charts';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../services/api';
import { kgToLbs } from '../utils/units';

type HistoryEntry = {
  date: string;
  max_weight: number;
  max_volume: number;
};

type Range = '30' | '90' | 'all';
type Metric = 'weight' | 'volume';

export default function ExerciseHistoryScreen() {
  const { token } = useAuth();
  const { weightUnit } = usePreferences();
  const route = useRoute();
  const { exerciseName } = route.params as { exerciseName: string };

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('90');
  const [metric, setMetric] = useState<Metric>('weight');

  useEffect(() => {
    apiFetch(`/workouts/exercise-history?exercise_name=${encodeURIComponent(exerciseName)}`, token)
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function displayWeight(kg: number): number {
    return weightUnit === 'lbs' ? kgToLbs(kg) : Math.round(kg * 10) / 10;
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No weight history yet for {exerciseName}.</Text>
        <Text style={styles.emptyHint}>Log a workout with weighted sets to see progress here.</Text>
      </View>
    );
  }

  const cutoff = range === 'all' ? null : (() => {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(range));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const filtered = cutoff ? history.filter(e => e.date >= cutoff) : history;

  const allWeights = history.map(e => displayWeight(e.max_weight));
  const filteredValues = filtered.map(e =>
    metric === 'weight'
      ? displayWeight(e.max_weight)
      : Math.round(displayWeight(e.max_weight) * e.max_volume / e.max_weight)
  );
  const minW = filteredValues.length > 0 ? Math.min(...filteredValues) : 0;
  const maxW = filteredValues.length > 0 ? Math.max(...filteredValues) : 1;
  const yPadding = Math.max((maxW - minW) * 0.15, 2.5);

  const labelEvery = filtered.length > 20 ? 4 : filtered.length > 10 ? 2 : 1;
  const chartData = filtered.map((e, i) => ({
    value: filteredValues[i],
    label: i % labelEvery === 0 ? e.date.slice(5) : '',
  }));

  const latest = history[history.length - 1];
  const latestDisplay = displayWeight(latest.max_weight);
  const prev = history.length > 1 ? displayWeight(history[history.length - 2].max_weight) : null;
  const diff = prev != null ? Math.round((latestDisplay - prev) * 10) / 10 : null;

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.exerciseName}>{exerciseName}</Text>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Latest max</Text>
            <Text style={styles.statValue}>{latestDisplay} {weightUnit}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>All-time max</Text>
            <Text style={styles.statValue}>{Math.max(...allWeights)} {weightUnit}</Text>
          </View>
          {diff != null && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>vs last session</Text>
              <Text style={[styles.statValue, { color: diff >= 0 ? '#34C759' : '#FF3B30' }]}>
                {diff >= 0 ? '+' : ''}{diff} {weightUnit}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.toggleRow}>
          {(['weight', 'volume'] as Metric[]).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.toggleBtn, metric === m && styles.toggleBtnActive]}
              onPress={() => setMetric(m)}>
              <Text style={[styles.toggleText, metric === m && styles.toggleTextActive]}>
                {m === 'weight' ? 'Max Weight' : 'Max Set Volume'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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

        <Text style={styles.chartTitle}>
          {metric === 'weight' ? 'Max weight per session' : 'Max set volume per session'}
        </Text>
        {filtered.length < 2 ? (
          <Text style={styles.chartHint}>Not enough data in this range</Text>
        ) : (
          <LineChart
            data={chartData}
            height={160}
            spacing={filtered.length > 20 ? 24 : 44}
            initialSpacing={8}
            color="#007AFF"
            thickness={2}
            curved
            scrollToEnd
            dataPointsColor="#007AFF"
            dataPointsRadius={3}
            yAxisOffset={minW - yPadding}
            maxValue={maxW - minW + yPadding * 2}
            noOfSections={4}
            yAxisTextStyle={styles.axisText}
            xAxisLabelTextStyle={styles.axisText}
            hideRules={false}
            rulesColor="#e0e0e0"
            yAxisColor="#e0e0e0"
            xAxisColor="#e0e0e0"
          />
        )}
      </View>

      <Text style={styles.historyTitle}>Session history</Text>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {[...history].reverse().map((entry, i) => (
          <View key={i} style={styles.historyRow}>
            <Text style={styles.historyDate}>{entry.date}</Text>
            <Text style={styles.historyWeight}>{displayWeight(entry.max_weight)} {weightUnit}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSection: { padding: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: '#888', textAlign: 'center' },
  exerciseName: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 10, padding: 12, alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#888', marginBottom: 4, textAlign: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#333' },
  chartTitle: { fontSize: 15, fontWeight: '600', color: '#555', marginBottom: 12 },
  chartHint: { color: '#888', fontSize: 14, marginBottom: 16 },
  axisText: { fontSize: 10, color: '#999' },
  historyTitle: { fontSize: 15, fontWeight: '600', color: '#555', marginTop: 8, marginBottom: 8, paddingHorizontal: 16 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  historyDate: { fontSize: 14, color: '#555' },
  historyWeight: { fontSize: 14, fontWeight: '600', color: '#333' },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#007AFF' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#555' },
  toggleTextActive: { color: 'white' },
});
