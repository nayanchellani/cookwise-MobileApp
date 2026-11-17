
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
import { User, Plus, X, SlidersHorizontal, Check } from 'lucide-react-native';
import { Colors } from '../../src/constants/colors';
import { Spacing, Radius, FontSize, FontWeight, Typography, Shadows } from '../../src/constants/theme';
import { useAppStore } from '../../src/store/appStore';
import type { DietaryPreference } from '../../src/types/api';

const DIET_OPTIONS: DietaryPreference[] = ['Vegetarian', 'Vegan', 'Non-vegetarian'];
const CUISINE_OPTIONS = ['Any', 'Indian', 'Italian', 'Mexican', 'Asian', 'Mediterranean'];
const SERVING_OPTIONS = [1, 2, 3, 4, 5, 6];

export default function ProfileScreen() {
  const { state, dispatch } = useAppStore();
  const { profile } = state;
  const [allergyInput, setAllergyInput] = useState('');

  function addAllergy() {
    const trimmed = allergyInput.trim();
    if (!trimmed || profile.allergies.includes(trimmed)) return;
    dispatch({
      type: 'UPDATE_PROFILE',
      profile: { allergies: [...profile.allergies, trimmed] },
    });
    setAllergyInput('');
  }

  function removeAllergy(a: string) {
    dispatch({
      type: 'UPDATE_PROFILE',
      profile: { allergies: profile.allergies.filter((x) => x !== a) },
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <User size={26} color={Colors.primary} strokeWidth={1.75} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Taste & Kitchen Profile</Text>
            <Text style={styles.subtitle}>Preferences calibrate Gemini recipe generation</Text>
          </View>
        </View>

        {/* 1. Dietary Preference Segmented Bar */}
        <View style={styles.settingSection}>
          <Text style={styles.sectionLabel}>DIETARY FRAMEWORK</Text>
          <View style={styles.segmentedContainer}>
            {DIET_OPTIONS.map((d) => {
              const active = profile.dietaryPreference === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() =>
                    dispatch({ type: 'UPDATE_PROFILE', profile: { dietaryPreference: d } })
                  }
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

        {/* 2. Cuisine Affinity Grid */}
        <View style={styles.settingSection}>
          <Text style={styles.sectionLabel}>PRIMARY CUISINE AFFINITY</Text>
          <View style={styles.chipGrid}>
            {CUISINE_OPTIONS.map((c) => {
              const val = c === 'Any' ? null : c;
              const active = profile.preferredCuisine === val;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() =>
                    dispatch({ type: 'UPDATE_PROFILE', profile: { preferredCuisine: val } })
                  }
                  activeOpacity={0.8}
                >
                  {active && <Check size={13} color={Colors.backgroundWhite} strokeWidth={2.5} />}
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Default Household Servings */}
        <View style={styles.settingSection}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>DEFAULT PORTIONS</Text>
            <Text style={styles.labelValue}>{profile.defaultServings} servings</Text>
          </View>
          <View style={styles.servingsRow}>
            {SERVING_OPTIONS.map((n) => {
              const active = profile.defaultServings === n;
              return (
                <TouchableOpacity
                  key={n}
                  style={[styles.servingBtn, active && styles.servingBtnActive]}
                  onPress={() =>
                    dispatch({ type: 'UPDATE_PROFILE', profile: { defaultServings: n } })
                  }
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

        {/* 4. Allergies & Intolerances */}
        <View style={styles.settingSection}>
          <Text style={styles.sectionLabel}>ALLERGIES & RESTRICTIONS</Text>
          <View style={styles.allergyInputRow}>
            <TextInput
              style={styles.allergyInput}
              placeholder="Add intolerance (e.g. Peanuts, Shellfish)…"
              placeholderTextColor={Colors.textSecondary}
              value={allergyInput}
              onChangeText={setAllergyInput}
              onSubmitEditing={addAllergy}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.addBtn}
              onPress={addAllergy}
              activeOpacity={0.8}
            >
              <Plus size={16} color={Colors.backgroundWhite} />
            </TouchableOpacity>
          </View>

          {profile.allergies.length > 0 ? (
            <View style={styles.tagWrap}>
              {profile.allergies.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={styles.allergyTag}
                  onPress={() => removeAllergy(a)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.allergyTagText}>{a}</Text>
                  <X size={12} color={Colors.error} strokeWidth={2.5} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.noAllergiesText}>No allergies or dietary restrictions recorded.</Text>
          )}
        </View>

        {/* Storage status disclaimer */}
        <View style={styles.footerNotice}>
          <SlidersHorizontal size={14} color={Colors.textSecondary} />
          <Text style={styles.footerText}>
            Stored locally on your device. Applied automatically during image scanning & recipe creation.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },

  // Header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.backgroundSage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerText: { flex: 1 },
  title: {
    ...Typography.h2,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Sections
  settingSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  sectionLabel: {
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

  // Chip grid
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

  // Servings row
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

  // Allergies
  allergyInputRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  allergyInput: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 3,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  allergyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(201, 75, 75, 0.08)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(201, 75, 75, 0.25)',
  },
  allergyTagText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    fontWeight: FontWeight.medium,
  },
  noAllergiesText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Footer
  footerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  footerText: {
    flex: 1,
    fontSize: FontSize.xxs + 1,
    color: Colors.textSecondary,
    lineHeight: (FontSize.xxs + 1) * 1.5,
  },
});
