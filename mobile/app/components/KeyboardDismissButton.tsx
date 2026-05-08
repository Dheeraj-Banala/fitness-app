import React, { useState, useEffect } from 'react';
import { Keyboard, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function KeyboardDismissButton() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', e => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  if (keyboardHeight === 0) return null;

  return (
    <TouchableOpacity
      style={[styles.btn, { bottom: keyboardHeight - 48 }]}
      onPress={() => Keyboard.dismiss()}
      activeOpacity={0.8}>
      <Text style={styles.icon}>↓</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: { color: colors.blue, fontSize: 18, fontWeight: '700', textAlign: 'center', includeFontPadding: false },
});
