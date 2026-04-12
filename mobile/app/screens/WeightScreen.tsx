import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";

type WeightLog = {
  id: number;
  weight_kg: number;
  date: string;
  notes: string | null;
}

export default function WeightScreen() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

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
          date: new Date().toISOString().split('T')[0],
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weight Log</Text>
      <TextInput
        style={styles.input}
        placeholder="Weight (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
      />
      <Button title="Add Entry" onPress={handleAdd} />
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id.toString()}
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
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  logItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  logWeight: { fontSize: 18, fontWeight: '600' },
  logDate: { color: '#666', marginTop: 4 },
  logNotes: { color: '#999', marginTop: 4 },
});
