import React, { useState, useEffect, useRef } from "react";
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import { apiFetch } from "../services/api";
import { mlToOz, ozToMl } from "../utils/units";

const DELETE_WIDTH = 80;

function DeleteAction({ drag, onDelete }: { drag: SharedValue<number>; onDelete: () => void }) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + DELETE_WIDTH }],
  }));
  return (
    <Animated.View style={[styles.swipeDelete, animStyle]}>
      <TouchableOpacity onPress={onDelete} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={styles.swipeDeleteText}>Delete</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const HISTORY_DAYS = 90;
const VISIBLE_DAYS = 7;

type WaterLog = {
  id: number;
  amount_ml: number;
  date: string;
  created_at: string;
}

function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function WaterScreen() {
  const { token } = useAuth();
  const { volumeUnit } = usePreferences();
  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [amount, setAmount] = useState('');
  const [goalWater, setGoalWater] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const hasScrolled = useRef(false);

  useEffect(() => {
    loadLogs();
    loadGoals();
  }, []);

  async function loadGoals() {
    try {
      const data = await apiFetch('/goals/', token);
      setGoalWater(data.water_ml);
    } catch (e) {}
  }

  async function loadLogs() {
    try {
      const data = await apiFetch('/water-logs/', token);
      setLogs(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load water logs');
    }
  }

  function todayTotal() {
    const today = toLocalDateString(new Date());
    return logs.filter(l => l.date === today).reduce((sum, l) => sum + l.amount_ml, 0);
  }

  function buildChartDays() {
    const days = [];
    for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = toLocalDateString(d);
      const total = logs.filter(l => l.date === dateStr).reduce((sum, l) => sum + l.amount_ml, 0);
      days.push({ date: dateStr, label: dateStr.slice(5), total });
    }
    return days;
  }

  async function handleDelete(logId: number) {
    try {
      await apiFetch(`/water-logs/${logId}`, token, { method: 'DELETE' });
      loadLogs();
    } catch (e) {}
  }

  async function handleAdd() {
    if (!amount) return;
    try {
      const amountMl = volumeUnit === 'oz' ? ozToMl(parseFloat(amount)) : parseFloat(amount);
      await apiFetch('/water-logs/', token, {
        method: 'POST',
        body: JSON.stringify({
          amount_ml: amountMl,
          date: toLocalDateString(new Date()),
        }),
      });
      setAmount('');
      loadLogs();
    } catch (e) {
      Alert.alert('Error', 'Could not save water log');
    }
  }

  const days = buildChartDays();
  const today = toLocalDateString(new Date());
  const barWidth = chartWidth > 0 ? chartWidth / VISIBLE_DAYS : 0;
  const chartHeight = 100;

  const displayVol = (ml: number) => volumeUnit === 'oz' ? mlToOz(ml) : Math.round(ml);
  const displayGoal = goalWater != null ? displayVol(goalWater) : null;

  const total = todayTotal();
  const ratio = goalWater ? Math.min(total / goalWater, 1) : 0;
  const todayLogs = logs.filter(l => l.date === today).slice().reverse();
  const maxTotal = Math.max(...days.map(d => d.total), goalWater ?? 1, 1);

  // Scroll to show today on the right edge once layout is known
  useEffect(() => {
    if (barWidth > 0 && !hasScrolled.current) {
      scrollRef.current?.scrollTo({ x: (HISTORY_DAYS - VISIBLE_DAYS) * barWidth, animated: false });
      hasScrolled.current = true;
    }
  }, [barWidth]);

  // Derive the visible date range label from scroll position
  const firstVisibleIdx = barWidth > 0 ? Math.round(scrollX / barWidth) : HISTORY_DAYS - VISIBLE_DAYS;
  const clampedFirst = Math.max(0, Math.min(firstVisibleIdx, days.length - VISIBLE_DAYS));
  const visibleSlice = days.slice(clampedFirst, clampedFirst + VISIBLE_DAYS);
  const rangeLabel = visibleSlice.length > 0
    ? `${visibleSlice[0].label} – ${visibleSlice[visibleSlice.length - 1].label}`
    : '';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Water Log</Text>

      <View style={styles.card}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Today</Text>
          <Text style={styles.progressValue}>{displayVol(total)} / {displayGoal ?? '—'} {volumeUnit}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.chartTitle}>{rangeLabel}</Text>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={barWidth > 0 ? barWidth : undefined}
          decelerationRate="fast"
          bounces={false}
          onLayout={e => setChartWidth(e.nativeEvent.layout.width)}
          onScroll={e => setScrollX(e.nativeEvent.contentOffset.x)}
          scrollEventThrottle={16}
          style={styles.chartClip}
        >
          <View style={{ flexDirection: 'row' }}>
            {days.map((day, index) => (
              <View key={index} style={{ width: barWidth, alignItems: 'center' }}>
                <View style={{ height: chartHeight, justifyContent: 'flex-end' }}>
                  <View style={{
                    width: barWidth * 0.55,
                    borderRadius: 3,
                    height: day.total > 0 ? Math.max((day.total / maxTotal) * chartHeight, 4) : 0,
                    backgroundColor: day.date === today ? '#007AFF' : '#93C5FD',
                  }} />
                </View>
                <Text style={styles.barLabel}>{day.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <Text style={styles.swipeHint}>Swipe to navigate</Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={`Amount (${volumeUnit})`}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
        <Button title="Add" onPress={handleAdd} />
      </View>

      <FlatList
        data={todayLogs}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <Swipeable
            overshootRight={false}
            renderRightActions={(_, drag) => (
              <DeleteAction drag={drag} onDelete={() => handleDelete(item.id)} />
            )}
          >
            <View style={styles.logItem}>
              <View style={styles.logRow}>
                <View>
                  <Text style={styles.logAmount}>{displayVol(item.amount_ml)} {volumeUnit}</Text>
                  <Text style={styles.logDate}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
            </View>
          </Swipeable>
        )}
        style={styles.logList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#f0f0f0', borderRadius: 10, padding: 14, marginBottom: 16 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 14, fontWeight: '500', color: '#333' },
  progressValue: { fontSize: 13, color: '#666' },
  progressTrack: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: '#007AFF' },
  chartTitle: { fontSize: 13, color: '#666', marginBottom: 12, textAlign: 'center' },
  chartClip: { overflow: 'hidden' },
  barLabel: { fontSize: 10, color: '#666', marginTop: 4 },
  swipeHint: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 8 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  logList: { flex: 1 },
  logItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logAmount: { fontSize: 18, fontWeight: '600' },
  logDate: { color: '#666', marginTop: 4 },
  deleteButton: { color: '#FF3B30', fontSize: 16, paddingLeft: 12 },
  swipeDelete: { backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', width: DELETE_WIDTH },
  swipeDeleteText: { color: 'white', fontWeight: '600', fontSize: 15 },
});
