
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Calendar, ShoppingBag, Sparkles, AlertCircle, Check, DollarSign } from 'lucide-react-native';
import { Colors } from '../../src/constants/colors';
import { Spacing, Radius, FontSize, FontWeight, Typography, Shadows } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { LoadingState } from '../../src/components/LoadingState';
import { generateMealPlan } from '../../src/api/mealPlanner';
import { extractErrorMessage } from '../../src/api/client';
import { useAppStore } from '../../src/store/appStore';
import type { MealPlanRequest, Slot } from '../../src/types/api';

type Diet = 'Vegetarian' | 'Vegan' | 'Non-vegetarian';
const DAYS_OPTIONS = [3, 5, 7] as const;
const BUDGET_OPTIONS = [50, 75, 100, 150] as const;
const DIET_OPTIONS: Diet[] = ['Vegetarian', 'Vegan', 'Non-vegetarian'];
const SLOT_OPTIONS: Slot[] = ['breakfast', 'lunch', 'dinner'];

export default function PlanScreen() {
  const { state, dispatch } = useAppStore();
  const [days, setDays] = useState<number>(7);
  const [budget, setBudget] = useState<number>(75);
  const [diet, setDiet] = useState<Diet>(state.profile.dietaryPreference as Diet);
  const [slots, setSlots] = useState<Slot[]>(['breakfast', 'lunch', 'dinner']);
  const [servings, setServings] = useState(state.profile.defaultServings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plan = state.currentMealPlan;

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const req: MealPlanRequest = { days, budget, diet, meals: slots, servings, country: 'US' };
      const result = await generateMealPlan(req);
      dispatch({ type: 'SET_MEAL_PLAN', plan: result });
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
          message="Constructing weekly schedule…"
          submessage="Gemini is balancing culinary variety, caloric guidelines, and grocery efficiency."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Culinary Plan</Text>
          <Text style={styles.subtitle}>Budget-conscious meal curation by AI</Text>
        </View>

        {/* Configuration Card */}
        <View style={styles.configCard}>
          {/* Schedule Duration */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>SCHEDULE DURATION</Text>
            <View style={styles.segmentedRow}>
              {DAYS_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.segmentBtn, days === d && styles.segmentBtnActive]}
                  onPress={() => setDays(d)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, days === d && styles.segmentTextActive]}>
                    {d} Days
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Budget Limit */}
          <View style={styles.fieldBlock}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>TARGET GROCERY BUDGET</Text>
              <Text style={styles.labelValue}>${budget} USD</Text>
            </View>
            <View style={styles.chipsRow}>
              {BUDGET_OPTIONS.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[styles.chip, budget === b && styles.chipActive]}
                  onPress={() => setBudget(b)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, budget === b && styles.chipTextActive]}>
                    ${b}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dietary Framework */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>DIETARY FRAMEWORK</Text>
            <View style={styles.chipsRow}>
              {DIET_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, diet === d && styles.chipActive]}
                  onPress={() => setDiet(d)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, diet === d && styles.chipTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Meal Slots */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>SCHEDULED DAILY MEALS</Text>
            <View style={styles.chipsRow}>
              {SLOT_OPTIONS.map((s) => {
                const selected = slots.includes(s);
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, selected && styles.chipActive]}
                    onPress={() =>
                      setSlots(
                        selected ? slots.filter((x) => x !== s) : [...slots, s],
                      )
                    }
                    activeOpacity={0.8}
                  >
                    {selected && <Check size={12} color={Colors.backgroundWhite} strokeWidth={2.5} />}
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Servings */}
          <View style={styles.fieldBlock}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>HOUSEHOLD PORTIONS</Text>
              <Text style={styles.labelValue}>{servings} servings</Text>
            </View>
            <View style={styles.chipsRow}>
              {[1, 2, 3, 4].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.chipMini, servings === n && styles.chipMiniActive]}
                  onPress={() => setServings(n)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, servings === n && styles.chipTextActive]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton
          title="Synthesize Weekly Plan"
          icon={<Sparkles size={16} color={Colors.backgroundWhite} />}
          onPress={handleGenerate}
          size="lg"
        />

        {/* Formulated Plan Overview */}
        {plan && (
          <View style={styles.planSection}>
            <View style={styles.planSummaryCard}>
              <View style={styles.planSummaryMain}>
                <Text style={styles.planCostTitle}>
                  Est. Cost: {plan.currency} {plan.total_est_cost.toFixed(2)}
                </Text>
                <Text style={[styles.planBudgetStatus, plan.over_budget && styles.overBudgetStatus]}>
                  Budget: {plan.currency} {plan.budget} {plan.over_budget ? '(Exceeded)' : '(On Budget)'}
                </Text>
                {plan.note ? <Text style={styles.planNote}>{plan.note}</Text> : null}
              </View>

              <TouchableOpacity
                style={styles.groceryBtn}
                onPress={() => router.push('/plan/grocery')}
                activeOpacity={0.85}
              >
                <ShoppingBag size={16} color={Colors.primary} />
                <Text style={styles.groceryBtnText}>Grocery List</Text>
              </TouchableOpacity>
            </View>

            {/* Daily Breakdown */}
            {plan.days.map((dayOut) => (
              <View key={dayOut.day} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>Day {dayOut.day}</Text>
                  <Text style={styles.daySummary}>
                    {dayOut.calories} kcal · {plan.currency} {dayOut.est_cost.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.mealsList}>
                  {dayOut.meals.map((meal) => (
                    <View key={meal.slot} style={styles.mealRow}>
                      <View style={styles.slotBadge}>
                        <Text style={styles.slotText}>{meal.slot.toUpperCase()}</Text>
                      </View>

                      <View style={styles.mealInfo}>
                        <Text style={styles.mealName}>{meal.name}</Text>
                        <Text style={styles.mealMeta}>
                          {meal.calories} kcal · {plan.currency} {meal.est_cost.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },

  // Header
  header: {
    gap: 2,
    marginBottom: Spacing.xs,
  },
  title: { ...Typography.h2, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySm, color: Colors.textSecondary },

  // Config Card
  configCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.subtle,
  },
  fieldBlock: {
    gap: Spacing.xs,
  },
  fieldLabel: {
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

  // Segmented row
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundWarm,
    borderRadius: Radius.sm,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.xs,
  },
  segmentBtnActive: {
    backgroundColor: Colors.surface,
    ...Shadows.subtle,
  },
  segmentText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  segmentTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },

  // Chips
  chipsRow: {
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
  chipMini: {
    width: 44,
    paddingVertical: Spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    backgroundColor: Colors.backgroundWarm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipMiniActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  // Plan Results
  planSection: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  planSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSage,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(36, 92, 67, 0.15)',
  },
  planSummaryMain: { flex: 1, gap: 2 },
  planCostTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  planBudgetStatus: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: FontWeight.medium,
  },
  overBudgetStatus: {
    color: Colors.warning,
  },
  planNote: {
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  groceryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groceryBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },

  // Day Card
  dayCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  dayTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  daySummary: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  mealsList: {
    gap: Spacing.sm,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  slotBadge: {
    width: 68,
    backgroundColor: Colors.backgroundWarm,
    borderRadius: Radius.xs,
    paddingVertical: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slotText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  mealInfo: { flex: 1 },
  mealName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  mealMeta: {
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
});
