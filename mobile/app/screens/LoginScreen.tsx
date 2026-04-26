import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { apiFetch } from '../services/api';

export default function LoginScreen() {
    const { setToken } = useAuth();
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    async function handleLogin() {
        try {
            const data = await apiFetch('/users/login', null, {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            setToken(data.access_token);
        } catch(e) {
            setError('Invalid email or password');
        }
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View>
                <Text style={styles.title}>Food & Fitness</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Log In</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => (navigation as any).navigate('Register')}>
                    <Text style={styles.registerLink}>Don't have an account? Register</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16},
    error: { color: 'red', marginBottom: 16},
    registerLink: { marginTop: 16, textAlign: 'center', color: '#007AFF' },
    button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
