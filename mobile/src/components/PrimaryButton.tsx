import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Pressable,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';
import { Colors, Radius, Spacing, FontSize, FontWeight } from '../constants/theme';
import { triggerImpact } from '../utils/haptics';

interface Props {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
}

export function PrimaryButton({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  style,
  disabled,
  icon,
  onPress,
}: Props) {
  const isDisabled = disabled || loading;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (isDisabled) return;
    triggerImpact();
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    if (isDisabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={[
          styles.base,
          styles[variant],
          styles[`size_${size}`],
          isDisabled && styles.disabled,
          style,
        ]}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? Colors.backgroundWhite : Colors.primary}
            size="small"
          />
        ) : (
          <>
            {icon ? <>{icon}</> : null}
            <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]]}>
              {title}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.backgroundSage,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  size_sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, minHeight: 36 },
  size_md: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, minHeight: 46 },
  size_lg: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, minHeight: 52 },
  disabled: { opacity: 0.45 },
  label: { fontWeight: FontWeight.medium, letterSpacing: 0.1 },
  label_primary: { color: Colors.backgroundWhite },
  label_secondary: { color: Colors.primary },
  label_outline: { color: Colors.textPrimary },
  label_ghost: { color: Colors.primary },
  labelSize_sm: { fontSize: FontSize.sm },
  labelSize_md: { fontSize: FontSize.md },
  labelSize_lg: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
