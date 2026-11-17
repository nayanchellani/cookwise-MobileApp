
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Sparkles, Check, X, Clock, Flame } from 'lucide-react-native';
import { Colors } from '../../src/constants/colors';
import { Spacing, Radius, FontSize, FontWeight, Typography, Shadows } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { LoadingState } from '../../src/components/LoadingState';
import { useAppStore } from '../../src/store/appStore';
import { recipesFromIngredients } from '../../src/api/recipes';
import { extractErrorMessage } from '../../src/api/client';
import type { DietaryPreference } from '../../src/types/api';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
const DIET_OPTS: DietaryPreference[] = ['Vegetarian', 'Vegan', 'Non-vegetarian'];
const CUISINE_OPTS = ['Any', 'Indian', 'Italian', 'Mexican', 'Asian', 'Mediterranean'];
const TIME_OPTS = [15, 30, 45, 60] as const;
const DIFF_OPTS: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const SERVING_OPTS = [1, 2, 3, 4, 5, 6] as const;

export default function PreferencesScreen() {
  const { state, dispatch } = useAppStore();
  const { profile } = state;

  const [diet, setDiet] = useState<DietaryPreference>(profile.dietaryPreference);
  const [cuisine, setCuisine] = useState<string>(profile.preferredCuisine ?? 'Any');
  const [time, setTime] = useState<number>(30);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [servings, setServings] = useState<number>(profile.defaultServings);
  const [allergyInput, setAllergyInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([...profile.allergies]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (state.confirmedIngredients.length === 0) {
      setError('No confirmed ingredients. Please return and scan or confirm items.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const result = await recipesFromIngredients({
        ingredients: state.confirmedIngredients,
        dietary_preference: diet,
        cuisine: cuisine === 'Any' ? null : cuisine,
        cooking_time: time,
        difficulty,
        servings,
        allergies,
      });
      dispatch({ type: 'SET_RECIPE_RESULTS', recipes: result.recipes, notice: result.notice });
      router.push('/recipes/results');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingState
          message="Gemini is crafting bespoke recipes…"
          submessage="Balancing flavor profiles, nutritional balance, and cooking constraints from your ingredients."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Navigation & Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={10}
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Recipe Parameters</Text>
            <Text style={styles.subtitle}>
              Tailoring output for {state.confirmedIngredients.length} confirmed ingredients
            </Text>
          </View>
        </View>

        {/* 1. Dietary Preference */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DIETARY FRAMEWORK</Text>
          <View style={styles.segmentedContainer}>
            {DIET_OPTS.map((d) => {
              const active = diet === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => setDiet(d)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. Cuisine Direction */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>CUISINE INSPIRATION</Text>
          <View style={styles.chipGrid}>
            {CUISINE_OPTS.map((c) => {
              const active = cuisine === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCuisine(c)}
                  activeOpacity={0.8}
                >
                  {active && <Check size={13} color={Colors.backgroundWhite} strokeWidth={2.5} />}
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Prep Time & Complexity */}
        <View style={styles.card}>
          <View style={styles.dualHeaderRow}>
            <Text style={styles.cardLabel}>MAX TIME: {time} MIN</Text>
            <Text style={styles.cardLabel}>DIFFICULTY</Text>
          </View>

          <View style={styles.dualRow}>
            {/* Time Chips */}
            <View style={styles.halfChips}>
              {TIME_OPTS.map((t) => {
                const active = time === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.miniChip, active && styles.miniChipActive]}
                    onPress={() => setTime(t)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.miniChipText, active && styles.miniChipTextActive]}>
                      {t}m
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Difficulty Chips */}
            <View style={styles.halfChips}>
              {DIFF_OPTS.map((df) => {
                const active = difficulty === df;
                return (
                  <TouchableOpacity
                    key={df}
                    style={[styles.miniChip, active && styles.miniChipActive]}
                    onPress={() => setDifficulty(df)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.miniChipText, active && styles.miniChipTextActive]}>
                      {df}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 4. Servings Selection */}
        <View style={styles.card}>
          <View style={styles.labelRow}>
            <Text style={styles.cardLabel}>PORTIONS</Text>
            <Text style={styles.labelValue}>{servings} servings</Text>
          </View>
          <View style={styles.servingsRow}>
            {SERVING_OPTS.map((n) => {
              const active = servings === n;
              return (
                <TouchableOpacity
                  key={n}
                  style={[styles.servingBtn, active && styles.servingBtnActive]}
                  onPress={() => setServings(n)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.servingText, active && styles.servingTextActive]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Error message */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Primary CTA */}
        <PrimaryButton
          title="Generate Recipes"
          icon={<Sparkles size={16} color={Colors.backgroundWhite} />}
          onPress={handleGenerate}
          size="lg"
          style={styles.ctaBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: {
    ...Typography.h2,
    fontSize: FontSize.lg + 1,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodySm,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  cardLabel: {
    ...Typography.label,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelValue: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },

  // Segmented control
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundWarm,
    borderRadius: Radius.sm,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.xs,
  },
  segmentActive: {
    backgroundColor: Colors.surface,
    ...Shadows.subtle,
  },
  segmentText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },

  // Chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.sm,
    backgroundColor: Colors.backgroundWarm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  chipTextActive: {
    color: Colors.backgroundWhite,
  },

  // Dual Row (Time & Difficulty)
  dualHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dualRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfChips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  miniChip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.sm,
    backgroundColor: Colors.backgroundWarm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  miniChipText: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  miniChipTextActive: {
    color: Colors.backgroundWhite,
  },

  // Servings Row
  servingsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  servingBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: Colors.backgroundWarm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  servingText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  servingTextActive: {
    color: Colors.backgroundWhite,
    fontWeight: FontWeight.bold,
  },

  // Error
  errorBox: {
    backgroundColor: 'rgba(201, 75, 75, 0.08)',
    borderRadius: Radius.sm,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
  },

  ctaBtn: {
    marginTop: Spacing.xs,
  },
});
