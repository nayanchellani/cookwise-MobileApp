// Saved recipes tab — Editorial Collection Redesign
import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, X, Bookmark, Camera } from 'lucide-react-native';
import { Colors } from '../../src/constants/colors';
import { Spacing, Radius, FontSize, FontWeight, Typography, Shadows } from '../../src/constants/theme';
import { EmptyState } from '../../src/components/EmptyState';
import { RecipeCard } from '../../src/components/RecipeCard';
import { useAppStore } from '../../src/store/appStore';

export default function SavedScreen() {
  const { state, dispatch } = useAppStore();
  const [query, setQuery] = useState('');

  const filtered = state.savedRecipes.filter(
    (r) =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Editorial Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Saved Recipes</Text>
          <Text style={styles.subtitle}>Your curated cookbook of dishes</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {state.savedRecipes.length} {state.savedRecipes.length === 1 ? 'entry' : 'entries'}
          </Text>
        </View>
      </View>

      {/* Search Filter */}
      {state.savedRecipes.length > 0 && (
        <View style={styles.searchRow}>
          <Search size={16} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search saved dishes or cuisines…"
            placeholderTextColor={Colors.textSecondary}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <X size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {state.savedRecipes.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={28} color={Colors.primary} />}
          title="No recipes saved yet"
          message="Scan your fridge or generate custom recipes to build your personal cookbook."
          actionLabel="Scan Ingredients"
          onAction={() => router.push('/scan')}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={28} color={Colors.primary} />}
          title="No matching recipes"
          message={`No saved dish matches "${query}".`}
          actionLabel="Clear Search"
          onAction={() => setQuery('')}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onPress={() =>
                router.push({ pathname: '/recipes/details', params: { name: item.name } })
              }
              saved
              onSave={() => dispatch({ type: 'UNSAVE_RECIPE', name: item.name })}
              style={styles.cardSpacing}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  title: { ...Typography.h2, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySm, color: Colors.textSecondary, marginTop: 2 },
  countBadge: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  countText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    padding: 0,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  cardSpacing: {
    marginBottom: Spacing.md,
  },
});
