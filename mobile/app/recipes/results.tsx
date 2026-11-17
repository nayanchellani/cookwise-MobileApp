
import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Sparkles, SlidersHorizontal, BookOpen } from 'lucide-react-native';
import { Colors } from '../../src/constants/colors';
import { Spacing, Radius, FontSize, FontWeight, Typography, Shadows } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { RecipeCard } from '../../src/components/RecipeCard';
import { EmptyState } from '../../src/components/EmptyState';
import { useAppStore } from '../../src/store/appStore';
import type { Recipe } from '../../src/types/api';

export default function RecipeResultsScreen() {
  const { state, dispatch } = useAppStore();
  const { recipeResults, recipeNotice } = state;

  function toggleSave(recipe: Recipe) {
    const isSaved = state.savedRecipes.some((r) => r.name === recipe.name);
    if (isSaved) {
      dispatch({ type: 'UNSAVE_RECIPE', name: recipe.name });
    } else {
      dispatch({ type: 'SAVE_RECIPE', recipe });
    }
  }

  if (!recipeResults || recipeResults.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          icon={<BookOpen size={28} color={Colors.primary} />}
          title="No recipes formulated"
          message="We could not derive recipes from the selected ingredients. Try scanning again or expanding your pantry."
          actionLabel="Scan Ingredients"
          onAction={() => router.push('/scan')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={10}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.title}>Curated Creations</Text>
          <Text style={styles.subtitle}>
            {recipeResults.length} bespoke recipes derived from your ingredients
          </Text>
        </View>
      </View>

      
      {recipeNotice ? (
        <View style={styles.noticeBox}>
          <Sparkles size={14} color={Colors.accent} />
          <Text style={styles.noticeText}>{recipeNotice}</Text>
        </View>
      ) : null}

      <FlatList
        data={recipeResults}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSaved = state.savedRecipes.some((r) => r.name === item.name);
          return (
            <RecipeCard
              recipe={item}
              onPress={() =>
                router.push({ pathname: '/recipes/details', params: { name: item.name } })
              }
              onSave={() => toggleSave(item)}
              saved={isSaved}
              style={styles.cardSpacing}
            />
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <PrimaryButton
              title="Adjust Parameters"
              icon={<SlidersHorizontal size={14} color={Colors.textPrimary} />}
              variant="outline"
              onPress={() => router.back()}
              size="md"
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
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
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.backgroundSage,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    padding: Spacing.sm + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(36, 92, 67, 0.1)',
  },
  noticeText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    lineHeight: FontSize.xs * 1.45,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl,
  },
  cardSpacing: {
    marginBottom: Spacing.md,
  },
  footer: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
});
