import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Pressable, type ViewStyle } from 'react-native';
import { Clock, Flame, BarChart2, Heart } from 'lucide-react-native';
import { Colors, Radius, Spacing, FontSize, FontWeight, Shadows } from '../constants/theme';
import { getRecipeImage } from '../constants/images';
import { triggerSelection, triggerNotification } from '../utils/haptics';
import type { Recipe } from '../types/api';

export const CUISINE_COLORS: Record<string, string> = {
  Indian: Colors.cuisineIndian,
  Italian: Colors.cuisineItalian,
  Mexican: Colors.cuisineMexican,
  Asian: Colors.cuisineAsian,
  Mediterranean: Colors.cuisineMediterranean,
  default: Colors.cuisineDefault,
};

interface Props {
  recipe: Recipe;
  onPress: () => void;
  onSave?: () => void;
  saved?: boolean;
  style?: ViewStyle;
  compact?: boolean;
}

export function RecipeCard({
  recipe,
  onPress,
  onSave,
  saved = false,
  style,
  compact = false,
}: Props) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getRecipeImage(recipe.cuisine);
  const accentColor = CUISINE_COLORS[recipe.cuisine] ?? CUISINE_COLORS.default;

  // Press Scale Animation
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Heart Scale Animation
  const heartScaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 35,
      bounciness: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 35,
      bounciness: 3,
    }).start();
  };

  const handleBookmark = () => {
    if (!onSave) return;
    if (!saved) {
      triggerNotification();
    } else {
      triggerSelection();
    }

    // Micro-bounce on heart icon
    Animated.sequence([
      Animated.timing(heartScaleAnim, {
        toValue: 1.35,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(heartScaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    onSave();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        style={styles.card}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {/* Editorial Photography Header */}
        <View style={styles.imageContainer}>
          {!imageError ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.imageFallback, { backgroundColor: accentColor }]}>
              <Text style={styles.fallbackText}>{recipe.cuisine.toUpperCase()}</Text>
            </View>
          )}

          {/* Cuisine Tag Pill */}
          <View style={styles.cuisinePill}>
            <Text style={styles.cuisinePillText}>{recipe.cuisine}</Text>
          </View>

          {/* Animated Bookmark Heart Action */}
          {onSave && (
            <Pressable
              style={styles.saveBtn}
              onPress={handleBookmark}
              hitSlop={12}
            >
              <Animated.View style={{ transform: [{ scale: heartScaleAnim }] }}>
                <Heart
                  size={18}
                  color={saved ? Colors.error : Colors.textPrimary}
                  fill={saved ? Colors.error : 'transparent'}
                />
              </Animated.View>
            </Pressable>
          )}
        </View>

        {/* Editorial Content Body */}
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={compact ? 1 : 2}>
            {recipe.name}
          </Text>

          {!compact && recipe.description ? (
            <Text style={styles.desc} numberOfLines={2}>
              {recipe.description}
            </Text>
          ) : null}

          {/* Understated Meta Bar */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={13} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{recipe.total_min} min</Text>
            </View>

            <Text style={styles.metaDot}>·</Text>

            <View style={styles.metaItem}>
              <Flame size={13} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{recipe.calories} kcal</Text>
            </View>

            <Text style={styles.metaDot}>·</Text>

            <View style={styles.metaItem}>
              <BarChart2 size={13} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{recipe.difficulty}</Text>
            </View>
          </View>

          {recipe.labels && recipe.labels.length > 0 && !compact && (
            <View style={styles.labelsRow}>
              {recipe.labels.slice(0, 2).map((label) => (
                <View key={label} style={styles.labelChip}>
                  <Text style={styles.labelText}>{label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.card,
  },
  imageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
    backgroundColor: Colors.backgroundSage,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.backgroundWhite,
    letterSpacing: 1.5,
  },
  cuisinePill: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  cuisinePillText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  saveBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  body: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  name: {
    fontSize: FontSize.md + 1,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    lineHeight: (FontSize.md + 1) * 1.3,
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: FontSize.xs + 1,
    color: Colors.textSecondary,
    lineHeight: (FontSize.xs + 1) * 1.45,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xxs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDot: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  labelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  labelChip: {
    backgroundColor: Colors.backgroundWarm,
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  labelText: {
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
});
