import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#F6921D';
const GRAY = '#E5E7EB';
const GRAY_TEXT = '#9CA3AF';
const TEXT = '#111827';
const TEXT_SECONDARY = '#6B7280';
const SUCCESS = '#10B981';
const SUCCESS_LIGHT = 'rgba(16, 185, 129, 0.15)';
const ERROR = '#EF4444';
const ERROR_LIGHT = 'rgba(239, 68, 68, 0.15)';

const FOOD_CATEGORIES = [
  { id: 'proteins', name: 'Proteins', foods: ['Chicken', 'Salmon', 'Beef', 'Turkey', 'Pork', 'Shrimp', 'Tuna', 'Cod', 'Tofu'] },
  { id: 'dairy', name: 'Dairy & Eggs', foods: ['Eggs', 'Greek Yogurt', 'Cottage Cheese', 'Milk', 'Cheese', 'Mozzarella', 'Feta', 'Butter', 'Cream Cheese'] },
  { id: 'carbs', name: 'Grains & Carbs', foods: ['Quinoa', 'Rice', 'Pasta', 'Oats', 'Bread', 'Tortillas', 'Couscous', 'Potatoes', 'Granola'] },
  { id: 'fruits', name: 'Fruits', foods: ['Avocado', 'Bananas', 'Berries', 'Apples', 'Oranges', 'Mango', 'Strawberries', 'Watermelon', 'Peaches'] },
  { id: 'vegetables', name: 'Vegetables', foods: ['Spinach', 'Broccoli', 'Cucumber', 'Sweet Potato', 'Carrots', 'Tomatoes', 'Peppers', 'Kale', 'Cauliflower', 'Zucchini', 'Mushrooms', 'Onions'] },
  { id: 'nuts', name: 'Nuts & Legumes', foods: ['Nuts', 'Almonds', 'Peanut Butter', 'Beans', 'Lentils', 'Chickpeas'] },
  { id: 'other', name: 'Other', foods: ['Garlic', 'Hummus', 'Olive Oil', 'Vinegar', 'Soy Sauce', 'Hot Sauce', 'Salsa', 'Honey', 'Mayonnaise'] },
];

const COMMON_CUISINES = [
  'Mediterranean', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Thai', 'Indian',
  'American', 'Greek', 'Korean', 'Vietnamese', 'Spanish', 'French', 'Middle Eastern', 'Hawaiian',
];

const FILTER_OPTIONS = ['All', 'Unset', 'Liked', 'Disliked'];

const { width } = Dimensions.get('window');
const NUM_COLUMNS = width < 360 ? 2 : 3;
const CARD_HORIZONTAL_INSET = 32 + 32; // margin 16*2 + padding 16*2
const ITEM_WIDTH = (width - CARD_HORIZONTAL_INSET - (NUM_COLUMNS - 1) * 8) / NUM_COLUMNS;

export function PreferencesStep({
  preferences,
  onUpdate,
  onComplete,
  onBack,
  isSaving,
}) {
  const [foodStates, setFoodStates] = useState({});
  const [expandedCategories, setExpandedCategories] = useState(new Set(['proteins']));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [otherLikes, setOtherLikes] = useState('');
  const [otherDislikes, setOtherDislikes] = useState('');
  const [favoriteCuisines, setFavoriteCuisines] = useState(new Set());
  const [otherCuisines, setOtherCuisines] = useState('');
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Initialize from parent preferences (e.g. when returning to step)
  useEffect(() => {
    if (!preferences.likes && !preferences.dislikes && !preferences.cuisineFavorites) return;
    const nextFoodStates = {};
    if (preferences.likes) {
      preferences.likes.split(',').map((f) => f.trim()).filter(Boolean).forEach((f) => {
        if (FOOD_CATEGORIES.some((cat) => cat.foods.includes(f))) nextFoodStates[f] = 'liked';
      });
      const other = preferences.likes.split(',').map((f) => f.trim()).filter((f) => f && !FOOD_CATEGORIES.some((cat) => cat.foods.includes(f)));
      setOtherLikes(other.join(', '));
    }
    if (preferences.dislikes) {
      preferences.dislikes.split(',').map((f) => f.trim()).filter(Boolean).forEach((f) => {
        if (FOOD_CATEGORIES.some((cat) => cat.foods.includes(f))) nextFoodStates[f] = 'disliked';
      });
      const other = preferences.dislikes.split(',').map((f) => f.trim()).filter((f) => f && !FOOD_CATEGORIES.some((cat) => cat.foods.includes(f)));
      setOtherDislikes(other.join(', '));
    }
    if (preferences.cuisineFavorites) {
      const list = preferences.cuisineFavorites.split(',').map((c) => c.trim()).filter(Boolean);
      setFavoriteCuisines(new Set(list.filter((c) => COMMON_CUISINES.includes(c))));
      setOtherCuisines(list.filter((c) => !COMMON_CUISINES.includes(c)).join(', '));
    }
    setFoodStates(nextFoodStates);
  }, []);

  // Sync local state to parent (likes, dislikes, cuisineFavorites)
  // Use ref for onUpdate to avoid infinite loop: parent setState -> re-render -> new onUpdate -> effect re-runs
  useEffect(() => {
    const likedFoods = Object.entries(foodStates).filter(([, s]) => s === 'liked').map(([f]) => f);
    const dislikedFoods = Object.entries(foodStates).filter(([, s]) => s === 'disliked').map(([f]) => f);
    const allLikes = [...likedFoods, ...otherLikes.split(',').map((f) => f.trim()).filter(Boolean)].filter(Boolean).join(', ');
    const allDislikes = [...dislikedFoods, ...otherDislikes.split(',').map((f) => f.trim()).filter(Boolean)].filter(Boolean).join(', ');
    const allCuisines = [...Array.from(favoriteCuisines), ...otherCuisines.split(',').map((c) => c.trim()).filter(Boolean)].filter(Boolean).join(', ');
    onUpdateRef.current('likes', allLikes);
    onUpdateRef.current('dislikes', allDislikes);
    onUpdateRef.current('cuisineFavorites', allCuisines);
  }, [foodStates, otherLikes, otherDislikes, favoriteCuisines, otherCuisines]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const next = new Set();
      FOOD_CATEGORIES.forEach((cat) => {
        if (cat.foods.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()))) next.add(cat.id);
      });
      setExpandedCategories(next);
    } else {
      setExpandedCategories(new Set(['proteins']));
    }
  }, [searchQuery]);

  const cycleFoodState = (food) => {
    setFoodStates((prev) => {
      const s = prev[food] || 'neutral';
      const next = s === 'neutral' ? 'liked' : s === 'liked' ? 'disliked' : 'neutral';
      return { ...prev, [food]: next };
    });
  };

  const toggleCategory = (id) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleCuisine = (cuisine) => {
    setFavoriteCuisines((prev) => {
      const next = new Set(prev);
      if (next.has(cuisine)) next.delete(cuisine); else next.add(cuisine);
      return next;
    });
  };

  const getFilteredCategories = useMemo(() => {
    return FOOD_CATEGORIES.map((cat) => {
      let foods = cat.foods;
      if (searchQuery.trim()) {
        foods = foods.filter((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      if (activeFilter !== 'All') {
        foods = foods.filter((f) => {
          const s = foodStates[f] || 'neutral';
          if (activeFilter === 'Unset') return s === 'neutral';
          if (activeFilter === 'Liked') return s === 'liked';
          if (activeFilter === 'Disliked') return s === 'disliked';
          return true;
        });
      }
      return { ...cat, foods };
    });
  }, [searchQuery, activeFilter, foodStates]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>What are your food preferences?</Text>
        <Text style={styles.subtitle}>Tap to mark likes or dislikes. Help us personalize your meals.</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={GRAY_TEXT} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods…"
            placeholderTextColor={GRAY_TEXT}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="done"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={GRAY_TEXT} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterContainer}>
        {FILTER_OPTIONS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {getFilteredCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const hasFoods = category.foods.length > 0;
          if (!hasFoods) return null;
          return (
            <View key={category.id} style={styles.categoryContainer}>
              <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleCategory(category.id)} activeOpacity={0.7}>
                <Text style={styles.categoryTitle}>{category.name}</Text>
                <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-forward'} size={18} color={TEXT_SECONDARY} />
              </TouchableOpacity>
              {isExpanded && (
                <View style={styles.foodsGrid}>
                  {category.foods.map((food) => {
                    const state = foodStates[food] || 'neutral';
                    return (
                      <TouchableOpacity
                        key={food}
                        style={[
                          styles.foodTile,
                          { width: ITEM_WIDTH },
                          state === 'liked' && styles.foodTileLiked,
                          state === 'disliked' && styles.foodTileDisliked,
                        ]}
                        onPress={() => cycleFoodState(food)}
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
                        {state === 'liked' && <Ionicons name="thumbs-up" size={12} color={SUCCESS} style={styles.foodTileIcon} />}
                        {state === 'disliked' && <Ionicons name="thumbs-down" size={12} color={ERROR} style={styles.foodTileIcon} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.section}>
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Other foods</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Other Foods I Like</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Separated by commas"
              placeholderTextColor={GRAY_TEXT}
              value={otherLikes}
              onChangeText={setOtherLikes}
              multiline
              numberOfLines={2}
              returnKeyType="done"
              blurOnSubmit
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Other Foods I Dislike</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Separated by commas"
              placeholderTextColor={GRAY_TEXT}
              value={otherDislikes}
              onChangeText={setOtherDislikes}
              multiline
              numberOfLines={2}
              returnKeyType="done"
              blurOnSubmit
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Favorite Cuisines</Text>
          <View style={styles.cuisinesGrid}>
            {COMMON_CUISINES.map((cuisine) => {
              const isFavorite = favoriteCuisines.has(cuisine);
              return (
                <TouchableOpacity
                  key={cuisine}
                  style={[styles.cuisineChip, isFavorite && styles.cuisineChipActive]}
                  onPress={() => toggleCuisine(cuisine)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cuisineChipText, isFavorite && styles.cuisineChipTextActive]} numberOfLines={1}>{cuisine}</Text>
                  <Ionicons name={isFavorite ? 'thumbs-up' : 'thumbs-up-outline'} size={14} color={isFavorite ? PRIMARY : GRAY_TEXT} />
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Other Favorite Cuisines</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Separated by commas"
              placeholderTextColor={GRAY_TEXT}
              value={otherCuisines}
              onChangeText={setOtherCuisines}
              multiline
              numberOfLines={2}
              returnKeyType="done"
              blurOnSubmit
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={isSaving}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
          onPress={onComplete}
          disabled={isSaving}
        >
          {isSaving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.primaryButtonText}>Complete Setup</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    maxHeight: '92%',
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: TEXT_SECONDARY,
  },
  searchRow: {
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: GRAY,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT,
    padding: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: GRAY,
  },
  filterChipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_SECONDARY,
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  scroll: {
    flex: 1,
    maxHeight: 340,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  categoryContainer: { marginBottom: 12 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT,
  },
  foodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  foodTile: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: GRAY,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  foodTileLiked: {
    backgroundColor: SUCCESS_LIGHT,
    borderColor: SUCCESS,
  },
  foodTileDisliked: {
    backgroundColor: ERROR_LIGHT,
    borderColor: ERROR,
  },
  foodTileText: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  foodTileTextLiked: { color: SUCCESS },
  foodTileTextDisliked: { color: ERROR },
  foodTileIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  section: { marginTop: 8, marginBottom: 12 },
  sectionDivider: {
    height: 1,
    backgroundColor: GRAY,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT,
    marginBottom: 10,
  },
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    marginBottom: 6,
  },
  textArea: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GRAY,
    fontSize: 13,
    color: TEXT,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  cuisinesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  cuisineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: GRAY,
    gap: 4,
  },
  cuisineChipActive: {
    backgroundColor: 'rgba(246, 146, 29, 0.15)',
    borderColor: PRIMARY,
  },
  cuisineChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_SECONDARY,
  },
  cuisineChipTextActive: { color: PRIMARY },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GRAY,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
