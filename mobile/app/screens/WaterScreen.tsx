import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";

type WaterLog = {
  id: number;
  amount_ml: number;
  date: string;
}

export default function WaterScreen() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const data = await apiFetch('/water-logs/', token);
      setLogs(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load water logs');
    }
  }

  async function handleAdd() {
    if (!amount) return;
    try {
      await apiFetch('/water-logs/', token, {
        method: 'POST',
        body: JSON.stringify({
          amount_ml: parseFloat(amount),
          date: new Date().toISOString().split('T')[0]
        }),
      });
      setAmount('');
      loadLogs();
    } catch (e) {
      Alert.alert('Error', 'Could not save water log');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Water Log</Text>
      <TextInput
        style={styles.input}
        placeholder="Water (ml)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <Button title="Add Entry" onPress={handleAdd} />
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <Text style={styles.logAmount}>{item.amount_ml} ml</Text>
            <Text style={styles.logDate}>{item.date}</Text>
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
  logAmount: { fontSize: 18, fontWeight: '600' },
  logDate: { color: '#666', marginTop: 4 },
});
