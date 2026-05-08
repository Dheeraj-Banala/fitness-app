import React, { useState, useEffect, useRef } from 'react';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { View, Text, TextInput, FlatList, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../services/api';
import { mlToOz, ozToMl } from '../utils/units';
import { colors, globalStyles } from '../theme';
import KeyboardDismissButton from '../components/KeyboardDismissButton';

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
};

function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function WaterScreen() {
  const { token } = useAuth();
  const { volumeUnit } = usePreferences();
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [amount, setAmount] = useState('');
  const [goalWater, setGoalWater] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const hasScrolled = useRef(false);

  useEffect(() => { loadLogs(); loadGoals(); }, []);

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
        body: JSON.stringify({ amount_ml: amountMl, date: toLocalDateString(new Date()) }),
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

  useEffect(() => {
    if (barWidth > 0 && !hasScrolled.current) {
      scrollRef.current?.scrollTo({ x: (HISTORY_DAYS - VISIBLE_DAYS) * barWidth, animated: false });
      hasScrolled.current = true;
    }
  }, [barWidth]);

  const firstVisibleIdx = barWidth > 0 ? Math.round(scrollX / barWidth) : HISTORY_DAYS - VISIBLE_DAYS;
  const clampedFirst = Math.max(0, Math.min(firstVisibleIdx, days.length - VISIBLE_DAYS));
  const visibleSlice = days.slice(clampedFirst, clampedFirst + VISIBLE_DAYS);
  const rangeLabel = visibleSlice.length > 0
    ? `${visibleSlice[0].label} – ${visibleSlice[visibleSlice.length - 1].label}`
    : '';

  return (
    <View style={styles.container}>
      <FlatList
        data={todayLogs}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <>
            <Text style={styles.screenTitle}>Water</Text>

            <View style={[globalStyles.card, styles.progressCard]}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Today</Text>
                <Text style={styles.progressValue}>{displayVol(total)} / {displayGoal ?? '—'} {volumeUnit}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
              </View>
            </View>

            <View style={[globalStyles.card, styles.chartCard]}>
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
              >
                <View style={{ flexDirection: 'row' }}>
                  {days.map((day, index) => (
                    <View key={index} style={{ width: barWidth, alignItems: 'center' }}>
                      <View style={{ height: chartHeight, justifyContent: 'flex-end' }}>
                        <View style={{
                          width: barWidth * 0.55,
                          borderRadius: 4,
                          height: day.total > 0 ? Math.max((day.total / maxTotal) * chartHeight, 4) : 0,
                          backgroundColor: day.date === today ? colors.blue : 'rgba(0,122,255,0.3)',
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
                keyboardAppearance="dark"
                style={[globalStyles.input, { flex: 1, marginBottom: 0 }]}
                placeholder={`Amount (${volumeUnit})`}
                placeholderTextColor={colors.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {todayLogs.length > 0 && <Text style={styles.sectionLabel}>Today's logs</Text>}
          </>
        }
        renderItem={({ item, index }) => (
          <Swipeable
            overshootRight={false}
            renderRightActions={(_, drag) => (
              <DeleteAction drag={drag} onDelete={() => handleDelete(item.id)} />
            )}
          >
            <View style={[
              styles.logItem,
              index === 0 && styles.logItemFirst,
              index === todayLogs.length - 1 && styles.logItemLast,
            ]}>
              <Text style={styles.logAmount}>{displayVol(item.amount_ml)} {volumeUnit}</Text>
              <Text style={styles.logTime}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </Swipeable>
        )}
        ItemSeparatorComponent={() => <View style={styles.logDivider} />}
      />
      <KeyboardDismissButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  screenTitle: { fontSize: 34, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },

  progressCard: { padding: 16, marginBottom: 14 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  progressValue: { fontSize: 14, color: colors.textSecondary },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.blue },

  chartCard: { padding: 14, marginBottom: 14 },
  chartTitle: { fontSize: 12, color: colors.textSecondary, marginBottom: 10, textAlign: 'center' },
  barLabel: { fontSize: 9, color: colors.textSecondary, marginTop: 4 },
  swipeHint: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 10 },

  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 20 },
  addBtn: { backgroundColor: colors.blue, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16 },
  addBtnText: { color: 'white', fontWeight: '600', fontSize: 15 },

  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },

  logItem: { backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logItemFirst: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  logItemLast: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  logDivider: { height: 1, backgroundColor: colors.divider, marginLeft: 16 },
  logAmount: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  logTime: { fontSize: 13, color: colors.textSecondary },

  swipeDelete: { backgroundColor: colors.destructive, justifyContent: 'center', alignItems: 'center', width: DELETE_WIDTH },
  swipeDeleteText: { color: 'white', fontWeight: '600', fontSize: 15 },
});
