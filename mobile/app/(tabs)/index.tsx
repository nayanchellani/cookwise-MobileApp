import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Camera,
  Sparkles,
  Calendar,
  Search,
  ArrowRight,
  Clock,
  Flame,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/colors';
import {
  Spacing,
  Radius,
  FontSize,
  FontWeight,
  Typography,
  Shadows,
} from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { CUISINE_IMAGES } from '../../src/constants/images';
import { triggerSelection } from '../../src/utils/haptics';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_WIDTH = Math.round(SCREEN_W * 0.76);
const CARD_GAP = 14;

const EDITORIAL_RECIPES = [
  {
    id: '1',
    name: 'Palak Paneer with Spiced Ghee',
    cuisine: 'Indian',
    time: '30 min',
    calories: '320 kcal',
    difficulty: 'Easy',
    diet: 'Vegetarian',
    image: CUISINE_IMAGES.Indian,
  },
  {
    id: '2',
    name: 'Rigatoni all’Arrabbiata',
    cuisine: 'Italian',
    time: '25 min',
    calories: '410 kcal',
    difficulty: 'Easy',
    diet: 'Vegan',
    image: CUISINE_IMAGES.Italian,
  },
  {
    id: '3',
    name: 'Crispy Skinned Salmon Bowl',
    cuisine: 'Asian',
    time: '20 min',
    calories: '380 kcal',
    difficulty: 'Medium',
    diet: 'Pescatarian',
    image: CUISINE_IMAGES.Asian,
  },
  {
    id: '4',
    name: 'Charred Baja Fish Tacos',
    cuisine: 'Mexican',
    time: '35 min',
    calories: '450 kcal',
    difficulty: 'Medium',
    diet: 'Pescatarian',
    image: CUISINE_IMAGES.Mexican,
  },
  {
    id: '5',
    name: 'Sun-dried Tomato & Lentil Stew',
    cuisine: 'Mediterranean',
    time: '45 min',
    calories: '290 kcal',
    difficulty: 'Easy',
    diet: 'Vegan',
    image: CUISINE_IMAGES.Mediterranean,
  },
];

const QUICK_ACTIONS = [
  {
    id: 'scan',
    icon: Camera,
    label: 'Scan Fridge',
    desc: 'Instant detection',
    route: '/scan' as const,
  },
  {
    id: 'generate',
    icon: Sparkles,
    label: 'AI Generator',
    desc: 'Custom recipe',
    route: '/recipes/generator' as const,
  },
  {
    id: 'plan',
    icon: Calendar,
    label: 'Meal Plan',
    desc: 'Weekly schedule',
    route: '/plan' as const,
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Entrance animations (run once on mount, smooth & fast 300-400ms)
  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;
  const utilitiesAnim = useRef(new Animated.Value(0)).current;
  const carouselAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(70, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(utilitiesAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(carouselAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top > 0 ? 4 : 12, 8) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Editorial Header (Animated with generous status bar breathing room) ── */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.headerTitles}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.subGreeting}>Welcome to your kitchen companion</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push('/profile')}
            activeOpacity={0.85}
            hitSlop={8}
          >
            <Text style={styles.avatarText}>CW</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Refined Search Input (Animated & Focus State) ── */}
        <Animated.View
          style={[
            styles.searchRow,
            isSearchFocused && styles.searchRowFocused,
            {
              opacity: searchAnim,
              transform: [
                {
                  translateY: searchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Search
            size={18}
            color={isSearchFocused ? Colors.primary : Colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes, ingredients or cuisines…"
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="search"
          />
        </Animated.View>

        {/* ── Hero Feature: Ingredient Vision (Clean, non-clipped action bar) ── */}
        <Animated.View
          style={[
            styles.heroContainer,
            {
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [15, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Sparkles size={12} color={Colors.accent} />
              <Text style={styles.heroBadgeText}>INGREDIENT INTELLIGENCE</Text>
            </View>

            <Text style={styles.heroTitle}>Transform everyday pantry items into cuisine.</Text>

            <Text style={styles.heroSubtitle}>
              Photograph what’s in your fridge. CookWise identifies each element and creates
              tailored culinary recipes in seconds.
            </Text>

            {/* Seamless, unclipped action buttons */}
            <View style={styles.heroCtas}>
              <TouchableOpacity
                style={styles.heroPrimaryBtn}
                onPress={() => router.push('/scan')}
                activeOpacity={0.85}
              >
                <Camera size={16} color={Colors.backgroundWhite} />
                <Text style={styles.heroPrimaryBtnText}>Scan Ingredients</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroSecondaryBtn}
                onPress={() => router.push('/recipes/generator')}
                activeOpacity={0.8}
                hitSlop={8}
              >
                <Text style={styles.heroSecondaryText}>Create manually</Text>
                <ArrowRight size={14} color={Colors.accent} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* ── Utilities Grid (Staggered Animation) ── */}
        <Animated.View
          style={[
            {
              opacity: utilitiesAnim,
              transform: [
                {
                  translateY: utilitiesAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cooking Utilities</Text>
          </View>

          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((action) => {
              const IconComponent = action.icon;
              return (
                <TouchableOpacity
                  key={action.id}
                  style={styles.utilityCard}
                  onPress={() => {
                    triggerSelection();
                    router.push(action.route);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.utilityIconWrapper}>
                    <IconComponent size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.utilityLabel}>{action.label}</Text>
                  <Text style={styles.utilityDesc}>{action.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Editorial Discovery Section (Proportional peek carousel) ── */}
        <Animated.View
          style={[
            {
              opacity: carouselAnim,
              transform: [
                {
                  translateY: carouselAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Curated Inspirations</Text>
              <Text style={styles.sectionSubtitle}>Handcrafted culinary concepts</Text>
            </View>
          </View>

          <FlatList
            data={EDITORIAL_RECIPES}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            snapToInterval={CARD_WIDTH + CARD_GAP}
            snapToAlignment="start"
            decelerationRate="fast"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.editorialCard}
                onPress={() => router.push('/scan')}
                activeOpacity={0.9}
              >
                <View style={styles.cardImageWrapper}>
                  <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
                  <View style={styles.cardCuisineBadge}>
                    <Text style={styles.cardCuisineText}>{item.cuisine}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>

                  <View style={styles.cardMetaRow}>
                    <View style={styles.cardMetaItem}>
                      <Clock size={12} color={Colors.textSecondary} />
                      <Text style={styles.cardMetaText}>{item.time}</Text>
                    </View>
                    <Text style={styles.cardMetaDot}>·</Text>
                    <View style={styles.cardMetaItem}>
                      <Flame size={12} color={Colors.textSecondary} />
                      <Text style={styles.cardMetaText}>{item.calories}</Text>
                    </View>
                    <Text style={styles.cardMetaDot}>·</Text>
                    <Text style={styles.cardDietTag}>{item.diet}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  scroll: { flex: 1 },
  content: { paddingBottom: Spacing.xxl },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  headerTitles: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  greeting: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  subGreeting: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...Shadows.subtle,
  },
  avatarText: {
    color: Colors.backgroundWhite,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
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
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  searchRowFocused: {
    borderColor: Colors.primary,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    padding: 0,
  },

  heroContainer: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  heroContent: {
    padding: Spacing.md + 2,
    gap: 4,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  heroBadgeText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: FontSize.lg + 1,
    fontWeight: FontWeight.bold,
    color: Colors.backgroundWhite,
    lineHeight: (FontSize.lg + 1) * 1.25,
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.backgroundSage,
    lineHeight: FontSize.xs * 1.45,
    marginTop: 3,
    marginBottom: Spacing.sm + 2,
  },
  heroCtas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: 4,
  },
  heroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#163B2B',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroPrimaryBtnText: {
    color: Colors.backgroundWhite,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.1,
  },
  heroSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: Spacing.xs,
  },
  heroSecondaryText: {
    color: Colors.backgroundWhite,
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.medium,
  },

  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs + 2,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: FontSize.md + 1,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    ...Typography.caption,
    marginTop: 1,
  },

  quickGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  utilityCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm + 2,
    gap: 3,
    ...Shadows.subtle,
  },
  utilityIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.backgroundWarm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  utilityLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  utilityDesc: {
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
  },

  carouselContent: {
    paddingHorizontal: Spacing.lg,
    gap: CARD_GAP,
    paddingBottom: Spacing.sm,
  },
  editorialCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  cardImageWrapper: {
    height: 130,
    width: '100%',
    position: 'relative',
    backgroundColor: Colors.backgroundSage,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardCuisineBadge: {
    position: 'absolute',
    top: Spacing.xs + 2,
    left: Spacing.xs + 2,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  cardCuisineText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  cardBody: {
    padding: Spacing.sm + 2,
    gap: 3,
  },
  cardTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  cardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardMetaText: {
    fontSize: FontSize.xxs + 1,
    color: Colors.textSecondary,
  },
  cardMetaDot: {
    color: Colors.textSecondary,
    fontSize: FontSize.xxs,
  },
  cardDietTag: {
    fontSize: FontSize.xxs + 1,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
});
