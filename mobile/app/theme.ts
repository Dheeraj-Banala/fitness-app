import { StyleSheet } from 'react-native';

export const colors = {
  bg: '#0F0F14',
  card: '#1A1A2E',
  cardBorder: 'rgba(0, 122, 255, 0.25)',
  blue: '#007AFF',
  textPrimary: '#F0F0F5',
  textSecondary: '#8E8E9A',
  divider: 'rgba(255, 255, 255, 0.06)',
  destructive: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  teal: '#32D2C9',
  purple: '#AF52DE',
  inputBg: '#252540',
  inputBorder: 'rgba(0, 122, 255, 0.2)',
};

export const cardShadow = {
  shadowColor: '#007AFF',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.18,
  shadowRadius: 12,
  elevation: 6,
};

export const globalStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...cardShadow,
  },
  screenBg: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    padding: 12,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
});
