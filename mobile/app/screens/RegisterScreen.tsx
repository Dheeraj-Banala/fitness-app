import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { apiFetch } from '../services/api';
import { colors, globalStyles } from '../theme';
import KeyboardDismissButton from '../components/KeyboardDismissButton';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleRegister() {
    if (!username || !email || !password) return;
    try {
      await apiFetch('/users/register', null, {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
      Alert.alert('Account created', 'You can now log in.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Could not create account');
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join to start tracking</Text>

        <View style={[globalStyles.card, styles.formCard]}>
          <TextInput
                keyboardAppearance="dark"
            style={[styles.cardInput, styles.borderBottom]}
            placeholder="Username"
            placeholderTextColor={colors.textSecondary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
                keyboardAppearance="dark"
            style={[styles.cardInput, styles.borderBottom]}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
                keyboardAppearance="dark"
            style={styles.cardInput}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
          <Text style={styles.registerBtnText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Already have an account? <Text style={styles.backLinkBold}>Log In</Text></Text>
        </TouchableOpacity>
      </View>
      <KeyboardDismissButton />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, paddingTop: 60 },

  title: { fontSize: 34, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 40 },

  formCard: { marginBottom: 12 },
  cardInput: { paddingHorizontal: 16, paddingVertical: 14, color: colors.textPrimary, fontSize: 15 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: colors.divider },

  registerBtn: { backgroundColor: colors.blue, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 4, marginBottom: 20 },
  registerBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },

  backLink: { textAlign: 'center', fontSize: 14, color: colors.textSecondary },
  backLinkBold: { color: colors.blue, fontWeight: '600' },
});
