
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, RefreshCw, ShoppingCart, CheckCircle2, Circle, AlertCircle } from 'lucide-react-native';
import { Colors } from '../../src/constants/colors';
import { Spacing, Radius, FontSize, FontWeight, Typography, Shadows } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { LoadingState } from '../../src/components/LoadingState';
import { EmptyState } from '../../src/components/EmptyState';
import { useAppStore } from '../../src/store/appStore';
import { generateGroceryList } from '../../src/api/grocery';
import { extractErrorMessage } from '../../src/api/client';
import type { GroceryItem } from '../../src/types/api';

export default function GroceryListScreen() {
  const { state, dispatch } = useAppStore();
  const { currentMealPlan, groceryItems } = state;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFetchGrocery() {
    if (!currentMealPlan) {
      Alert.alert('No Meal Plan', 'Create a weekly plan first before synthesizing your grocery list.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await generateGroceryList({
        plan: currentMealPlan,
        have: [],
      });

      dispatch({ type: 'SET_GROCERY_ITEMS', items: res.items });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const purchasedCount = groceryItems.filter((i) => i.purchased).length;
  const totalCount = groceryItems.length;

  // Group items by category
  const categorized: Record<string, GroceryItem[]> = {};
  for (const item of groceryItems) {
    const cat = item.category || 'General Pantry';
    if (!categorized[cat]) categorized[cat] = [];
    categorized[cat].push(item);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingState
          message="Consolidating kitchen ingredients…"
          submessage="Combining shared pantry units and structuring items by aisle."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={10}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.title}>Consolidated Grocery List</Text>
          <Text style={styles.subtitle}>
            {totalCount > 0
              ? `${purchasedCount} of ${totalCount} items gathered`
              : 'Ingredient compilation from meal plan'}
          </Text>
        </View>

        {totalCount > 0 && (
          <TouchableOpacity
            onPress={handleFetchGrocery}
            style={styles.refreshBtn}
            hitSlop={10}
            activeOpacity={0.8}
          >
            <RefreshCw size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {totalCount === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={<ShoppingCart size={28} color={Colors.primary} />}
              title="No active shopping list"
              message={
                currentMealPlan
                  ? 'Your weekly plan is ready. Synthesize a structured shopping list organized by grocery aisle.'
                  : 'Formulate a meal plan first to compile an ingredient list.'
              }
              actionLabel={currentMealPlan ? 'Compile Grocery List' : 'Open Meal Planner'}
              onAction={currentMealPlan ? handleFetchGrocery : () => router.push('/plan')}
            />
          </View>
        ) : (
          <>
            {/* Usability Progress Bar */}
            <View style={styles.progressBarWrapper}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: totalCount > 0 ? `${(purchasedCount / totalCount) * 100}%` : '0%' },
                ]}
              />
            </View>

            {/* Categorized Ingredient Checklist */}
            {Object.keys(categorized).map((category) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>

                <View style={styles.tableCard}>
                  {categorized[category].map((item, index) => {
                    const isLast = index === categorized[category].length - 1;
                    return (
                      <TouchableOpacity
                        key={item.name}
                        style={[styles.itemRow, isLast && styles.itemRowLast]}
                        onPress={() => dispatch({ type: 'TOGGLE_GROCERY_ITEM', name: item.name })}
                        activeOpacity={0.7}
                      >
                        {item.purchased ? (
                          <CheckCircle2 size={18} color={Colors.primary} strokeWidth={2} />
                        ) : (
                          <Circle size={18} color={Colors.border} strokeWidth={1.75} />
                        )}

                        <Text
                          style={[styles.itemName, item.purchased && styles.itemNamePurchased]}
                        >
                          {item.name}
                        </Text>

                        <Text
                          style={[styles.itemQty, item.purchased && styles.itemQtyPurchased]}
                        >
                          {item.quantity} {item.unit}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
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
  refreshBtn: {
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
  title: { ...Typography.h2, fontSize: FontSize.lg, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySm, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },

  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  emptyContainer: { flex: 1, marginTop: Spacing.xl },

  // Progress Bar
  progressBarWrapper: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },

  // Category
  categorySection: {
    gap: Spacing.xs,
  },
  categoryTitle: {
    ...Typography.label,
    marginLeft: 2,
  },
  tableCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: Spacing.sm,
  },
  itemRowLast: {
    borderBottomWidth: 0,
  },
  itemName: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  itemNamePurchased: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  itemQty: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  itemQtyPurchased: {
    opacity: 0.5,
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
