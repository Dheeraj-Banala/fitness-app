import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

type UserProfile = {
  id: number;
  username: string;
  email: string;
};

export default function ProfileScreen() {
  const { token, refreshToken, setTokens } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await apiFetch('/users/me', token);
      setProfile(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load profile');
    }
  }

  async function handleLogout() {
    try {
      await apiFetch('/users/logout', token, {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } finally {
      setTokens(null, null)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {profile && (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>Username</Text>
            <Text style={styles.value}>{profile.username}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{profile.email}</Text>
          </View>
        </>
      )}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  label: { fontSize: 12, color: '#999', marginBottom: 4 },
  value: { fontSize: 16 },
  logoutButton: { marginTop: 32, backgroundColor: '#FF3B30', padding: 14, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: 'white', fontWeight: '600', fontSize: 16 },
});