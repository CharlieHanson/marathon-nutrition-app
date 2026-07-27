import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  Share,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { useTheme } from '../../context/ThemeContext';
import { useHeaderSlotActions } from '../../context/HeaderSlotContext';
import { useMealPlan } from '../../hooks/useMealPlan';
import { useTrainingPlan } from '../../hooks/useTrainingPlan';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useMealCompletions, getCurrentDayOfWeek } from '../../hooks/useMealCompletions';
import { saveMeal } from '../../../shared/lib/dataClient';
import { apiClient } from '../../../shared/services/api';

// Import components
import { MealCard } from '../../components/meals/MealCard';
import { 
  QuickActionsRow, 
  DaySelector, 
} from '../../components/meals/MealsHeader';
import { RecipeModal } from '../../components/meals/modals/RecipeModal';
import { GroceryListModal } from '../../components/meals/modals/GroceryListModal';
import { RegenerateReasonModal } from '../../components/meals/modals/RegenerateReasonModal';
import { MealOptionsBottomSheet } from '../../components/meals/modals/MealOptionsBottomSheet';
import { EmptyMealOptionsBottomSheet } from '../../components/meals/modals/EmptyMealOptionsBottomSheet';
import { AnalyticsModal } from '../../components/meals/modals/AnalyticsModal';
import { MealPrepModal } from '../../components/meals/modals/MealPrepModal';
import { LogMealModal } from '../../components/meals/modals/LogMealModal';
import { ErrorState } from '../../components/ErrorState';
import { ServingsPickerModal } from '../../components/meals/modals/ServingsPickerModal';
import { TourTarget } from '../../components/tour/TourTarget';
import { useProductTour } from '../../context/ProductTourContext';

// Import utilities
import {
  DAYS,
  MEAL_TYPES,
  getMondayOfCurrentWeek,
  getPreviousWeek,
  getNextWeek,
  getWeekDateNumbers,
  parseMeal,
  countMeals,
  getDayMealToggles,
  getActiveMealTypes,
  isPastDay,
} from '../../utils/mealHelpers';
import { MealTypeToggles } from '../../components/meals/MealTypeToggles';
import { useUsageLimits, DAILY_LIMITS } from '../../hooks/useUsageLimits';
import { usePostHog } from 'posthog-react-native';
import { capture } from '../../lib/analytics';
import { MealsSkeleton } from '../../components/ui/Skeleton';

// Footer height: paddingVertical (8*2) + minHeight (60) = 76px
const FOOTER_HEIGHT = 24;

const OFFLINE_ALERT = () =>
  Alert.alert('No Connection', 'Please check your internet connection and try again.');

export default function MealsScreen() {
  const posthog = usePostHog();
  const { user, isGuest } = useAuth();
  const { isConnected } = useNetwork();
  const { colors } = useTheme();
  const { notifyTargetDismissed, notifyTargetPress, isActive, currentStep, next } = useProductTour();
  const { setHeaderSlot, clearHeaderSlot } = useHeaderSlotActions();
  const isFocused = useIsFocused();

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
  const [showEmptyMealOptions, setShowEmptyMealOptions] = useState(false);
  const [emptyMealType, setEmptyMealType] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipe, setRecipe] = useState('');
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [groceryList, setGroceryList] = useState([]);
  const [loadingGroceryList, setLoadingGroceryList] = useState(false);
  const [showRegenerateReasonModal, setShowRegenerateReasonModal] = useState(false);
  const [regenerateReason, setRegenerateReason] = useState('');
  const [savingMeal, setSavingMeal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showMealPrepModal, setShowMealPrepModal] = useState(false);
  const [mealPrepDefaultType, setMealPrepDefaultType] = useState(undefined);
  const [showLogMealModal, setShowLogMealModal] = useState(false);
  const [logMealDefaultType, setLogMealDefaultType] = useState(undefined);
  const [showServingsPicker, setShowServingsPicker] = useState(false);

  // Debug prompt display
  const [debugPrompt, setDebugPrompt] = useState(null);
  const [showDebugPrompt, setShowDebugPrompt] = useState(false);

  const mealPlanHook = useMealPlan(user, isGuest);
  const trainingPlanHook = useTrainingPlan(user, isGuest);
  const profileHook = useUserProfile(user, isGuest);
  const { regenerateAllMeals, clearAllMeals, clearMeal, getMealStatus, setDayMealToggles } = mealPlanHook;
  const mealCompletionsHook = useMealCompletions(user, isGuest);
  const { canDo, remaining, refetch: refetchLimits } = useUsageLimits(user, isGuest);

  const userProfile =
    profileHook.rawUserProfile ||
    (profileHook.profile
      ? {
          name: profileHook.profile.name,
          age: profileHook.profile.age,
          gender: profileHook.profile.gender,
          height: profileHook.profile.height,
          weight: profileHook.profile.weight,
          goal: profileHook.profile.goal,
          activity_level: profileHook.profile.activityLevel,
          objective: profileHook.profile.objective,
          dietary_restrictions: profileHook.profile.dietaryRestrictions,
        }
      : null);
  const foodPreferences = profileHook.foodPreferences;
  const trainingPlan = trainingPlanHook.plan;

  // Close meal option sheets when leaving meals_generate or ending the tour.
  // Local state only — do not notifyTargetDismissed (would double-advance).
  useEffect(() => {
    if (isActive && currentStep?.id === 'meals_generate') return;
    setShowEmptyMealOptions(false);
    setShowMealOptions(false);
    setEmptyMealType(null);
    setSelectedMeal(null);
  }, [isActive, currentStep?.id]);

  // Skip generate step when breakfast already exists for the selected day (replay path).
  // Only check on step enter — post-generate advance is handled in handleEmptyGenerateWithAI.
  useEffect(() => {
    if (!isActive || currentStep?.id !== 'meals_generate') return;
    const breakfast = mealPlanHook.mealPlan?.[selectedDay]?.breakfast;
    const hasBreakfast =
      typeof breakfast === 'string' &&
      breakfast.trim().length > 0 &&
      breakfast !== '__generating__';
    if (!hasBreakfast) return;
    next();
    // intentionally omit mealPlan — avoid double-advancing after a fresh generate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, currentStep?.id, selectedDay, next]);

  // Get current day of week for showing checkboxes only on today
  const todayDayOfWeek = getCurrentDayOfWeek();
  const isCurrentWeek = mealPlanHook.currentWeekStarting === getMondayOfCurrentWeek();

  // Track if we've already celebrated today (to avoid repeated alerts)
  const [hasShownCelebration, setHasShownCelebration] = useState(false);

  // Celebration when all active meals are completed for today
  useEffect(() => {
    if (!isCurrentWeek || selectedDay !== todayDayOfWeek) {
      // Reset celebration flag when switching days
      setHasShownCelebration(false);
      return;
    }

    const todayDayMeals = mealPlanHook.mealPlan?.[todayDayOfWeek] || {};
    const todayActiveTypes = getActiveMealTypes(getDayMealToggles(todayDayMeals));
    const todayCompletions = mealCompletionsHook.completions.filter(
      (c) => c.day_of_week === todayDayOfWeek
    );

    if (
      todayActiveTypes.length > 0 &&
      todayCompletions.length >= todayActiveTypes.length &&
      !hasShownCelebration &&
      !mealCompletionsHook.loading
    ) {
      setHasShownCelebration(true);
      setTimeout(() => {
        Alert.alert(
          '🎉 Congratulations!',
          `You've completed all ${todayActiveTypes.length} meals for today! Keep up the great work!`,
          [{ text: 'Awesome!', style: 'default' }]
        );
      }, 500); // Small delay for better UX
    }
  }, [mealCompletionsHook.completions, selectedDay, todayDayOfWeek, isCurrentWeek, hasShownCelebration, mealCompletionsHook.loading, mealPlanHook.mealPlan]);

  // Auto-save lives in MealPlanProvider (single writer).
  // Handlers
  const handleMealPress = (mealType, parsedMeal) => {
    setSelectedMeal({ mealType, ...parsedMeal });
    setShowMealOptions(true);
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const handleEmptyMealPress = (mealType) => {
    setEmptyMealType(mealType);
    setShowEmptyMealOptions(true);
  };

  const closeEmptyMealOptions = () => {
    setShowEmptyMealOptions(false);
    setEmptyMealType(null);
    notifyTargetDismissed('meals-generate-action');
  };

  const handleEmptyGenerateWithAI = async () => {
    if (!emptyMealType) return;
    const mealType = emptyMealType;
    const waitingForTourMeal =
      isActive && currentStep?.id === 'meals_generate';
    setShowEmptyMealOptions(false);
    setEmptyMealType(null);
    if (isConnected === false) {
      OFFLINE_ALERT();
      if (waitingForTourMeal) {
        // Generation didn't start — move on so the tour isn't stuck hidden.
        next();
      }
      return;
    }
    await mealPlanHook.generateSingleMeal(
      selectedDay,
      mealType,
      { userProfile, foodPreferences, trainingPlan },
    );
    refetchLimits();
    // Wait for generation to finish before showing the next tour step.
    if (waitingForTourMeal) {
      next();
    }
  };

  const handleGetRecipe = async () => {
    if (!selectedMeal || !mealPlanHook.mealPlan) return;
    if (isConnected === false) {
      OFFLINE_ALERT();
      return;
    }

    // Show servings picker first
    setShowMealOptions(false);
    setShowServingsPicker(true);
  };

  const handleServingsConfirm = async (servings) => {
    if (!canDo('recipe_generation')) {
      Alert.alert(
        'Daily Limit Reached',
        `You've used all ${DAILY_LIMITS.recipe_generation} recipe generations for today. Limits reset at midnight.`
      );
      return;
    }

    setShowServingsPicker(false);
    setLoadingRecipe(true);
    setShowRecipeModal(true); // Open modal immediately

    try {
      const mealDescription = mealPlanHook.mealPlan?.[selectedDay]?.[selectedMeal.mealType];
      const parsed = parseMeal(mealDescription);
      const result = await apiClient.getRecipe({
        userId: user?.id,
        meal: mealDescription,
        description: selectedMeal.name || parsed.name || '',
        mealType: selectedMeal.mealType,
        macros: {
          calories: selectedMeal.calories ?? parsed.calories ?? 0,
          protein: selectedMeal.protein ?? parsed.protein ?? 0,
          carbs: selectedMeal.carbs ?? parsed.carbs ?? 0,
          fat: selectedMeal.fat ?? parsed.fat ?? 0,
        },
        day: selectedDay,
        servings: servings,
        dislikes: foodPreferences?.dislikes || '',
        dietaryRestrictions:
          userProfile?.dietary_restrictions || userProfile?.dietaryRestrictions || '',
      });

      if (result.success) {
        setRecipe(result.recipe || '');
        refetchLimits();
        capture(posthog, 'recipe_viewed', { meal_type: selectedMeal.mealType });
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

  const handleSaveMeal = async () => {
    if (!selectedMeal || !user?.id) return;
    if (isConnected === false) {
      OFFLINE_ALERT();
      return;
    }

    const fullMealString = mealPlanHook.mealPlan?.[selectedDay]?.[selectedMeal.mealType];
    if (!fullMealString || typeof fullMealString !== 'string') {
      Alert.alert('Error', 'Could not save meal. Please try again.');
      return;
    }

    const name = selectedMeal.name || parseMeal(fullMealString).name || 'Meal';

    setSavingMeal(true);
    try {
      const { error } = await saveMeal(user.id, {
        name,
        fullDescription: fullMealString,
        mealType: selectedMeal.mealType,
      });
      setShowMealOptions(false);
      if (error) {
        Alert.alert('Error', error.message || 'Failed to save meal.');
      } else {
        Alert.alert('Success', 'Meal saved!');
      }
    } catch (err) {
      console.error('Save meal error:', err);
      Alert.alert('Error', err.message || 'Failed to save meal.');
    } finally {
      setSavingMeal(false);
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
    if (isConnected === false) {
      OFFLINE_ALERT();
      return;
    }
    if (!canDo('meal_generation')) {
      setShowRegenerateReasonModal(false);
      setRegenerateReason('');
      Alert.alert(
        'Daily Limit Reached',
        `You've used all ${DAILY_LIMITS.meal_generation} meal generations for today. Limits reset at midnight.`
      );
      return;
    }

    setShowRegenerateReasonModal(false);
    await mealPlanHook.regenerateMeal(selectedDay, selectedMeal.mealType, regenerateReason.trim(), {
      userProfile,
      foodPreferences,
      trainingPlan,
      userId: user?.id,
    });
    refetchLimits();
    setRegenerateReason('');
  };

  const handleDeleteMealForCard = (day, mealType) => {
    const mealDesc = mealPlanHook.mealPlan?.[day]?.[mealType];
    const name = typeof mealDesc === 'string' && mealDesc.trim()
      ? (() => { try { const p = parseMeal(mealDesc); return p?.name; } catch { return 'this meal'; } })()
      : 'this meal';

    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await clearMeal(day, mealType);
            await mealCompletionsHook.removeMealCompletion(day, mealType);
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

  // Helper to get meal status for a specific day
  const getDayMealStatus = (day) => {
    const dayMeals = mealPlanHook.mealPlan?.[day] || {};
    const activeTypes = getActiveMealTypes(getDayMealToggles(dayMeals));
    let filled = 0;
    let total = activeTypes.length;

    activeTypes.forEach((mealType) => {
      const meal = dayMeals[mealType];
      if (meal && typeof meal === 'string' && meal.trim().length > 0) {
        filled++;
      }
    });

    return {
      filled,
      total,
      allFilled: filled === total,
      hasAny: filled > 0,
      hasPartial: filled > 0 && filled < total,
    };
  };

  const handleGenerateMeals = async () => {
    console.log('🔵 FAB PRESSED - handleGenerateMeals called');
    if (isConnected === false) {
      OFFLINE_ALERT();
      return;
    }
    if (!canDo('meal_generation')) {
      Alert.alert(
        'Daily Limit Reached',
        `You've used all ${DAILY_LIMITS.meal_generation} meal generations for today. Limits reset at midnight.`
      );
      return;
    }
    const dayStatus = getDayMealStatus(selectedDay);
    
    // Debug callback intentionally omitted — enabling debug forces a huge SSE
    // payload after OpenAI returns and commonly trips the 120s client timeout.
    const runGenerateDay = () =>
      mealPlanHook.generateDay(selectedDay, userProfile, foodPreferences, trainingPlan);

    // If all meals are filled for this day, show action sheet
    if (dayStatus.allFilled) {
      const options = ['Cancel', 'Regenerate Day', 'Clear Day'];
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
              // Regenerate Day
              await mealPlanHook.clearDay(selectedDay);
              await runGenerateDay();
              refetchLimits();
            } else if (buttonIndex === 2) {
              // Clear Day
              Alert.alert(
                'Clear Day',
                `Are you sure you want to clear all meals for ${capitalize(selectedDay)}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                      await mealPlanHook.clearDay(selectedDay);
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
          `Choose an action for ${capitalize(selectedDay)}:`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Regenerate Day',
              onPress: async () => {
                await mealPlanHook.clearDay(selectedDay);
                await runGenerateDay();
                refetchLimits();
              },
            },
            {
              text: 'Clear Day',
              style: 'destructive',
              onPress: async () => {
                Alert.alert(
                  'Clear Day',
                  `Are you sure you want to clear all meals for ${capitalize(selectedDay)}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear',
                      style: 'destructive',
                      onPress: async () => {
                        await mealPlanHook.clearDay(selectedDay);
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
      await runGenerateDay();
      refetchLimits();
    }
  };

  const handlePreviousWeek = useCallback(async () => {
    const prevWeek = getPreviousWeek(mealPlanHook.currentWeekStarting);
    if (prevWeek) await mealPlanHook.loadMealPlanByWeek(prevWeek);
  }, [mealPlanHook.currentWeekStarting, mealPlanHook.loadMealPlanByWeek]);

  const handleNextWeek = useCallback(async () => {
    const nextWeek = getNextWeek(mealPlanHook.currentWeekStarting);
    if (nextWeek) await mealPlanHook.loadMealPlanByWeek(nextWeek);
  }, [mealPlanHook.currentWeekStarting, mealPlanHook.loadMealPlanByWeek]);

  // Keep latest week handlers in a ref so the header-slot effect doesn't
  // re-run every render (useMealPlan returns a new object each time).
  const weekNavRef = useRef({
    onPreviousWeek: handlePreviousWeek,
    onNextWeek: handleNextWeek,
  });
  weekNavRef.current.onPreviousWeek = handlePreviousWeek;
  weekNavRef.current.onNextWeek = handleNextWeek;

  const generateGroceryList = async () => {
    if (isConnected === false) {
      OFFLINE_ALERT();
      return;
    }
    if (!canDo('grocery_list')) {
      Alert.alert(
        'Daily Limit Reached',
        `You've used all ${DAILY_LIMITS.grocery_list} grocery list generations for today. Limits reset at midnight.`
      );
      return;
    }
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
        userId: user?.id,
        meals: allMeals,
        userProfile,
      });

      if (result.success && result.groceryList) {
        setGroceryList(result.groceryList);
        setShowGroceryModal(true);
        refetchLimits();
        capture(posthog, 'grocery_list_generated');
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

  // Get day-specific meal status for FAB
  const dayMealStatus = getDayMealStatus(selectedDay);

  const selectedDayMeals = mealPlanHook.mealPlan?.[selectedDay] || {};
  const dayToggles = getDayMealToggles(selectedDayMeals);
  const activeTypes = getActiveMealTypes(dayToggles);

  const showFab = !dayMealStatus.allFilled && canDo('meal_generation');
  const scrollBottomPadding = showFab ? 96 : 20;

  const weekDateNumbers = useMemo(
    () => getWeekDateNumbers(mealPlanHook.currentWeekStarting),
    [mealPlanHook.currentWeekStarting]
  );

  // Day strip in the global header — useLayoutEffect so it lands before first paint
  // (useFocusEffect is post-paint and lets meal cards shift down when the strip appears).
  useLayoutEffect(() => {
    if (!isFocused) {
      clearHeaderSlot('meals');
      return undefined;
    }

    setHeaderSlot(
      <DaySelector
        days={DAYS}
        weekDateNumbers={weekDateNumbers}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        todayDayOfWeek={todayDayOfWeek}
        isCurrentWeek={isCurrentWeek}
        onPreviousWeek={() => weekNavRef.current.onPreviousWeek()}
        onNextWeek={() => weekNavRef.current.onNextWeek()}
        weekNavDisabled={!user || isGuest}
        animatedStyle={{
          paddingHorizontal: 0,
          paddingTop: 4,
          paddingBottom: 10,
          marginBottom: 0,
        }}
      />,
      'meals'
    );

    return () => clearHeaderSlot('meals');
  }, [
    clearHeaderSlot,
    isCurrentWeek,
    isFocused,
    isGuest,
    selectedDay,
    setHeaderSlot,
    todayDayOfWeek,
    user,
    weekDateNumbers,
  ]);

  if (mealPlanHook.fetchError && !mealPlanHook.isLoading) {
    return (
      <ErrorState
        message={mealPlanHook.fetchError}
        onRetry={mealPlanHook.refetchCurrentWeek}
      />
    );
  }

  if (mealPlanHook.isLoading && !hasMeals) {
    return <MealsSkeleton />;
  }

  return (
    <View style={styles.container}>
      {/* Status Banner — errors only; generation progress lives on the meal cards */}
      {mealPlanHook.statusMessage?.includes('❌') ? (
        <View style={[styles.statusBanner, styles.statusBannerError]}>
          <Text style={[styles.statusText, { color: '#991B1B' }]} numberOfLines={2}>
            {mealPlanHook.statusMessage}
          </Text>
        </View>
      ) : null}

      {/* Debug Prompt Display */}
      {showDebugPrompt && debugPrompt && (
        <View style={styles.debugPromptContainer}>
          <View style={styles.debugPromptHeader}>
            <Text style={styles.debugPromptTitle}>🐛 AI Prompt Sent</Text>
            <TouchableOpacity onPress={() => setShowDebugPrompt(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.debugPromptContent}>
            <ScrollView>
              <Text style={styles.debugPromptText}>{debugPrompt}</Text>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Body — always show meal cards (including empty slots) */}
      <ScrollView
        style={styles.mealsScroll}
        removeClippedSubviews={false}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: scrollBottomPadding,
          // Inset lives here (not on Layout) so card scale can paint into it.
          paddingHorizontal: 16,
        }}
      >
        <QuickActionsRow
          hasMeals={hasMeals}
          onAnalytics={() => setShowAnalyticsModal(true)}
          onGroceryList={generateGroceryList}
          onMealPrep={() => setShowMealPrepModal(true)}
          onLogMeal={() => setShowLogMealModal(true)}
          loadingGroceryList={loadingGroceryList}
          groceryRemaining={remaining('grocery_list')}
          canGenerate={canDo('meal_generation')}
          animatedStyle={styles.quickActionsInScroll}
        />

        {!isPastDay(selectedDay, mealPlanHook.currentWeekStarting) && (
          <MealTypeToggles
            includeSnacks={dayToggles.includeSnacks}
            includeDessert={dayToggles.includeDessert}
            onToggleSnacks={(val) => setDayMealToggles(selectedDay, { includeSnacks: val, includeDessert: dayToggles.includeDessert })}
            onToggleDessert={(val) => setDayMealToggles(selectedDay, { includeSnacks: dayToggles.includeSnacks, includeDessert: val })}
            disabled={mealPlanHook.isGenerating || isGuest}
            dayMeals={selectedDayMeals}
          />
        )}
        {activeTypes.map((mealType, index) => {
          const isToday = isCurrentWeek && selectedDay === todayDayOfWeek;
          const isCompleted = isToday && mealCompletionsHook.completions.some(
            (c) => c.day_of_week === selectedDay && c.meal_type === mealType
          );

          const card = (
            <MealCard
              mealType={mealType}
              meal={mealPlanHook.mealPlan?.[selectedDay]?.[mealType] || ''}
              rating={mealPlanHook.mealPlan?.[selectedDay]?.[`${mealType}_rating`] || 0}
              onRate={(rating) => mealPlanHook.rateMeal(selectedDay, mealType, rating)}
              onMealPress={
                index === 0
                  ? (type, parsed) => {
                      notifyTargetPress('meals-first-slot');
                      // Filled breakfast → meals_generate is skipped; don't open regenerate sheet
                      if (isActive && currentStep?.id === 'meals_overview') return;
                      handleMealPress(type, parsed);
                    }
                  : handleMealPress
              }
              onEmptyPress={
                index === 0
                  ? (type) => {
                      notifyTargetPress('meals-first-slot');
                      handleEmptyMealPress(type);
                    }
                  : handleEmptyMealPress
              }
              onDelete={() => handleDeleteMealForCard(selectedDay, mealType)}
              parseMeal={parseMeal}
              showCheckbox={isToday}
              isCompleted={isCompleted}
              onToggleComplete={() => mealCompletionsHook.toggleMealCompletion(selectedDay, mealType)}
            />
          );

          if (index === 0) {
            return (
              <TourTarget key={`${selectedDay}-${mealType}`} id="meals-first-slot">
                {card}
              </TourTarget>
            );
          }

          return <React.Fragment key={`${selectedDay}-${mealType}`}>{card}</React.Fragment>;
        })}
        <Text style={styles.medicalDisclaimer}>
          AI-generated meals and recipes are suggestions and for informational purposes only - not
          professional or medical advice.
        </Text>
      </ScrollView>

      {/* FAB — only show when the day has at least one empty meal AND limit not reached */}
      {!showFab ? null : (
        <>
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
                {dayMealStatus.hasPartial ? 'Generate Remaining' : 'Generate Meals'}
              </Text>
            </View>
          ) : null}
        </>
      )}

      {/* Modals */}
      <MealOptionsBottomSheet
        visible={showMealOptions}
        mealName={selectedMeal?.name}
        rating={mealPlanHook.mealPlan?.[selectedDay]?.[`${selectedMeal?.mealType}_rating`]}
        onRate={(rating) => mealPlanHook.rateMeal(selectedDay, selectedMeal?.mealType, rating)}
        onSaveMeal={!isGuest && user?.id ? handleSaveMeal : undefined}
        onGetRecipe={handleGetRecipe}
        onRegenerate={handleRegenerate}
        onClose={() => {
          setShowMealOptions(false);
          notifyTargetDismissed('meals-generate-action');
        }}
        loadingRecipe={loadingRecipe}
        savingMeal={savingMeal}
        canRegenerate={canDo('meal_generation')}
      />

      <EmptyMealOptionsBottomSheet
        visible={showEmptyMealOptions}
        mealTypeLabel={emptyMealType ? capitalize(emptyMealType) : ''}
        canGenerate={canDo('meal_generation')}
        showMealPrep={
          !!emptyMealType &&
          !['snacks', 'dessert'].includes(emptyMealType) &&
          canDo('meal_generation')
        }
        onGenerate={handleEmptyGenerateWithAI}
        onLogMeal={() => {
          const mealType = emptyMealType;
          setShowEmptyMealOptions(false);
          setEmptyMealType(null);
          setLogMealDefaultType(mealType);
          setShowLogMealModal(true);
          notifyTargetDismissed('meals-generate-action');
        }}
        onMealPrep={() => {
          const mealType = emptyMealType;
          setShowEmptyMealOptions(false);
          setEmptyMealType(null);
          setMealPrepDefaultType(mealType);
          setShowMealPrepModal(true);
          notifyTargetDismissed('meals-generate-action');
        }}
        onClose={closeEmptyMealOptions}
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
        onClose={() => {
          setShowMealPrepModal(false);
          setMealPrepDefaultType(undefined);
        }}
        onApply={handleMealPrepApply}
        userProfile={userProfile}
        foodPreferences={foodPreferences}
        isGuest={isGuest}
        defaultMealType={mealPrepDefaultType}
        userId={user?.id}
        canGenerate={canDo('meal_generation')}
        mealPrepRemaining={remaining('meal_generation')}
        onGenerateSuccess={refetchLimits}
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
        userId={user?.id}
        mealPlan={mealPlanHook.mealPlan}
      />

      <ServingsPickerModal
        visible={showServingsPicker}
        onClose={() => setShowServingsPicker(false)}
        onConfirm={handleServingsConfirm}
        mealName={selectedMeal?.name}
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
    paddingHorizontal: 30,
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
  quickActionsInScroll: {
    marginBottom: 10,
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
  medicalDisclaimer: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textTertiary || colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 34,
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
    right: 34,
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
  debugPromptContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    maxHeight: 300,
    zIndex: 100,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  debugPromptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  debugPromptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  debugPromptContent: {
    maxHeight: 240,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  debugPromptText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.text,
    lineHeight: 18,
  },
});

