import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";

type WeightLog = {
  id: number;
  weight_kg: number;
  date: string;
  notes: string | null;
}

type Range = '30' | '90' | 'all';

function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function WeightScreen() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [range, setRange] = useState<Range>('90');

  useEffect(() => {
    loadLogs();
  }, []);

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
      await apiFetch('/weight-logs/', token, {
        method: 'POST',
        body: JSON.stringify({
          weight_kg: parseFloat(weight),
          date: toLocalDateString(new Date()),
          notes: notes || null,
        }),
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

  const weights = filtered.map(l => l.weight_kg);
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 1;
  const yPadding = Math.max((maxWeight - minWeight) * 0.2, 0.5);

  // Only label every Nth point to avoid crowding
  const labelEvery = filtered.length > 30 ? 7 : filtered.length > 10 ? 3 : 1;

  const chartData = filtered.map((l, i) => ({
    value: l.weight_kg,
    label: i % labelEvery === 0 ? l.date.slice(5) : '',
    dataPointText: '',
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weight Log</Text>

      {latestLog && (
        <View style={styles.card}>
          <Text style={styles.currentWeight}>{latestLog.weight_kg} kg</Text>
          <Text style={styles.currentDate}>as of {latestLog.date}</Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.toggleRow}>
          {(['30', '90', 'all'] as Range[]).map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.toggleBtn, range === r && styles.toggleBtnActive]}
              onPress={() => setRange(r)}
            >
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
            color="#007AFF"
            thickness={2}
            curved
            scrollToEnd
            dataPointsColor="#007AFF"
            dataPointsRadius={3}
            yAxisOffset={minWeight - yPadding}
            maxValue={maxWeight - minWeight + yPadding * 2}
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

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Weight (kg)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, { flex: 1.5 }]}
          placeholder="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
        />
        <Button title="Add" onPress={handleAdd} />
      </View>

      <FlatList
        data={[...logs].sort((a, b) => b.date.localeCompare(a.date))}
        keyExtractor={item => item.id.toString()}
        style={styles.logList}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <Text style={styles.logWeight}>{item.weight_kg} kg</Text>
            <Text style={styles.logDate}>{item.date}</Text>
            {item.notes && <Text style={styles.logNotes}>{item.notes}</Text>}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#f0f0f0', borderRadius: 10, padding: 14, marginBottom: 16 },
  currentWeight: { fontSize: 28, fontWeight: 'bold', color: '#007AFF' },
  currentDate: { fontSize: 13, color: '#888', marginTop: 2 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggleBtn: { flex: 1, padding: 8, borderRadius: 6, backgroundColor: '#e0e0e0', alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#007AFF' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#555' },
  toggleTextActive: { color: 'white' },
  emptyChart: { textAlign: 'center', color: '#aaa', paddingVertical: 40 },
  axisText: { fontSize: 10, color: '#999' },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  logList: { flex: 1 },
  logItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  logWeight: { fontSize: 18, fontWeight: '600' },
  logDate: { color: '#666', marginTop: 4 },
  logNotes: { color: '#999', marginTop: 4 },
});
