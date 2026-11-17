import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  Clock,
  Flame,
  Users,
  CheckCircle2,
  Circle,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/colors';
import { Spacing, Radius, FontSize, FontWeight, Typography, Shadows } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { getRecipeImage } from '../../src/constants/images';
import { EDITORIAL_RECIPES } from '../../src/constants/editorialRecipes';
import { useAppStore } from '../../src/store/appStore';
import { triggerNotification, triggerSelection } from '../../src/utils/haptics';
import type { Recipe } from '../../src/types/api';

export default function RecipeDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { name } = useLocalSearchParams<{ name: string }>();
  const { state, dispatch } = useAppStore();

  const recipe: Recipe | undefined =
    state.recipeResults.find((r) => r.name === name) ||
    state.savedRecipes.find((r) => r.name === name) ||
    EDITORIAL_RECIPES.find((r) => r.name === name);

  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const heartScaleAnim = useRef(new Animated.Value(1)).current;

  if (!recipe) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Recipe Unavailable</Text>
          <Text style={styles.errorMsg}>We could not retrieve the recipe details for this dish.</Text>
          <PrimaryButton title="Return to Discovery" onPress={() => router.back()} size="md" />
        </View>
      </SafeAreaView>
    );
  }

  const isSaved = state.savedRecipes.some((r) => r.name === recipe.name);
  const imageUrl = getRecipeImage(recipe.cuisine, recipe.name);

  function toggleSave() {
    if (!recipe) return;
    if (!isSaved) {
      triggerNotification();
    } else {
      triggerSelection();
    }

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

    if (isSaved) {
      dispatch({ type: 'UNSAVE_RECIPE', name: recipe.name });
    } else {
      dispatch({ type: 'SAVE_RECIPE', recipe });
    }
  }

  function toggleIngredient(idx: number) {
    triggerSelection();
    setCheckedIngredients((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  const preppedCount = Object.values(checkedIngredients).filter(Boolean).length;
  const progressRatio = recipe.ingredients.length > 0 ? preppedCount / recipe.ingredients.length : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.topBar, { top: Math.max(insets.top, 14) + 6 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.circleBtn}
          hitSlop={10}
          activeOpacity={0.8}
        >
          <ArrowLeft size={18} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.topActions}>
          <Pressable
            onPress={toggleSave}
            style={[styles.circleBtn, isSaved && styles.savedCircleActive]}
            hitSlop={10}
          >
            <Animated.View style={{ transform: [{ scale: heartScaleAnim }] }}>
              <Heart
                size={18}
                color={isSaved ? Colors.error : Colors.textPrimary}
                fill={isSaved ? Colors.error : 'transparent'}
              />
            </Animated.View>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrapper}>
          <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.cuisineTag}>
            <Text style={styles.cuisineTagText}>{recipe.cuisine.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.headingSection}>
          <Text style={styles.title}>{recipe.name}</Text>
          {recipe.description ? <Text style={styles.desc}>{recipe.description}</Text> : null}

          <View style={styles.metricsBar}>
            <View style={styles.metricItem}>
              <View style={styles.metricIconWrap}>
                <Clock size={16} color={Colors.primary} />
              </View>
              <Text style={styles.metricPrimary}>{recipe.total_min} min</Text>
              <Text style={styles.metricSecondary} numberOfLines={1}>
                {recipe.prep_min > 0 ? `${recipe.prep_min}m prep · ${recipe.cook_min}m cook` : 'Total cook'}
              </Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <View style={styles.metricIconWrap}>
                <Flame size={16} color={Colors.primary} />
              </View>
              <Text style={styles.metricPrimary}>{recipe.calories} kcal</Text>
              <Text style={styles.metricSecondary} numberOfLines={1}>per serving</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <View style={styles.metricIconWrap}>
                <Users size={16} color={Colors.primary} />
              </View>
              <Text style={styles.metricPrimary}>{recipe.servings} portions</Text>
              <Text style={styles.metricSecondary} numberOfLines={1}>{recipe.difficulty || 'Easy'}</Text>
            </View>
          </View>

          {recipe.macros && (
            <View style={styles.macroCard}>
              <Text style={styles.macroHeading}>ESTIMATED NUTRITIONAL PROFILE</Text>
              <View style={styles.macroRow}>
                <View style={styles.macroBox}>
                  <Text style={styles.macroValue}>{recipe.macros.protein_g}g</Text>
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={styles.macroValue}>{recipe.macros.carbs_g}g</Text>
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={styles.macroValue}>{recipe.macros.fat_g}g</Text>
                  <Text style={styles.macroLabel}>Lipids</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionHeading}>Ingredients</Text>
              <Text style={styles.sectionCount}>
                {preppedCount} of {recipe.ingredients.length} prepped
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressRatio * 100}%` },
                ]}
              />
            </View>

            <View style={styles.cardWrapper}>
              {recipe.ingredients.map((ing, idx) => {
                const checked = !!checkedIngredients[idx];
                const isLast = idx === recipe.ingredients.length - 1;
                return (
                  <TouchableOpacity
                    key={`${ing.name}-${idx}`}
                    style={[styles.ingRow, isLast && styles.ingRowLast]}
                    onPress={() => toggleIngredient(idx)}
                    activeOpacity={0.7}
                  >
                    {checked ? (
                      <CheckCircle2 size={18} color={Colors.primary} strokeWidth={2} />
                    ) : (
                      <Circle size={18} color={Colors.border} strokeWidth={1.75} />
                    )}

                    <Text style={[styles.ingName, checked && styles.ingNameChecked]}>
                      {ing.name}
                    </Text>

                    {ing.quantity > 0 && (
                      <Text style={[styles.ingAmount, checked && styles.ingAmountChecked]}>
                        {ing.quantity} {ing.unit}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>Preparation & Instructions</Text>

            <View style={styles.stepsWrapper}>
              {recipe.steps.map((step, idx) => (
                <View key={`step-${idx}`} style={styles.stepItem}>
                  <View style={styles.stepIndexBadge}>
                    <Text style={styles.stepIndexText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  savedCircleActive: {
    borderColor: 'rgba(201, 75, 75, 0.3)',
  },
  topActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  heroWrapper: {
    height: 250,
    width: '100%',
    position: 'relative',
    backgroundColor: Colors.backgroundSage,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  cuisineTag: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.lg,
    backgroundColor: 'rgba(32, 40, 32, 0.85)',
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
  },
  cuisineTagText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    color: Colors.backgroundWhite,
    letterSpacing: 1,
  },
  headingSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    fontSize: FontSize.xxl,
    color: Colors.textPrimary,
  },
  desc: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: FontSize.md * 1.5,
    marginTop: -Spacing.xs,
  },

  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    ...Shadows.subtle,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    gap: 3,
  },
  metricIconWrap: {
    marginBottom: 1,
  },
  metricPrimary: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  metricSecondary: {
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },

  macroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  macroHeading: {
    ...Typography.label,
  },
  macroRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  macroBox: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
    borderRadius: Radius.xs,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  macroValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  macroLabel: {
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  sectionContainer: {
    gap: Spacing.sm,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionHeading: {
    ...Typography.h2,
    fontSize: FontSize.md + 1,
  },
  sectionCount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  progressTrack: {
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.backgroundSage,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  cardWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: Spacing.sm,
  },
  ingRowLast: {
    borderBottomWidth: 0,
  },
  ingName: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  ingNameChecked: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  ingAmount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  ingAmountChecked: {
    opacity: 0.5,
  },

  stepsWrapper: {
    gap: Spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.subtle,
  },
  stepIndexBadge: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    backgroundColor: Colors.backgroundWarm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepIndexText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  stepText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: FontSize.sm * 1.6,
  },

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorTitle: { ...Typography.h2 },
  errorMsg: { ...Typography.bodySm, textAlign: 'center' },
});
