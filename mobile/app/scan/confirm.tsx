
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, X, Camera, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { Colors } from '../../src/constants/colors';
import { Spacing, Radius, FontSize, FontWeight, Typography, Shadows } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { EmptyState } from '../../src/components/EmptyState';
import { useAppStore } from '../../src/store/appStore';
import type { IngredientDetection } from '../../src/types/api';

function confidenceLabel(c: number): { label: string; color: string } {
  if (c >= 0.8) return { label: 'High confidence', color: Colors.success };
  if (c >= 0.5) return { label: 'Moderate', color: Colors.warning };
  return { label: 'Inferred', color: Colors.textSecondary };
}

export default function ConfirmScreen() {
  const { state, dispatch } = useAppStore();
  const [items, setItems] = useState<IngredientDetection[]>(state.detectedIngredients);
  const [addInput, setAddInput] = useState('');

  function removeItem(name: string) {
    setItems((prev) => prev.filter((i) => i.name !== name));
  }

  function addItem() {
    const name = addInput.trim();
    if (!name) return;
    if (items.some((i) => i.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Already Listed', `${name} is already part of your detected ingredients.`);
      return;
    }
    const newItem: IngredientDetection = {
      name,
      confidence: 1.0,
      estimated_quantity: null,
      category: null,
    };
    setItems((prev) => [...prev, newItem]);
    setAddInput('');
  }

  function handleFindRecipes() {
    if (items.length === 0) {
      Alert.alert('No Ingredients', 'Please include at least one ingredient to generate recipes.');
      return;
    }
    dispatch({ type: 'SET_CONFIRMED', ingredients: items.map((i) => i.name) });
    router.push('/scan/preferences');
  }

  if (state.detectedIngredients.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          icon={<Camera size={28} color={Colors.primary} />}
          title="No scan records"
          message="Capture an image of your kitchen elements first."
          actionLabel="Scan Ingredients"
          onAction={() => router.push('/scan')}
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
            <Text style={styles.title}>Review Ingredients</Text>
            <Text style={styles.subtitle}>Confirm or modify what Gemini Vision detected</Text>
          </View>
        </View>

        {/* Ingredient Table / Rows */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderLabel}>DETECTED ELEMENTS ({items.length})</Text>
          </View>

          {items.map((item, index) => {
            const conf = confidenceLabel(item.confidence);
            const isLast = index === items.length - 1;
            return (
              <View key={item.name} style={[styles.itemRow, isLast && styles.itemRowLast]}>
                <View style={styles.itemBullet}>
                  <CheckCircle2 size={15} color={Colors.primary} strokeWidth={2} />
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.itemMetaRow}>
                    {item.estimated_quantity && (
                      <Text style={styles.itemQty}>{item.estimated_quantity}</Text>
                    )}
                    {item.estimated_quantity && item.category && (
                      <Text style={styles.metaDot}>·</Text>
                    )}
                    {item.category && <Text style={styles.itemCat}>{item.category}</Text>}
                  </View>
                </View>

                <View style={styles.itemActions}>
                  <Text style={[styles.confText, { color: conf.color }]}>{conf.label}</Text>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeItem(item.name)}
                    hitSlop={8}
                    activeOpacity={0.7}
                  >
                    <X size={15} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Add manual item */}
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="Add missing ingredient (e.g. Olive oil)…"
            placeholderTextColor={Colors.textSecondary}
            value={addInput}
            onChangeText={setAddInput}
            onSubmitEditing={addItem}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={addItem} activeOpacity={0.8}>
            <Plus size={16} color={Colors.backgroundWhite} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Primary Action Button */}
        <PrimaryButton
          title={`Find Recipes with ${items.length} Ingredients`}
          icon={<Sparkles size={16} color={Colors.backgroundWhite} />}
          onPress={handleFindRecipes}
          size="lg"
          disabled={items.length === 0}
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

  // Table Card
  tableCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  tableHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundWarm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableHeaderLabel: {
    ...Typography.label,
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
  itemBullet: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FontSize.sm + 1,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  itemQty: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  metaDot: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  itemCat: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  confText: {
    fontSize: FontSize.xxs + 1,
    fontWeight: FontWeight.medium,
  },
  removeBtn: {
    padding: 4,
  },

  // Add Item
  addRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  addInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtn: {
    marginTop: Spacing.xs,
  },
});
