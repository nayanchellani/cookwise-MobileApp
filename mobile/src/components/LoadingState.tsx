import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight } from '../constants/theme';

interface Props {
  message?: string;
  submessage?: string;
  style?: ViewStyle;
}

export function LoadingState({ message = 'Preparing…', submessage, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="small" color={Colors.primary} />
      <Text style={styles.message}>{message}</Text>
      {submessage && <Text style={styles.sub}>{submessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
    backgroundColor: Colors.backgroundWarm,
  },
  message: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.xs * 1.5,
    maxWidth: 260,
  },
});
