import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { apiFetch } from '../services/api';
import { colors, globalStyles } from '../theme';
import KeyboardDismissButton from '../components/KeyboardDismissButton';

export default function LoginScreen() {
  const { setTokens } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin() {
    try {
      const data = await apiFetch('/users/login', null, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setTokens(data.access_token, data.refresh_token);
    } catch (e) {
      setError('Invalid email or password');
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.appName}>Food & Fitness</Text>
        <Text style={styles.subtitle}>Track your nutrition and workouts</Text>

        <View style={[globalStyles.card, styles.formCard]}>
          <TextInput
                keyboardAppearance="dark"
            style={[styles.cardInput, styles.borderBottom]}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={t => { setEmail(t); setError(''); }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
                keyboardAppearance="dark"
            style={styles.cardInput}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={t => { setPassword(t); setError(''); }}
            secureTextEntry
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginBtnText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => (navigation as any).navigate('Register')}>
          <Text style={styles.registerLink}>Don't have an account? <Text style={styles.registerLinkBold}>Register</Text></Text>
        </TouchableOpacity>
      </View>
      <KeyboardDismissButton />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, paddingTop: 60 },

  appName: { fontSize: 34, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 40 },

  formCard: { marginBottom: 12 },
  cardInput: { paddingHorizontal: 16, paddingVertical: 14, color: colors.textPrimary, fontSize: 15 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: colors.divider },

  error: { color: colors.destructive, fontSize: 14, marginBottom: 12, textAlign: 'center' },

  loginBtn: { backgroundColor: colors.blue, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 4, marginBottom: 20 },
  loginBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },

  registerLink: { textAlign: 'center', fontSize: 14, color: colors.textSecondary },
  registerLinkBold: { color: colors.blue, fontWeight: '600' },
});
