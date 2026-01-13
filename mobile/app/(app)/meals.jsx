import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  Share,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMealPlan } from '../../hooks/useMealPlan';
import { useMealCompletions, getCurrentDayOfWeek } from '../../hooks/useMealCompletions';
import { fetchPersonalInfo, fetchActiveTrainingPlan } from '../../../shared/lib/dataClient';
import { apiClient } from '../../../shared/services/api';

// Import components
import { MealCard } from '../../components/meals/MealCard';
import { 
  WeekNavigation, 
  QuickActionsRow, 
  DaySelector, 
  MacrosSummary 
} from '../../components/meals/MealsHeader';
import { RecipeModal } from '../../components/meals/modals/RecipeModal';
import { GroceryListModal } from '../../components/meals/modals/GroceryListModal';
import { RegenerateReasonModal } from '../../components/meals/modals/RegenerateReasonModal';
import { MealOptionsBottomSheet } from '../../components/meals/modals/MealOptionsBottomSheet';
import { AnalyticsModal } from '../../components/meals/modals/AnalyticsModal';
import { MealPrepModal } from '../../components/meals/modals/MealPrepModal';
import { LogMealModal } from '../../components/meals/modals/LogMealModal';

// Import utilities
import {
  DAYS,
  DAY_LABELS,
  MEAL_TYPES,
  getMondayOfCurrentWeek,
  formatWeekDate,
  getPreviousWeek,
  getNextWeek,
  parseMeal,
  calculateDayMacros,
  countMeals,
} from '../../utils/mealHelpers';

// Animation constants
const EXPANDED_HEADER_HEIGHT = 270;
const COLLAPSED_HEADER_HEIGHT = 150;
const SCROLL_THRESHOLD = 80;
// Footer height: paddingVertical (8*2) + minHeight (60) = 76px
const FOOTER_HEIGHT = 24;

export default function MealsScreen() {
  const { user, isGuest } = useAuth();
  const { colors } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;

  const styles = getStyles(colors);

  // Calculate FAB position: footer height + safe area bottom + gap
  const insets = useSafeAreaInsets();
  const bottomOffset = FOOTER_HEIGHT;
  const fabBottom = bottomOffset;
  const fabLabelBottom = bottomOffset + 70;

  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay();
    return DAYS[today === 0 ? 6 : today - 1];
  });

  // Modal states
  const [showMealOptions, setShowMealOptions] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipe, setRecipe] = useState('');
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [groceryList, setGroceryList] = useState([]);
  const [loadingGroceryList, setLoadingGroceryList] = useState(false);
  const [showRegenerateReasonModal, setShowRegenerateReasonModal] = useState(false);
  const [regenerateReason, setRegenerateReason] = useState('');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showMealPrepModal, setShowMealPrepModal] = useState(false);
  const [showLogMealModal, setShowLogMealModal] = useState(false);
  const [logMealDefaultType, setLogMealDefaultType] = useState(undefined);

  // User data states
  const [userProfile, setUserProfile] = useState(null);
  const [foodPreferences, setFoodPreferences] = useState(null);
  const [trainingPlan, setTrainingPlan] = useState(null);

  const mealPlanHook = useMealPlan(user, isGuest);
  const { regenerateAllMeals, clearAllMeals, clearMeal, getMealStatus } = mealPlanHook;
  const mealCompletionsHook = useMealCompletions(user, isGuest);

  // Get current day of week for showing checkboxes only on today
  const todayDayOfWeek = getCurrentDayOfWeek();

  // Track if we've already celebrated today (to avoid repeated alerts)
  const [hasShownCelebration, setHasShownCelebration] = useState(false);

  // Celebration when all 5 meals are completed for today
  useEffect(() => {
    if (selectedDay !== todayDayOfWeek) {
      // Reset celebration flag when switching days
      setHasShownCelebration(false);
      return;
    }

    const todayCompletions = mealCompletionsHook.completions.filter(
      (c) => c.day_of_week === todayDayOfWeek
    );

    if (todayCompletions.length === 5 && !hasShownCelebration && !mealCompletionsHook.loading) {
      // All 5 meals completed! 🎉
      setHasShownCelebration(true);
      setTimeout(() => {
        Alert.alert(
          '🎉 Congratulations!',
          "You've completed all 5 meals for today! Keep up the great work!",
          [{ text: 'Awesome!', style: 'default' }]
        );
      }, 500); // Small delay for better UX
    }
  }, [mealCompletionsHook.completions, selectedDay, todayDayOfWeek, hasShownCelebration, mealCompletionsHook.loading]);

  // Load user data
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

  // Auto-save meal plan
  useEffect(() => {
    if (!mealPlanHook.currentWeekStarting || !mealPlanHook.mealPlan) return;

    const timeoutId = setTimeout(() => {
      mealPlanHook.saveCurrentMealPlan();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [mealPlanHook.mealPlan, mealPlanHook.currentWeekStarting]);

  // Handlers
  const handleMealPress = (mealType, parsedMeal) => {
    setSelectedMeal({ mealType, ...parsedMeal });
    setShowMealOptions(true);
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const handleEmptyMealPress = (mealType) => {
    const mealTypeLabel = capitalize(mealType);
    const options = ['Cancel', 'Generate with AI', 'Log Meal', 'Meal Prep'];
    const cancelButtonIndex = 0;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: `Add ${mealTypeLabel}`,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            // Generate with AI
            await mealPlanHook.generateSingleMeal(
              selectedDay,
              mealType,
              {
                userProfile,
                foodPreferences,
                trainingPlan,
              }
            );
          } else if (buttonIndex === 2) {
            // Log Meal
            setLogMealDefaultType(mealType);
            setShowLogMealModal(true);
          } else if (buttonIndex === 3) {
            // Meal Prep
            setShowMealPrepModal(true);
          }
        }
      );
    } else {
      // Android: use Alert
      Alert.alert(
        `Add ${mealTypeLabel}`,
        'Choose how to add this meal:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Generate with AI',
            onPress: async () => {
              await mealPlanHook.generateSingleMeal(
                selectedDay,
                mealType,
                {
                  userProfile,
                  foodPreferences,
                  trainingPlan,
                }
              );
            },
          },
          {
            text: 'Log Meal',
            onPress: () => {
              setLogMealDefaultType(mealType);
              setShowLogMealModal(true);
            },
          },
          {
            text: 'Meal Prep',
            onPress: () => {
              setShowMealPrepModal(true);
            },
          },
        ]
      );
    }
  };

  const handleGetRecipe = async () => {
    if (!selectedMeal || !mealPlanHook.mealPlan) return;

    setLoadingRecipe(true);
    setShowMealOptions(false);
    setShowRecipeModal(true); // Open modal immediately

    try {
      const mealDescription = mealPlanHook.mealPlan?.[selectedDay]?.[selectedMeal.mealType];
      const result = await apiClient.getRecipe({
        meal: mealDescription,
        day: selectedDay,
        mealType: selectedMeal.mealType,
      });

      if (result.success) {
        setRecipe(result.recipe || '');
      } else {
        setShowRecipeModal(false); // Close modal on error
        Alert.alert('Error', result.error || 'Failed to get recipe');
      }
    } catch (error) {
      console.error('Error getting recipe:', error);
      setShowRecipeModal(false); // Close modal on error
      Alert.alert('Error', 'Failed to get recipe. Please try again.');
    } finally {
      setLoadingRecipe(false);
    }
  };

  const handleRegenerate = () => {
    if (!selectedMeal) return;
    setShowMealOptions(false);
    setRegenerateReason('');
    setShowRegenerateReasonModal(true);
  };

  const handleRegenerateConfirm = async () => {
    if (!selectedMeal || !regenerateReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for regenerating this meal.');
      return;
    }

    setShowRegenerateReasonModal(false);
    await mealPlanHook.regenerateMeal(selectedDay, selectedMeal.mealType, regenerateReason.trim(), {
      userProfile,
      foodPreferences,
      trainingPlan,
    });
    setRegenerateReason('');
  };

  const handleDeleteMeal = () => {
    if (!selectedMeal) return;
    
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete ${selectedMeal.name || 'this meal'}?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setShowMealOptions(false) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setShowMealOptions(false);
            await clearMeal(selectedDay, selectedMeal.mealType);
          },
        },
      ]
    );
  };

  const handleMealPrepApply = (day, mealType, mealDescription) => {
    mealPlanHook.updateMeal(day, mealType, mealDescription);
  };

  const handleLogMeal = (day, mealType, mealDescription) => {
    mealPlanHook.updateMeal(day, mealType, mealDescription);
  };

  const handleGenerateMeals = async () => {
    const { allFilled } = getMealStatus();
    
    // If all meals are filled, show action sheet
    if (allFilled) {
      const options = ['Cancel', 'Regenerate All Meals', 'Clear All Meals'];
      const destructiveButtonIndex = 2;
      const cancelButtonIndex = 0;

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            cancelButtonIndex,
            destructiveButtonIndex,
          },
          async (buttonIndex) => {
            if (buttonIndex === 1) {
              // Regenerate All Meals
              await regenerateAllMeals(userProfile, foodPreferences, trainingPlan);
            } else if (buttonIndex === 2) {
              // Clear All Meals
              Alert.alert(
                'Clear All Meals',
                'Are you sure you want to clear all meals for this week?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                      await clearAllMeals();
                    },
                  },
                ]
              );
            }
          }
        );
      } else {
        // Android: use Alert
        Alert.alert(
          'Regenerate / Clear',
          'Choose an action:',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Regenerate All Meals',
              onPress: async () => {
                await regenerateAllMeals(userProfile, foodPreferences, trainingPlan);
              },
            },
            {
              text: 'Clear All Meals',
              style: 'destructive',
              onPress: async () => {
                Alert.alert(
                  'Clear All Meals',
                  'Are you sure you want to clear all meals for this week?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear',
                      style: 'destructive',
                      onPress: async () => {
                        await clearAllMeals();
                      },
                    },
                  ]
                );
              },
            },
          ]
        );
      }
    } else {
      // Normal generation flow - generate meals for the selected day
      await mealPlanHook.generateDay(selectedDay, userProfile, foodPreferences, trainingPlan);
    }
  };

  const handlePreviousWeek = async () => {
    const prevWeek = getPreviousWeek(mealPlanHook.currentWeekStarting);
    if (prevWeek) await mealPlanHook.loadMealPlanByWeek(prevWeek);
  };

  const handleNextWeek = async () => {
    const nextWeek = getNextWeek(mealPlanHook.currentWeekStarting);
    if (nextWeek) await mealPlanHook.loadMealPlanByWeek(nextWeek);
  };

  const handleCurrentWeek = async () => {
    const week = getMondayOfCurrentWeek();
    await mealPlanHook.loadMealPlanByWeek(week);
  };

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

  const handleShareRecipe = async () => {
    try {
      const mealTitle = selectedMeal?.name || 'Recipe';
      await Share.share({
        message: `${mealTitle}\n\n${recipe}`,
        title: mealTitle,
      });
    } catch (error) {
      console.error('Error sharing recipe:', error);
    }
  };

  // Computed values
  const hasMeals =
    !!mealPlanHook.mealPlan &&
    Object.values(mealPlanHook.mealPlan).some(
      (day) =>
        day &&
        Object.entries(day).some(
          ([mealType, meal]) =>
            !mealType.includes('_rating') && meal && typeof meal === 'string' && meal.trim()
        )
    );

  const { hasPartial } = countMeals(mealPlanHook.mealPlan);
  const { allFilled, hasAny } = getMealStatus();
  const dayMacros = mealPlanHook.mealPlan
    ? calculateDayMacros(mealPlanHook.mealPlan[selectedDay])
    : { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  // Check if there are any meals for the selected day
  const hasMealsForDay = mealPlanHook.mealPlan && mealPlanHook.mealPlan[selectedDay]
    ? MEAL_TYPES.some(mealType => {
        const meal = mealPlanHook.mealPlan[selectedDay][mealType];
        return meal && typeof meal === 'string' && meal.trim().length > 0;
      })
    : false;

  const isCurrentWeek = mealPlanHook.currentWeekStarting === getMondayOfCurrentWeek();

  // Animation interpolations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [EXPANDED_HEADER_HEIGHT, COLLAPSED_HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const weekNavOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const weekNavHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [56, 0],
    extrapolate: 'clamp',
  });

  const weekNavTranslateY = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [0, -40],
    extrapolate: 'clamp',
  });

  const macrosOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const macrosHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [110, 0],
    extrapolate: 'clamp',
  });

  const macrosTranslateY = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [0, -40],
    extrapolate: 'clamp',
  });

  const quickActionsPaddingTop = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [10, 4],
    extrapolate: 'clamp',
  });

  const quickActionsPaddingBottom = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [10, 8],
    extrapolate: 'clamp',
  });

  const dayPillsPaddingTop = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [10, 8],
    extrapolate: 'clamp',
  });

  const dayPillsPaddingBottom = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [10, 8],
    extrapolate: 'clamp',
  });

  const weekNavBorderWidth = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const macrosBorderWidth = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (mealPlanHook.isLoading && !hasMeals) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading meal plan...</Text>
      </View>
    );
  }

  const statusBannerHeight = (mealPlanHook.statusMessage || mealPlanHook.isGenerating) ? 48 : 0;

  return (
    <View style={styles.container}>
      {/* Status Banner */}
      {(mealPlanHook.statusMessage || mealPlanHook.isGenerating) ? (
        <View
          style={[
            styles.statusBanner,
            mealPlanHook.statusMessage?.includes('✅') && styles.statusBannerSuccess,
            mealPlanHook.statusMessage?.includes('❌') && styles.statusBannerError,
          ]}
        >
          {mealPlanHook.isGenerating ? (
            <ActivityIndicator
              size="small"
              color={
                mealPlanHook.statusMessage?.includes('❌')
                  ? '#DC2626'
                  : mealPlanHook.statusMessage?.includes('✅')
                  ? '#059669'
                  : '#1E40AF'
              }
              style={{ marginRight: 8 }}
            />
          ) : null}

          <Text
            style={[
              styles.statusText,
              mealPlanHook.statusMessage?.includes('✅') && { color: '#065F46' },
              mealPlanHook.statusMessage?.includes('❌') && { color: '#991B1B' },
            ]}
            numberOfLines={2}
          >
            {mealPlanHook.isGenerating && !mealPlanHook.statusMessage
              ? 'Generating personalized meal plan...'
              : mealPlanHook.statusMessage}
          </Text>
        </View>
      ) : null}

      {/* Collapsible Header Card */}
      <Animated.View
        style={[
          styles.headerCard,
          {
            height: headerHeight,
            position: 'absolute',
            top: statusBannerHeight,
            left: 0,
            right: 0,
            zIndex: 10,
            marginHorizontal: 12,
            marginTop: 10,
          },
        ]}
      >
        <WeekNavigation
          currentWeekStarting={mealPlanHook.currentWeekStarting}
          isCurrentWeek={isCurrentWeek}
          formatWeekDate={formatWeekDate}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
          onCurrentWeek={handleCurrentWeek}
          isGuest={isGuest}
          user={user}
          animatedStyle={{
            opacity: weekNavOpacity,
            maxHeight: weekNavHeight,
            overflow: 'hidden',
            borderBottomWidth: weekNavBorderWidth,
            transform: [{ translateY: weekNavTranslateY }],
          }}
        />

        <QuickActionsRow
          hasMeals={hasMeals}
          onAnalytics={() => setShowAnalyticsModal(true)}
          onGroceryList={generateGroceryList}
          onMealPrep={() => setShowMealPrepModal(true)}
          onLogMeal={() => setShowLogMealModal(true)}
          loadingGroceryList={loadingGroceryList}
          animatedStyle={{
            paddingTop: quickActionsPaddingTop,
            paddingBottom: quickActionsPaddingBottom,
          }}
        />

        <DaySelector
          days={DAYS}
          dayLabels={DAY_LABELS}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          todayDayOfWeek={todayDayOfWeek}
          animatedStyle={{
            paddingTop: dayPillsPaddingTop,
            paddingBottom: dayPillsPaddingBottom,
          }}
        />

        <MacrosSummary
          dayMacros={dayMacros}
          hasMealsForDay={hasMealsForDay}
          animatedStyle={{
            opacity: macrosOpacity,
            maxHeight: macrosHeight,
            overflow: 'hidden',
            borderTopWidth: macrosBorderWidth,
            transform: [{ translateY: macrosTranslateY }],
          }}
        />
      </Animated.View>

      {/* Body */}
      {!hasMeals ? (
        <View style={[styles.emptyState, { marginTop: EXPANDED_HEADER_HEIGHT + statusBannerHeight + 20 }]}>
          <Ionicons name="restaurant-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No meal plan yet</Text>
          <Text style={styles.emptyStateText}>
            Tap the + button to generate your personalized weekly meal plan!
          </Text>
        </View>
      ) : (
        <Animated.ScrollView
          style={styles.mealsScroll}
          contentContainerStyle={[
            styles.mealsContent,
            { paddingTop: EXPANDED_HEADER_HEIGHT + statusBannerHeight + 20 },
          ]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {MEAL_TYPES.map((mealType) => {
            const isToday = selectedDay === todayDayOfWeek;
            const isCompleted = mealCompletionsHook.completions.some(
              (c) => c.day_of_week === selectedDay && c.meal_type === mealType
            );
            
            return (
              <MealCard
                key={mealType}
                mealType={mealType}
                meal={mealPlanHook.mealPlan?.[selectedDay]?.[mealType] || ''}
                rating={mealPlanHook.mealPlan?.[selectedDay]?.[`${mealType}_rating`] || 0}
                onRate={(rating) => mealPlanHook.rateMeal(selectedDay, mealType, rating)}
                onMealPress={handleMealPress}
                onEmptyPress={handleEmptyMealPress}
                parseMeal={parseMeal}
                showCheckbox={isToday}
                isCompleted={isCompleted}
                onToggleComplete={() => mealCompletionsHook.toggleMealCompletion(selectedDay, mealType)}
              />
            );
          })}
        </Animated.ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: fabBottom }]} 
        onPress={handleGenerateMeals} 
        disabled={mealPlanHook.isGenerating}
      >
        {mealPlanHook.isGenerating ? (
          <ActivityIndicator size="small" color={colors.textInverse} />
        ) : (
          <Ionicons name="add" size={28} color={colors.textInverse} />
        )}
      </TouchableOpacity>

      {!mealPlanHook.isGenerating ? (
        <View style={[styles.fabLabel, { bottom: fabLabelBottom }]}>
          <Text style={styles.fabLabelText}>
            {allFilled ? 'Regenerate / Clear' : hasPartial ? 'Generate Remaining' : 'Generate Meals'}
          </Text>
        </View>
      ) : null}

      {/* Modals */}
      <MealOptionsBottomSheet
        visible={showMealOptions}
        mealName={selectedMeal?.name}
        rating={mealPlanHook.mealPlan?.[selectedDay]?.[`${selectedMeal?.mealType}_rating`]}
        onRate={(rating) => mealPlanHook.rateMeal(selectedDay, selectedMeal?.mealType, rating)}
        onGetRecipe={handleGetRecipe}
        onRegenerate={handleRegenerate}
        onDelete={handleDeleteMeal}
        onClose={() => setShowMealOptions(false)}
        loadingRecipe={loadingRecipe}
      />

      <RecipeModal
        visible={showRecipeModal}
        recipe={recipe}
        mealName={selectedMeal?.name}
        onClose={() => setShowRecipeModal(false)}
        onShare={handleShareRecipe}
        loading={loadingRecipe}
      />

      <GroceryListModal
        visible={showGroceryModal}
        groceryList={groceryList}
        onShare={handleShareGroceryList}
        onClose={() => setShowGroceryModal(false)}
      />

      <RegenerateReasonModal
        visible={showRegenerateReasonModal}
        reason={regenerateReason}
        onChangeReason={setRegenerateReason}
        onConfirm={handleRegenerateConfirm}
        onClose={() => {
          setShowRegenerateReasonModal(false);
          setRegenerateReason('');
        }}
      />

      {/* Analytics Modal */}
      <AnalyticsModal
        visible={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        mealPlan={mealPlanHook.mealPlan}
        userProfile={userProfile}
        trainingPlan={trainingPlan}
      />

      <MealPrepModal
        visible={showMealPrepModal}
        onClose={() => setShowMealPrepModal(false)}
        onApply={handleMealPrepApply}
        userProfile={userProfile}
        foodPreferences={foodPreferences}
        isGuest={isGuest}
      />

      <LogMealModal
        visible={showLogMealModal}
        onClose={() => {
          setShowLogMealModal(false);
          setLogMealDefaultType(undefined);
        }}
        onLog={handleLogMeal}
        defaultDay={selectedDay}
        defaultMealType={logMealDefaultType}
        isGuest={isGuest}
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBorder,
  },
  statusBannerSuccess: {
    backgroundColor: colors.successLight,
    borderBottomColor: colors.successBorder,
  },
  statusBannerError: {
    backgroundColor: colors.errorLight,
    borderBottomColor: colors.errorBorder,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  headerCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  mealsScroll: {
    flex: 1,
  },
  mealsContent: {
    padding: 16,
    paddingBottom: 140,
  },
  fab: {
    position: 'absolute',
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  fabLabel: {
    position: 'absolute',
    right: 18,
    backgroundColor: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  fabLabelText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textInverse,
  },
});

