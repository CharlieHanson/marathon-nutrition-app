import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMealPlan } from '../../hooks/useMealPlan';
import { useTrainingPlan } from '../../hooks/useTrainingPlan';
import { useMealCompletions, getCurrentDayOfWeek, MEAL_TYPES } from '../../hooks/useMealCompletions';
import { fetchPersonalInfo, fetchActiveTrainingPlan } from '../../../shared/lib/dataClient';
import { apiClient } from '../../../shared/services/api';

const { width } = Dimensions.get('window');
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Reuse helpers from MealsScreen
const parseMeal = (mealString) => {
  if (!mealString || typeof mealString !== 'string') {
    return { name: '', calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  const calMatch = mealString.match(/Cal:\s*(\d+)/);
  const proteinMatch = mealString.match(/P:\s*(\d+)g/);
  const carbsMatch = mealString.match(/C:\s*(\d+)g/);
  const fatMatch = mealString.match(/F:\s*(\d+)g/);

  const nameMatch = mealString.match(/^(.+?)\s*\(/);
  const name = nameMatch ? nameMatch[1].trim() : mealString;

  return {
    name,
    calories: calMatch ? parseInt(calMatch[1], 10) : 0,
    protein: proteinMatch ? parseInt(proteinMatch[1], 10) : 0,
    carbs: carbsMatch ? parseInt(carbsMatch[1], 10) : 0,
    fat: fatMatch ? parseInt(fatMatch[1], 10) : 0,
  };
};

const calculateDayMacros = (dayMeals) => {
  const total = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  MEAL_TYPES.forEach((mealType) => {
    const meal = dayMeals?.[mealType];
    if (meal) {
      const parsed = parseMeal(meal);
      total.calories += parsed.calories;
      total.protein += parsed.protein;
      total.carbs += parsed.carbs;
      total.fat += parsed.fat;
    }
  });

  return total;
};

const countMeals = (mealPlan) => {
  let filled = 0;
  let total = 0;

  DAYS.forEach((day) => {
    MEAL_TYPES.forEach((mt) => {
      total++;
      const meal = mealPlan?.[day]?.[mt];
      if (meal && typeof meal === 'string' && meal.trim()) filled++;
    });
  });

  return { filled, total, hasPartial: filled > 0 && filled < total };
};

const getTodayDayName = () => {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon,...
  // Map to app's day keys: monday..sunday
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayNames[day];
};

const formatTodayDate = () => {
  const today = new Date();
  return today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getTodayWorkout = (trainingPlan) => {
  if (!trainingPlan) return null;
  const todayDay = getTodayDayName();
  const dayData = trainingPlan[todayDay];
  if (!dayData?.workouts || !Array.isArray(dayData.workouts)) return null;
  
  // Check if there's a planned workout (not empty/rest)
  const plannedWorkouts = dayData.workouts.filter((w) => {
    const hasType = w.type && w.type.trim() && w.type !== 'Rest';
    const hasDistance = w.distance && w.distance.trim();
    const hasNotes = w.notes && w.notes.trim();
    return hasType || hasDistance || hasNotes;
  });
  
  if (plannedWorkouts.length === 0) return null;
  
  return plannedWorkouts[0]; // Return first planned workout
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { colors } = useTheme();
  const mealPlanHook = useMealPlan(user, isGuest);
  const trainingPlanHook = useTrainingPlan(user, isGuest);
  const mealCompletionsHook = useMealCompletions(user, isGuest);

  const styles = getStyles(colors);

  const [userProfile, setUserProfile] = useState(null);
  const [foodPreferences, setFoodPreferences] = useState(null);
  const [trainingPlan, setTrainingPlan] = useState(null);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [groceryList, setGroceryList] = useState([]);
  const [loadingGroceryList, setLoadingGroceryList] = useState(false);

  // Load user data for meal generation
  useEffect(() => {
    const loadUserData = async () => {
      if (!user || isGuest) return;

      try {
        const [personalInfo, training] = await Promise.all([
          fetchPersonalInfo(user.id),
          fetchActiveTrainingPlan(user.id),
        ]);

        setUserProfile(personalInfo?.userProfile || null);
        setFoodPreferences(personalInfo?.foodPreferences || null);
        setTrainingPlan(training?.plan_data || null);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [user?.id, isGuest]);

  // Get today's data
  const todayDay = getTodayDayName();
  const todayDate = formatTodayDate();
  const todayMeals = mealPlanHook.mealPlan?.[todayDay];
  const todayMacros = todayMeals ? calculateDayMacros(todayMeals) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const todayWorkout = getTodayWorkout(trainingPlanHook.plan);
  const weekProgress = countMeals(mealPlanHook.mealPlan);

  // Calculate eaten calories from completed meals
  const calculateEatenCalories = () => {
    if (!todayMeals) return 0;
    let eatenCalories = 0;
    
    MEAL_TYPES.forEach((mealType) => {
      const isCompleted = mealCompletionsHook.completions.some(
        (c) => c.day_of_week === todayDay && c.meal_type === mealType
      );
      if (isCompleted) {
        const meal = todayMeals[mealType];
        if (meal) {
          const parsed = parseMeal(meal);
          eatenCalories += parsed.calories;
        }
      }
    });
    
    return eatenCalories;
  };

  const eatenCalories = calculateEatenCalories();
  const remainingCalories = Math.max(0, todayMacros.calories - eatenCalories);
  const progressPercentage = todayMacros.calories > 0 ? (eatenCalories / todayMacros.calories) * 100 : 0;

  const generateGroceryList = async () => {
    try {
      setLoadingGroceryList(true);
      const allMeals = [];

      Object.entries(mealPlanHook.mealPlan || {}).forEach(([day, meals]) => {
        Object.entries(meals || {}).forEach(([mealType, meal]) => {
          if (
            !meal ||
            typeof meal !== 'string' ||
            mealType.includes('_rating') ||
            meal.trim() === ''
          ) {
            return;
          }
          allMeals.push(meal);
        });
      });

      if (allMeals.length === 0) {
        Alert.alert('No Meals', 'No meals found. Generate a meal plan first!');
        setLoadingGroceryList(false);
        return;
      }

      const result = await apiClient.generateGroceryList({
        meals: allMeals,
        userProfile,
      });

      if (result.success && result.groceryList) {
        setGroceryList(result.groceryList);
        setShowGroceryModal(true);
      } else {
        throw new Error(result.error || 'Failed to generate grocery list');
      }
    } catch (error) {
      console.error('Error generating grocery list:', error);
      Alert.alert('Error', error.message || 'Failed to generate grocery list');
    } finally {
      setLoadingGroceryList(false);
    }
  };

  const handleShareGroceryList = async () => {
    try {
      // Flatten the category/items structure for sharing
      const listItems = [];
      (groceryList || []).forEach((category) => {
        if (category.category) {
          listItems.push(`\n${category.category}:`);
          (category.items || []).forEach((item) => {
            listItems.push(`  • ${item}`);
          });
        }
      });
      const listText = listItems.join('\n');
      await Share.share({
        message: `Grocery List:\n${listText}`,
        title: 'Grocery List',
      });
    } catch (error) {
      console.error('Error sharing grocery list:', error);
    }
  };

  // Determine next action based on priority
  const getNextAction = () => {
    // A) No training plan
    const hasTrainingPlan = trainingPlanHook.plan && Object.keys(trainingPlanHook.plan).length > 0;
    if (isGuest || !hasTrainingPlan) {
      return {
        title: 'Create training plan',
        subtitle: 'Set up your week',
        onPress: () => router.push('/(app)/training'),
      };
    }

    // B) No meal plan (check if any meals exist)
    const hasMealPlan = mealPlanHook.mealPlan && weekProgress.filled > 0;
    if (!hasMealPlan) {
      return {
        title: 'Generate meal plan',
        subtitle: 'Generate meals for the week',
        onPress: async () => {
          if (!user || isGuest) {
            router.push('/(app)/meals');
            return;
          }
          try {
            const todayDay = getTodayDayName();
            await mealPlanHook.generateDay(todayDay, userProfile, foodPreferences, trainingPlan);
            Alert.alert('Success', 'Meal generation started! Check the Meals tab for progress.');
          } catch (error) {
            Alert.alert('Error', 'Failed to generate meals. Please try again.');
          }
        },
      };
    }

    // C) Training plan exists AND meal plan is fully filled
    if (weekProgress.filled === weekProgress.total) {
      return {
        title: 'View grocery list',
        subtitle: "Everything's ready",
        onPress: () => {
          if (!loadingGroceryList) {
            generateGroceryList();
          }
        },
      };
    }

    // D) Otherwise (partial meal plan)
    return {
      title: 'Finish meal plan',
      subtitle: 'Complete your meals',
      onPress: () => router.push('/(app)/meals'),
    };
  };

  const nextAction = getNextAction();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Top Status Strip */}
      <View style={styles.statusStrip}>
        <View style={styles.statusLeft}>
          <Text style={styles.statusLabel}>Today</Text>
          <Text style={styles.statusDate}>{todayDate}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>On Track</Text>
        </View>
      </View>

      {/* Tile 1: Today's Nutrition */}
      <TouchableOpacity
        style={styles.primaryTile}
        onPress={() => router.push('/(app)/meals')}
        activeOpacity={0.9}
      >
        <View style={[styles.tileHeader, styles.nutritionHeader]}>
          <Ionicons name="restaurant" size={24} color="#FFFFFF" />
          <Text style={styles.tileTitle}>Today's Nutrition</Text>
        </View>
        <View style={styles.tileContent}>
          <View style={styles.nutritionLayout}>
            <View style={styles.caloriesSection}>
              <Text style={styles.caloriesValue}>
                {todayMacros.calories > 0 ? todayMacros.calories : '—'}
              </Text>
              <Text style={styles.caloriesLabel}>Calories</Text>
            </View>
            <View style={styles.macrosRow}>
              <View style={styles.macroMiniStat}>
                <Text style={styles.macroMiniValue}>
                  {todayMacros.protein > 0 ? `${todayMacros.protein}g` : '—'}
                </Text>
                <Text style={styles.macroMiniLabel}>Protein</Text>
              </View>
              <View style={styles.macroMiniStat}>
                <Text style={styles.macroMiniValue}>
                  {todayMacros.carbs > 0 ? `${todayMacros.carbs}g` : '—'}
                </Text>
                <Text style={styles.macroMiniLabel}>Carbs</Text>
              </View>
              <View style={styles.macroMiniStat}>
                <Text style={styles.macroMiniValue}>
                  {todayMacros.fat > 0 ? `${todayMacros.fat}g` : '—'}
                </Text>
                <Text style={styles.macroMiniLabel}>Fat</Text>
              </View>
            </View>
          </View>

          {/* Progress Section */}
          {todayMacros.calories > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View style={[styles.progressBarFill, { width: `${Math.min(progressPercentage, 100)}%` }]} />
              </View>
              <View style={styles.progressStats}>
                <View style={styles.progressStatItem}>
                  <View style={[styles.progressDot, { backgroundColor: '#22c55e' }]} />
                  <Text style={styles.progressStatLabel}>Eaten</Text>
                  <Text style={styles.progressStatValue}>{eatenCalories}</Text>
                </View>
                <View style={styles.progressStatItem}>
                  <View style={[styles.progressDot, { backgroundColor: colors.borderLight }]} />
                  <Text style={styles.progressStatLabel}>Remaining</Text>
                  <Text style={styles.progressStatValue}>{remainingCalories}</Text>
                </View>
              </View>
              <View style={styles.mealCheckboxes}>
                {MEAL_TYPES.map((mealType) => {
                  const isCompleted = mealCompletionsHook.completions.some(
                    (c) => c.day_of_week === todayDay && c.meal_type === mealType
                  );
                  return (
                    <View
                      key={mealType}
                      style={[
                        styles.mealCheckbox,
                        isCompleted && styles.mealCheckboxCompleted
                      ]}
                    >
                      {isCompleted && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Tile 2: Today's Training */}
      <TouchableOpacity
        style={styles.primaryTile}
        onPress={() => router.push('/(app)/training')}
        activeOpacity={0.9}
      >
        <View style={[styles.tileHeader, styles.trainingHeader]}>
          <Ionicons name="fitness" size={24} color="#FFFFFF" />
          <Text style={styles.tileTitle}>Today's Training</Text>
        </View>
        <View style={styles.tileContent}>
          {isGuest || !trainingPlanHook.plan || trainingPlanHook.isLoading ? (
            <Text style={styles.noTrainingText}>No training plan yet</Text>
          ) : todayWorkout ? (
            <View style={styles.workoutSummary}>
              <Text style={styles.workoutType}>{todayWorkout.type || 'Workout'}</Text>
              {todayWorkout.distance && (
                <Text style={styles.workoutDetail}>{todayWorkout.distance}</Text>
              )}
              {todayWorkout.intensity && (
                <View style={styles.intensityBadge}>
                  <Text style={styles.intensityText}>{todayWorkout.intensity}</Text>
                </View>
              )}
              {todayWorkout.notes && (
                <Text style={styles.workoutNotes} numberOfLines={1}>
                  {todayWorkout.notes}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.noTrainingText}>Rest</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Bottom Row: This Week + Next Action */}
      <View style={styles.bottomRow}>
        {/* Left: This Week */}
        <TouchableOpacity
          style={[styles.insightTile, styles.progressTile]}
          onPress={() => router.push('/(app)/meals')}
          activeOpacity={0.8}
        >
          <Text style={styles.insightTitle}>This Week</Text>
          <Text style={styles.insightValue}>
            {weekProgress.filled}/{weekProgress.total}
          </Text>
          <Text style={styles.insightSubtext}>meals filled</Text>
        </TouchableOpacity>

        {/* Right: Next Action */}
        <TouchableOpacity
          style={[styles.insightTile, styles.nextActionTile]}
          onPress={nextAction.onPress}
          activeOpacity={0.8}
          disabled={loadingGroceryList && nextAction.title === 'View grocery list'}
        >
          <Text style={styles.insightTitle}>Next Action</Text>
          {loadingGroceryList && nextAction.title === 'View grocery list' ? (
            <View style={styles.nextActionLoading}>
              <ActivityIndicator size="small" color="#10B981" />
              <Text style={styles.nextActionTitle}>Generating...</Text>
            </View>
          ) : (
            <Text style={styles.nextActionTitle}>{nextAction.title}</Text>
          )}
          <Text style={styles.insightSubtext}>{nextAction.subtitle}</Text>
        </TouchableOpacity>
      </View>

      {/* Grocery List Modal */}
      <Modal
        visible={showGroceryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGroceryModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowGroceryModal(false)}>
          <Pressable style={styles.groceryModal} onPress={() => {}}>
            <View style={styles.groceryModalHeader}>
              <Text style={styles.groceryModalTitle}>Grocery List</Text>
              <View style={styles.groceryModalActions}>
                <TouchableOpacity
                  onPress={handleShareGroceryList}
                  style={styles.groceryModalAction}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="share-outline" size={22} color="#F6921D" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowGroceryModal(false)}
                  style={styles.groceryModalAction}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.groceryContent}>
              {(groceryList || []).map((category, categoryIndex) => (
                <View key={`category-${categoryIndex}`} style={styles.groceryCategory}>
                  <Text style={styles.groceryCategoryTitle}>{category.category || 'Uncategorized'}</Text>
                  {(category.items || []).map((item, itemIndex) => (
                    <View key={`item-${categoryIndex}-${itemIndex}`} style={styles.groceryItem}>
                      <Text style={styles.groceryItemText}>• {item}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 20,
  },
  statusStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    height: 30,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statusDate: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusPill: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.successText,
  },
  primaryTile: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 150,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  nutritionHeader: {
    backgroundColor: colors.primary,
  },
  trainingHeader: {
    backgroundColor: colors.info,
  },
  tileTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textInverse,
  },
  tileContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  nutritionLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  caloriesSection: {
    flex: 1,
  },
  caloriesValue: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },
  caloriesLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  macrosRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  macroMiniStat: {
    flex: 1,
    alignItems: 'center',
  },
  macroMiniValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  macroMiniLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tileActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  nutritionButton: {
    backgroundColor: colors.primary,
  },
  trainingButton: {
    backgroundColor: colors.info,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textInverse,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  nutritionSecondaryButton: {
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  workoutSummary: {
    flex: 1,
    justifyContent: 'center',
  },
  workoutType: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  workoutDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  workoutNotes: {
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  intensityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.infoLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  intensityText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.info,
  },
  noTrainingText: {
    fontSize: 16,
    color: colors.textTertiary,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  insightTile: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    minHeight: 98,
  },
  progressTile: {
    borderLeftColor: '#8B5CF6',
  },
  nextActionTile: {
    borderLeftColor: colors.success,
  },
  nextActionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  nextActionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },
  insightSubtext: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  // ---- Grocery Modal ----
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  groceryModal: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 18,
  },
  groceryModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  groceryModalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  groceryModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groceryModalAction: {
    padding: 6,
    marginLeft: 10,
  },
  groceryContent: {
    maxHeight: 520,
  },
  groceryCategory: {
    marginBottom: 16,
  },
  groceryCategoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  groceryItem: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  groceryItemText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  // ---- Progress Section (inside nutrition tile) ----
  progressSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  progressStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  progressStatValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '800',
  },
  mealCheckboxes: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  mealCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealCheckboxCompleted: {
    backgroundColor: '#22c55e',
  },
});
