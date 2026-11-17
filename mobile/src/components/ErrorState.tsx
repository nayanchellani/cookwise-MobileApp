import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../constants/theme';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  title?: string;
  message: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>!</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <PrimaryButton title="Try Again" onPress={onRetry} variant="outline" style={styles.btn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.error + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  icon: {
    fontSize: 28,
    color: Colors.error,
    fontWeight: FontWeight.bold,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.6,
    maxWidth: 300,
  },
  btn: { marginTop: Spacing.md },
});
