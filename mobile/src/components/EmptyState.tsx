import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../constants/theme';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  icon?: React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({ icon, title, message, actionLabel, onAction, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {icon != null && (
        <View style={styles.iconWrapper}>
          {typeof icon === 'string' ? (
            <Text style={styles.iconText}>{icon}</Text>
          ) : (
            icon
          )}
        </View>
      )}
      {Boolean(title) && <Text style={styles.title}>{title}</Text>}
      {Boolean(message) && <Text style={styles.message}>{message}</Text>}
      {Boolean(actionLabel && onAction) && (
        <PrimaryButton title={actionLabel!} onPress={onAction} style={styles.btn} size="sm" />
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
    gap: Spacing.xs,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.backgroundSage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  iconText: {
    fontSize: 24,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.55,
    maxWidth: 290,
  },
  btn: { marginTop: Spacing.md },
});
