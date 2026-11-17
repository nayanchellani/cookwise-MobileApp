import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, FontSize, FontWeight } from '../constants/theme';

interface Props {
  label: string;
  onRemove?: () => void;
  onPress?: () => void;
  selected?: boolean;
  variant?: 'default' | 'removable' | 'selectable';
  style?: ViewStyle;
}

export function IngredientChip({
  label,
  onRemove,
  onPress,
  selected = false,
  variant = 'default',
  style,
}: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && styles.selected,
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !onRemove}
    >
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {label}
      </Text>
      {variant === 'removable' && onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn} hitSlop={8}>
          <Text style={styles.removeIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.chip,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    gap: Spacing.xs,
    margin: 3,
  },
  selected: {
    backgroundColor: Colors.primary,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  labelSelected: {
    color: Colors.backgroundWhite,
  },
  removeBtn: {
    marginLeft: 2,
  },
  removeIcon: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
  },
});
