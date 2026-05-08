import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { LineChart } from 'react-native-gifted-charts';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../services/api';
import { kgToLbs } from '../utils/units';
import { colors, globalStyles } from '../theme';

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

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: colors.bg }} color={colors.blue} />;

  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No history yet for {exerciseName}.</Text>
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

        <View style={styles.statRow}>
          <View style={[globalStyles.card, styles.statCard]}>
            <Text style={styles.statLabel}>Latest max</Text>
            <Text style={styles.statValue}>{latestDisplay} {weightUnit}</Text>
          </View>
          <View style={[globalStyles.card, styles.statCard]}>
            <Text style={styles.statLabel}>All-time max</Text>
            <Text style={styles.statValue}>{Math.max(...allWeights)} {weightUnit}</Text>
          </View>
          {diff != null && (
            <View style={[globalStyles.card, styles.statCard]}>
              <Text style={styles.statLabel}>vs last</Text>
              <Text style={[styles.statValue, { color: diff >= 0 ? colors.success : colors.destructive }]}>
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
            color={colors.blue}
            thickness={2}
            curved
            scrollToEnd
            dataPointsColor={colors.blue}
            dataPointsRadius={3}
            yAxisOffset={minW - yPadding}
            maxValue={maxW - minW + yPadding * 2}
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
  container: { flex: 1, backgroundColor: colors.bg },
  topSection: { padding: 16 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: colors.bg },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },

  statRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, padding: 12, alignItems: 'center' },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4, textAlign: 'center' },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },

  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggleBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.card, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  toggleBtnActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  toggleText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  toggleTextActive: { color: 'white' },

  chartTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  chartHint: { color: colors.textSecondary, fontSize: 14, marginBottom: 16 },
  axisText: { fontSize: 10, color: colors.textSecondary },

  historyTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 16 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.divider },
  historyDate: { fontSize: 14, color: colors.textSecondary },
  historyWeight: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
});
