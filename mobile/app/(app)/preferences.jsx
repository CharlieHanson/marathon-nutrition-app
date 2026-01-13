import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useFoodPreferences } from '../../hooks/useFoodPreferences';

// Food categories with their items
const FOOD_CATEGORIES = [
  {
    id: 'proteins',
    name: 'Proteins',
    foods: [
      'Chicken',
      'Salmon',
      'Beef',
      'Turkey',
      'Pork',
      'Shrimp',
      'Tuna',
      'Cod',
      'Tofu',
    ],
  },
  {
    id: 'dairy',
    name: 'Dairy & Eggs',
    foods: ['Eggs', 'Greek Yogurt', 'Cottage Cheese', 'Milk', 'Cheese', 'Mozzarella', 'Feta', 'Butter', 'Cream Cheese'],
  },
  {
    id: 'carbs',
    name: 'Grains & Carbs',
    foods: ['Quinoa', 'Rice', 'Pasta', 'Oats', 'Bread', 'Tortillas', 'Couscous', 'Potatoes', 'Granola'],
  },
  {
    id: 'fruits',
    name: 'Fruits',
    foods: ['Avocado', 'Bananas', 'Berries', 'Apples', 'Oranges', 'Mango', 'Strawberries', 'Watermelon', 'Peaches'],
  },
  {
    id: 'vegetables',
    name: 'Vegetables',
    foods: [
      'Spinach',
      'Broccoli',
      'Cucumber',
      'Sweet Potato',
      'Carrots',
      'Tomatoes',
      'Peppers',
      'Kale',
      'Cauliflower',
      'Zucchini',
      'Mushrooms',
      'Onions',
    ],
  },
  {
    id: 'nuts',
    name: 'Nuts & Legumes',
    foods: ['Nuts', 'Almonds', 'Peanut Butter', 'Beans', 'Lentils', 'Chickpeas'],
  },
  {
    id: 'other',
    name: 'Other',
    foods: [
      'Garlic',
      'Hummus',
      'Olive Oil',
      'Vinegar',
      'Soy Sauce',
      'Hot Sauce',
      'Salsa',
      'Honey',
      'Mayonnaise'
    ],
  },
];


const COMMON_CUISINES = [
  'Mediterranean',
  'Italian',
  'Mexican',
  'Chinese',
  'Japanese',
  'Thai',
  'Indian',
  'American',
  'Greek',
  'Korean',
  'Vietnamese',
  'Spanish',
  'French',
  'Middle Eastern',
  'Hawaiian'
];

const FILTER_OPTIONS = ['All', 'Unset', 'Liked', 'Disliked'];

const { width } = Dimensions.get('window');
const NUM_COLUMNS = width < 360 ? 2 : 3;
const ITEM_WIDTH = (width - 48 - (NUM_COLUMNS - 1) * 8) / NUM_COLUMNS; // 48 = padding * 2, 8 = gap

export default function PreferencesScreen() {
  const { user, isGuest } = useAuth();
  const { colors } = useTheme();
  const preferencesHook = useFoodPreferences(user, isGuest);

  const styles = getStyles(colors);

  // State map: foodKey -> "neutral" | "liked" | "disliked"
  const [foodStates, setFoodStates] = useState({});
  const [expandedCategories, setExpandedCategories] = useState(new Set(['proteins'])); // First category expanded by default
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [otherLikes, setOtherLikes] = useState('');
  const [otherDislikes, setOtherDislikes] = useState('');
  const [favoriteCuisines, setFavoriteCuisines] = useState(new Set());
  const [otherCuisines, setOtherCuisines] = useState('');
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const onUpdateRef = useRef(preferencesHook.updatePreferences);

  // Keep onUpdate ref up to date
  useEffect(() => {
    onUpdateRef.current = preferencesHook.updatePreferences;
  }, [preferencesHook.updatePreferences]);

  // Initialize food states from preferences
  useEffect(() => {
    if (
      !preferencesHook.preferences.likes &&
      !preferencesHook.preferences.dislikes &&
      !preferencesHook.preferences.cuisineFavorites
    ) {
      return;
    }

    const newFoodStates = {};

    // Parse liked foods
    if (preferencesHook.preferences.likes) {
      const likesArray = preferencesHook.preferences.likes
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f);
      const commonLikes = likesArray.filter((f) =>
        FOOD_CATEGORIES.some((cat) => cat.foods.includes(f))
      );
      const otherLikesList = likesArray.filter(
        (f) => !FOOD_CATEGORIES.some((cat) => cat.foods.includes(f))
      );

      commonLikes.forEach((food) => {
        newFoodStates[food] = 'liked';
      });
      setOtherLikes(otherLikesList.join(', '));
    }

    // Parse disliked foods
    if (preferencesHook.preferences.dislikes) {
      const dislikesArray = preferencesHook.preferences.dislikes
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f);
      const commonDislikes = dislikesArray.filter((f) =>
        FOOD_CATEGORIES.some((cat) => cat.foods.includes(f))
      );
      const otherDislikesList = dislikesArray.filter(
        (f) => !FOOD_CATEGORIES.some((cat) => cat.foods.includes(f))
      );

      commonDislikes.forEach((food) => {
        newFoodStates[food] = 'disliked';
      });
      setOtherDislikes(otherDislikesList.join(', '));
    }

    // Parse cuisines
    if (preferencesHook.preferences.cuisineFavorites) {
      const cuisinesArray = preferencesHook.preferences.cuisineFavorites
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c);
      const commonCuisinesList = cuisinesArray.filter((c) => COMMON_CUISINES.includes(c));
      const otherCuisinesList = cuisinesArray.filter((c) => !COMMON_CUISINES.includes(c));

      setFavoriteCuisines(new Set(commonCuisinesList));
      setOtherCuisines(otherCuisinesList.join(', '));
    }

    setFoodStates(newFoodStates);
  }, [
    preferencesHook.preferences.likes,
    preferencesHook.preferences.dislikes,
    preferencesHook.preferences.cuisineFavorites,
  ]);

  // Auto-expand categories with search matches
  useEffect(() => {
    if (searchQuery.trim()) {
      const matchingCategories = new Set();
      FOOD_CATEGORIES.forEach((category) => {
        const hasMatch = category.foods.some((food) =>
          food.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (hasMatch) {
          matchingCategories.add(category.id);
        }
      });
      setExpandedCategories(matchingCategories);
    } else {
      // Reset to first category expanded when search is cleared
      setExpandedCategories(new Set(['proteins']));
    }
  }, [searchQuery]);

  // Update preferences whenever local state changes
  useEffect(() => {
    const likedFoods = Object.entries(foodStates)
      .filter(([_, state]) => state === 'liked')
      .map(([food]) => food);
    const dislikedFoods = Object.entries(foodStates)
      .filter(([_, state]) => state === 'disliked')
      .map(([food]) => food);

    const allLikes = [
      ...likedFoods,
      ...otherLikes.split(',').map((f) => f.trim()).filter((f) => f),
    ]
      .filter((f) => f)
      .join(', ');

    const allDislikes = [
      ...dislikedFoods,
      ...otherDislikes.split(',').map((f) => f.trim()).filter((f) => f),
    ]
      .filter((f) => f)
      .join(', ');

    const allCuisines = [
      ...Array.from(favoriteCuisines),
      ...otherCuisines.split(',').map((c) => c.trim()).filter((c) => c),
    ]
      .filter((c) => c)
      .join(', ');

    onUpdateRef.current('likes', allLikes);
    onUpdateRef.current('dislikes', allDislikes);
    onUpdateRef.current('cuisineFavorites', allCuisines);
  }, [foodStates, otherLikes, otherDislikes, favoriteCuisines, otherCuisines]);

  // Cycle food state: neutral → liked → disliked → neutral
  const cycleFoodState = (food) => {
    if (isGuest) return;

    setFoodStates((prev) => {
      const currentState = prev[food] || 'neutral';
      let nextState;

      if (currentState === 'neutral') {
        nextState = 'liked';
      } else if (currentState === 'liked') {
        nextState = 'disliked';
      } else {
        nextState = 'neutral';
      }

      return { ...prev, [food]: nextState };
    });
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const toggleCuisine = (cuisine) => {
    if (isGuest) return;

    setFavoriteCuisines((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cuisine)) {
        newSet.delete(cuisine);
      } else {
        newSet.add(cuisine);
      }
      return newSet;
    });
  };

  // Filter and search foods
  const getFilteredCategories = useMemo(() => {
    return FOOD_CATEGORIES.map((category) => {
      let filteredFoods = category.foods;

      // Apply search filter
      if (searchQuery.trim()) {
        filteredFoods = filteredFoods.filter((food) =>
          food.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Apply state filter
      if (activeFilter !== 'All') {
        filteredFoods = filteredFoods.filter((food) => {
          const state = foodStates[food] || 'neutral';
          if (activeFilter === 'Unset') return state === 'neutral';
          if (activeFilter === 'Liked') return state === 'liked';
          if (activeFilter === 'Disliked') return state === 'disliked';
          return true;
        });
      }

      return { ...category, foods: filteredFoods };
    });
  }, [searchQuery, activeFilter, foodStates]);

  const handleSave = async () => {
    const { error } = await preferencesHook.savePreferences();
    if (!error) {
      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 3000);
    } else {
      alert('Failed to save preferences');
    }
  };

  const renderFoodItem = ({ item: food }) => {
    const state = foodStates[food] || 'neutral';

    return (
      <TouchableOpacity
        style={[
          styles.foodTile,
          state === 'liked' && styles.foodTileLiked,
          state === 'disliked' && styles.foodTileDisliked,
          isGuest && styles.foodTileDisabled,
        ]}
        onPress={() => cycleFoodState(food)}
        disabled={isGuest}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.foodTileText,
            state === 'liked' && styles.foodTileTextLiked,
            state === 'disliked' && styles.foodTileTextDisliked,
          ]}
          numberOfLines={1}
        >
          {food}
        </Text>
        {state === 'liked' && (
          <Ionicons name="thumbs-up" size={12} color="#10B981" style={styles.foodTileIcon} />
        )}
        {state === 'disliked' && (
          <Ionicons name="thumbs-down" size={12} color="#EF4444" style={styles.foodTileIcon} />
        )}
      </TouchableOpacity>
    );
  };

  const renderCategory = ({ item: category }) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasFoods = category.foods.length > 0;

    if (!hasFoods) return null;

    return (
      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategory(category.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.categoryTitle}>{category.name}</Text>
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {isExpanded && (
          <FlatList
            data={category.foods}
            renderItem={renderFoodItem}
            keyExtractor={(item) => item}
            numColumns={NUM_COLUMNS}
            scrollEnabled={false}
            contentContainerStyle={styles.foodsGrid}
            columnWrapperStyle={NUM_COLUMNS > 1 ? styles.foodsRow : null}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Sticky Search + Filter Bar */}
      <View style={styles.stickyHeader}>
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search foods…"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {!isGuest && (
            <TouchableOpacity
              style={[
                styles.topSaveButton,
                preferencesHook.isSaving && styles.topSaveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={preferencesHook.isSaving}
            >
              {preferencesHook.isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="save-outline" size={18} color="#FFFFFF" />
              )}
              <Text style={styles.topSaveButtonText}>
                {preferencesHook.isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterContainer}>
          {FILTER_OPTIONS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                activeFilter === filter && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === filter && styles.filterChipTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main Content */}
      <FlatList
        data={getFilteredCategories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Food Preferences</Text>
          </>
        }
        ListFooterComponent={
          <>
            {/* Other Foods Section */}
            <View style={styles.section}>
              <View style={styles.sectionDivider} />
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Other Foods I Like</Text>
                <TextInput
                  style={[styles.textArea, isGuest && styles.textAreaDisabled]}
                  placeholder="Separated by commas"
                  value={otherLikes}
                  onChangeText={setOtherLikes}
                  editable={!isGuest}
                  multiline
                  numberOfLines={2}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Other Foods I Dislike</Text>
                <TextInput
                  style={[styles.textArea, isGuest && styles.textAreaDisabled]}
                  placeholder="Separated by commas"
                  value={otherDislikes}
                  onChangeText={setOtherDislikes}
                  editable={!isGuest}
                  multiline
                  numberOfLines={2}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Favorite Cuisines Section */}
            <View style={styles.section}>
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionTitle}>Favorite Cuisines</Text>
              <View style={styles.cuisinesGrid}>
                {COMMON_CUISINES.map((cuisine) => {
                  const isFavorite = favoriteCuisines.has(cuisine);

                  return (
                    <TouchableOpacity
                      key={cuisine}
                      onPress={() => toggleCuisine(cuisine)}
                      disabled={isGuest}
                      style={[
                        styles.cuisineChip,
                        isFavorite && styles.cuisineChipActive,
                        isGuest && styles.cuisineChipDisabled,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.cuisineChipText,
                          isFavorite && styles.cuisineChipTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {cuisine}
                      </Text>
                      <Ionicons
                        name={isFavorite ? 'thumbs-up' : 'thumbs-up-outline'}
                        size={14}
                        color={isFavorite ? colors.primary : colors.textTertiary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Other Favorite Cuisines</Text>
                <TextInput
                  style={[styles.textArea, isGuest && styles.textAreaDisabled]}
                  placeholder="Separated by commas"
                  value={otherCuisines}
                  onChangeText={setOtherCuisines}
                  editable={!isGuest}
                  multiline
                  numberOfLines={2}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Save Section */}
            <View style={styles.saveSection}>
              {!isGuest ? (
                <>
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      preferencesHook.isSaving && styles.saveButtonDisabled,
                    ]}
                    onPress={handleSave}
                    disabled={preferencesHook.isSaving}
                  >
                    {preferencesHook.isSaving ? (
                      <ActivityIndicator size="small" color={colors.textInverse} />
                    ) : (
                      <Ionicons name="save-outline" size={18} color={colors.textInverse} />
                    )}
                    <Text style={styles.saveButtonText}>
                      {preferencesHook.isSaving ? 'Saving...' : 'Save Preferences'}
                    </Text>
                  </TouchableOpacity>

                  {showSaveConfirmation && (
                    <View style={styles.confirmationBadge}>
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                      <Text style={styles.confirmationText}>Saved!</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.guestMessage}>
                  <View style={styles.guestIconContainer}>
                    <Ionicons name="lock-closed" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.guestTextContainer}>
                    <Text style={styles.guestTitle}>Guest Mode</Text>
                    <Text style={styles.guestText}>
                      Sign in to save your preferences and get personalized meal plans.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </>
        }
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stickyHeader: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    minHeight: 36,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  topSaveButtonDisabled: {
    opacity: 0.7,
  },
  topSaveButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textInverse,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textInverse,
  },
  content: {
    padding: 12,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '600',
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  foodsGrid: {
    paddingTop: 4,
  },
  foodsRow: {
    justifyContent: 'space-between',
  },
  foodTile: {
    width: ITEM_WIDTH,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginBottom: 6,
  },
  foodTileLiked: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  foodTileDisliked: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
  },
  foodTileDisabled: {
    opacity: 0.6,
  },
  foodTileText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  foodTileTextLiked: {
    color: colors.successText,
  },
  foodTileTextDisliked: {
    color: colors.errorText,
  },
  foodTileIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  section: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  textArea: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 13,
    color: colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  textAreaDisabled: {
    backgroundColor: colors.inputBackground,
    color: colors.textTertiary,
  },
  cuisinesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  cuisineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.inputBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 4,
    minHeight: 36,
  },
  cuisineChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  cuisineChipDisabled: {
    opacity: 0.6,
  },
  cuisineChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  cuisineChipTextActive: {
    color: colors.primary,
  },
  saveSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
    minHeight: 48,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textInverse,
  },
  confirmationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.successLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
    gap: 6,
  },
  confirmationText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.successText,
  },
  guestMessage: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: colors.warningLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warning,
    gap: 10,
  },
  guestIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestTextContainer: {
    flex: 1,
  },
  guestTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.warning,
    marginBottom: 2,
  },
  guestText: {
    fontSize: 12,
    color: colors.warning,
    lineHeight: 16,
    fontWeight: '600',
  },
});
