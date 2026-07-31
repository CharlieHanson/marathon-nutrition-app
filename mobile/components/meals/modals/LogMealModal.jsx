import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { apiClient } from '../../../../shared/services/api';
import { fetchSavedMealsByType, incrementMealUsage } from '../../../../shared/lib/dataClient';
import { macroColors } from '../../../../shared/lib/macroColors';
import { getDayMealToggles, getActiveMealTypes } from '../../../utils/mealHelpers';
import { AestheticSheet, AestheticCard, AestheticSectionLabel } from '../../ui/AestheticSheet';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'dessert'];
const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
  dessert: 'Dessert',
};
const MEAL_LABELS_PLURAL = {
  breakfast: 'breakfasts',
  lunch: 'lunches',
  dinner: 'dinners',
  snacks: 'snacks',
  dessert: 'desserts',
};

const getStyles = (colors) =>
  StyleSheet.create({
    section: {
      marginBottom: 4,
    },
    dayGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 4,
    },
    dayButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 2,
      borderRadius: 10,
      backgroundColor: colors.inputBackground,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dayButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    dayButtonTextSelected: {
      color: '#FFFFFF',
    },
    mealTypeGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 6,
    },
    mealTypeButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: 10,
      backgroundColor: colors.inputBackground,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    mealTypeButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    mealTypeButtonText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    mealTypeButtonTextSelected: {
      color: '#FFFFFF',
    },
    textInput: {
      width: '100%',
      minHeight: 100,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.inputBackground,
    },
    helperText: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 6,
    },
    estimateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    estimateButtonDisabled: {
      opacity: 0.5,
    },
    estimateButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    macrosContainer: {
      padding: 12,
      backgroundColor: colors.successLight,
      borderWidth: 1,
      borderColor: colors.successBorder,
      borderRadius: 14,
    },
    macrosTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.success,
      marginBottom: 10,
    },
    macrosGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    macroChip: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    macroChipCalories: {
      backgroundColor: macroColors.calories,
    },
    macroChipProtein: {
      backgroundColor: macroColors.protein,
    },
    macroChipCarbs: {
      backgroundColor: macroColors.carbs,
    },
    macroChipFat: {
      backgroundColor: macroColors.fat,
    },
    macroChipLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 2,
    },
    macroChipValue: {
      fontSize: 14,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    logButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    logButtonDisabled: {
      backgroundColor: colors.borderLight,
      opacity: 0.6,
    },
    logButtonSuccess: {
      backgroundColor: colors.success,
    },
    logButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    savedMealCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    savedMealLeft: {
      flex: 1,
    },
    savedMealName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    savedMealMacros: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    savedMealBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: colors.primaryLight,
      borderRadius: 8,
      marginLeft: 8,
    },
    savedMealBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    savedMealsEmpty: {
      paddingVertical: 16,
      paddingHorizontal: 12,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    savedMealsEmptyText: {
      fontSize: 13,
      color: colors.textTertiary,
      textAlign: 'center',
      lineHeight: 20,
    },
    savedMealsErrorText: {
      fontSize: 13,
      color: colors.error || '#DC2626',
      textAlign: 'center',
      fontWeight: '600',
      lineHeight: 20,
    },
  });

export const LogMealModal = ({
  visible,
  onClose,
  onLog,
  defaultDay,
  defaultMealType,
  isGuest,
  userId,
  mealPlan,
}) => {
  const [mealDescription, setMealDescription] = useState('');
  const [selectedDay, setSelectedDay] = useState(defaultDay || 'monday');
  const [selectedMealType, setSelectedMealType] = useState(defaultMealType || 'lunch');

  const logMealActiveTypes = getActiveMealTypes(
    getDayMealToggles(mealPlan?.[selectedDay]),
    mealPlan?.[selectedDay]
  ).filter((mt) => mt !== 'snacks');
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimatedMacros, setEstimatedMacros] = useState(null);
  const [logged, setLogged] = useState(false);
  const [savedMeals, setSavedMeals] = useState([]);
  const [loadingSavedMeals, setLoadingSavedMeals] = useState(false);
  const [savedMealsError, setSavedMealsError] = useState(null);
  const [loggingSavedMeal, setLoggingSavedMeal] = useState(null);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  useEffect(() => {
    if (defaultDay) setSelectedDay(defaultDay);
    if (defaultMealType) setSelectedMealType(defaultMealType);
  }, [defaultDay, defaultMealType]);

  const prevVisibleRef = useRef(false);
  useEffect(() => {
    if (!visible) {
      prevVisibleRef.current = false;
      return;
    }
    if (!userId || isGuest) return;

    const justOpened = !prevVisibleRef.current;
    prevVisibleRef.current = true;
    const mealTypeToFetch = justOpened && defaultMealType != null ? defaultMealType : selectedMealType;

    const load = async () => {
      setLoadingSavedMeals(true);
      setSavedMealsError(null);
      try {
        const meals = await fetchSavedMealsByType(userId, mealTypeToFetch);
        setSavedMeals(meals);
        setSavedMealsError(null);
      } catch (err) {
        console.error('Failed to fetch saved meals:', err);
        setSavedMeals([]);
        setSavedMealsError(err?.message || 'Failed to load saved meals');
      } finally {
        setLoadingSavedMeals(false);
      }
    };

    load();
  }, [visible, userId, selectedMealType, defaultMealType, isGuest]);

  const handleEstimateMacros = async () => {
    if (!mealDescription.trim()) return;

    setIsEstimating(true);
    setEstimatedMacros(null);

    try {
      const result = await apiClient.estimateMacros({
        meal: mealDescription.trim(),
        mealType: selectedMealType,
      });

      if (result.success && result.macros) {
        setEstimatedMacros(result.macros);
      }
    } catch (error) {
      console.error('Failed to estimate macros:', error);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleLog = async () => {
    if (!mealDescription.trim()) return;

    setIsEstimating(true);
    setLogged(false);

    try {
      const result = await apiClient.estimateMacros({
        meal: mealDescription.trim(),
        mealType: selectedMealType,
      });

      const finalMeal = result.success && result.meal ? result.meal : mealDescription.trim();
      onLog(selectedDay, selectedMealType, finalMeal);
      setLogged(true);

      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error) {
      console.error('Failed to log meal:', error);
      onLog(selectedDay, selectedMealType, mealDescription.trim());
      setLogged(true);
      setTimeout(() => {
        handleClose();
      }, 1000);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleLogSavedMeal = async (savedMeal) => {
    if (!savedMeal?.full_description) return;

    setLoggingSavedMeal(savedMeal.id);
    try {
      onLog(selectedDay, selectedMealType, savedMeal.full_description);
      await incrementMealUsage(savedMeal.id);
      Alert.alert('Success', 'Meal logged!');
      handleClose();
    } catch (err) {
      console.error('Failed to log saved meal:', err);
      Alert.alert('Error', err.message || 'Failed to log meal.');
    } finally {
      setLoggingSavedMeal(null);
    }
  };

  const handleClose = () => {
    setMealDescription('');
    setLogged(false);
    setEstimatedMacros(null);
    setSavedMeals([]);
    setSavedMealsError(null);
    setLoggingSavedMeal(null);
    onClose();
  };

  return (
    <AestheticSheet
      visible={visible}
      onClose={handleClose}
      icon="restaurant-outline"
      eyebrow="LOG"
      title="Log Meal"
    >
      {/* Day Selection */}
      <AestheticCard>
        <AestheticSectionLabel>Which day?</AestheticSectionLabel>
        <View style={styles.dayGrid}>
          {DAYS.map((day) => (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(day)}
              style={[styles.dayButton, selectedDay === day && styles.dayButtonSelected]}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  selectedDay === day && styles.dayButtonTextSelected,
                ]}
              >
                {DAY_LABELS[day]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </AestheticCard>

      {/* Meal Type Selection */}
      <AestheticCard>
        <AestheticSectionLabel>Which meal?</AestheticSectionLabel>
        <View style={styles.mealTypeGrid}>
          {logMealActiveTypes.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => {
                setSelectedMealType(type);
                setEstimatedMacros(null);
              }}
              style={[
                styles.mealTypeButton,
                selectedMealType === type && styles.mealTypeButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.mealTypeButtonText,
                  selectedMealType === type && styles.mealTypeButtonTextSelected,
                ]}
                numberOfLines={1}
              >
                {MEAL_LABELS[type]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </AestheticCard>

      {/* Meal Description */}
      <AestheticCard>
        <AestheticSectionLabel>What did you eat?</AestheticSectionLabel>
        <TextInput
          value={mealDescription}
          onChangeText={(text) => {
            setMealDescription(text);
            setEstimatedMacros(null);
          }}
          placeholder="e.g., Grilled chicken salad with olive oil dressing, side of brown rice..."
          placeholderTextColor={colors.textTertiary}
          style={styles.textInput}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          returnKeyType="done"
          blurOnSubmit={true}
        />
        <Text style={styles.helperText}>Be descriptive for better macro estimates</Text>
      </AestheticCard>

      {/* Estimate Macros Button */}
      {mealDescription.trim() && !estimatedMacros && (
        <TouchableOpacity
          onPress={handleEstimateMacros}
          disabled={isEstimating}
          style={[styles.estimateButton, isEstimating && styles.estimateButtonDisabled]}
        >
          {isEstimating ? (
            <>
              <ActivityIndicator size="small" color={colors.textSecondary} />
              <Text style={styles.estimateButtonText}>Estimating...</Text>
            </>
          ) : (
            <Text style={styles.estimateButtonText}>Preview Macro Estimate</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Estimated Macros Display */}
      {estimatedMacros && (
        <View style={styles.macrosContainer}>
          <Text style={styles.macrosTitle}>Estimated Macros:</Text>
          <View style={styles.macrosGrid}>
            <View style={[styles.macroChip, styles.macroChipCalories]}>
              <Text style={styles.macroChipLabel}>Cal</Text>
              <Text style={styles.macroChipValue}>{estimatedMacros.calories}</Text>
            </View>
            <View style={[styles.macroChip, styles.macroChipProtein]}>
              <Text style={styles.macroChipLabel}>P</Text>
              <Text style={styles.macroChipValue}>{estimatedMacros.protein}g</Text>
            </View>
            <View style={[styles.macroChip, styles.macroChipCarbs]}>
              <Text style={styles.macroChipLabel}>C</Text>
              <Text style={styles.macroChipValue}>{estimatedMacros.carbs}g</Text>
            </View>
            <View style={[styles.macroChip, styles.macroChipFat]}>
              <Text style={styles.macroChipLabel}>F</Text>
              <Text style={styles.macroChipValue}>{estimatedMacros.fat}g</Text>
            </View>
          </View>
        </View>
      )}

      {/* Log Meal Button */}
      <TouchableOpacity
        onPress={handleLog}
        disabled={!mealDescription.trim() || logged || isEstimating}
        style={[
          styles.logButton,
          (!mealDescription.trim() || isEstimating) && styles.logButtonDisabled,
          logged && styles.logButtonSuccess,
        ]}
      >
        {logged ? (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.logButtonText}>Logged!</Text>
          </>
        ) : isEstimating ? (
          <>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.logButtonText}>Estimating macros...</Text>
          </>
        ) : (
          <>
            <Ionicons name="restaurant" size={20} color="#FFFFFF" />
            <Text style={styles.logButtonText}>Log Meal</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Saved Meals Section */}
      {userId && !isGuest && (
        <AestheticCard>
          <AestheticSectionLabel>Saved Meals</AestheticSectionLabel>
          {loadingSavedMeals ? (
            <View style={styles.savedMealsEmpty}>
              <ActivityIndicator size="small" color={colors.textTertiary} />
            </View>
          ) : savedMealsError ? (
            <View style={styles.savedMealsEmpty}>
              <Text style={styles.savedMealsErrorText}>Couldn't load saved meals</Text>
            </View>
          ) : savedMeals.length === 0 ? (
            <View style={styles.savedMealsEmpty}>
              <Text style={styles.savedMealsEmptyText}>
                No saved {MEAL_LABELS_PLURAL[selectedMealType] || 'meals'} yet. Save meals from your plan to log them quickly!
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {savedMeals.map((saved) => {
                const hasMacros =
                  saved.calories != null ||
                  saved.protein != null ||
                  saved.carbs != null ||
                  saved.fat != null;
                const macroStr = hasMacros
                  ? `${saved.calories ?? '-'} cal • ${saved.protein ?? '-'}P ${saved.carbs ?? '-'}C ${saved.fat ?? '-'}F`
                  : 'No macros';
                return (
                  <TouchableOpacity
                    key={saved.id}
                    style={styles.savedMealCard}
                    onPress={() => handleLogSavedMeal(saved)}
                    disabled={loggingSavedMeal === saved.id}
                  >
                    <View style={styles.savedMealLeft}>
                      <Text style={styles.savedMealName} numberOfLines={1}>
                        {saved.name || 'Meal'}
                      </Text>
                      <Text style={styles.savedMealMacros} numberOfLines={1}>
                        {macroStr}
                      </Text>
                    </View>
                    <View style={styles.savedMealBadge}>
                      <Text style={styles.savedMealBadgeText}>
                        {loggingSavedMeal === saved.id ? '...' : `Used ${saved.times_used ?? 0}x`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </AestheticCard>
      )}
    </AestheticSheet>
  );
};
