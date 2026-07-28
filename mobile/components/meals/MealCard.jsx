import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { macroColors } from '../../../shared/lib/macroColors';
import { StarRating } from './StarRating';

const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
  dessert: 'Dessert',
};

const getStyles = (colors, isDarkMode) => StyleSheet.create({
  mealCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  mealCardCompleted: {
    backgroundColor: colors.successLight,
    borderColor: colors.successBorder,
  },
  mealCardGenerating: {
    borderColor: colors.primaryBorder,
  },
  generatingBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 28,
  },
  generatingText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDarkMode ? colors.primary : colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: isDarkMode ? 0 : StyleSheet.hairlineWidth,
    borderBottomColor: colors.primaryBorder,
  },
  mealCardHeaderLeft: {
    flex: 1,
  },
  mealCardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealCardBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  mealTypeLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: isDarkMode ? '#FFFFFF' : colors.text,
    letterSpacing: 0.2,
  },
  mealTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  adjustedBadge: {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.22)' : colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adjustedBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  mealTypeLabelCompleted: {
    opacity: 0.75,
  },
  mealName: {
    fontSize: 17,
    fontWeight: 'normal',
    color: colors.text,
    marginBottom: 12,
  },
  mealNameCompleted: {
    opacity: 0.75,
  },
  checkboxButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  checkboxUncompleted: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: isDarkMode ? '#FFFFFF' : colors.border,
    backgroundColor: isDarkMode ? 'transparent' : colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.22)' : '#22c55e',
    borderWidth: isDarkMode ? 2 : 0,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  macroChip: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
  },
  macroChipCalories: {
    backgroundColor: macroColors.calories,
    borderColor: macroColors.calories,
  },
  macroChipProtein: {
    backgroundColor: macroColors.protein,
    borderColor: macroColors.protein,
  },
  macroChipCarbs: {
    backgroundColor: macroColors.carbs,
    borderColor: macroColors.carbs,
  },
  macroChipFat: {
    backgroundColor: macroColors.fat,
    borderColor: macroColors.fat,
  },
  macroChipValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  macroChipLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 2,
    fontWeight: '700',
  },
  ratingRow: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealOptionsButton: {
    padding: 6,
  },
  emptyMeal: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyMealText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '700',
  },
});

export const MealCard = ({ 
  mealType, 
  meal, 
  rating, 
  onRate, 
  onMealPress, 
  onEmptyPress, 
  parseMeal,
  isCompleted = false,
  onToggleComplete = null,
  showCheckbox = false,
  isAdjusted = false,
}) => {
  const { colors, isDarkMode } = useTheme();
  const styles = getStyles(colors, isDarkMode);
  const isGenerating = meal === '__generating__';
  const parsed = isGenerating ? null : parseMeal(meal);
  const hasMeal = !!(meal && meal.trim() && !isGenerating);

  // Scale the whole card when the user marks it complete — not on remount.
  // Remounting meals (Stack push) was re-running the spring for every completed
  // card and reading as a tab-switch "pop."
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevCompletedRef = useRef(isCompleted);

  useEffect(() => {
    const wasCompleted = prevCompletedRef.current;
    prevCompletedRef.current = isCompleted;

    if (isCompleted && !wasCompleted) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.05,
          useNativeDriver: true,
          tension: 100,
          friction: 3,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 7,
        }),
      ]).start();
    } else if (!isCompleted) {
      scaleAnim.setValue(1);
    }
  }, [isCompleted, scaleAnim]);

  const handleCheckboxPress = (e) => {
    e.stopPropagation();
    if (onToggleComplete) {
      onToggleComplete();
    }
  };

  const renderHeader = () => (
    <View style={styles.mealCardHeader}>
      <View style={styles.mealCardHeaderLeft}>
        <View style={styles.mealTypeRow}>
          <Text style={[
            styles.mealTypeLabel,
            isCompleted && styles.mealTypeLabelCompleted,
          ]}>
            {MEAL_LABELS[mealType]}
          </Text>
          {isAdjusted ? (
            <View style={styles.adjustedBadge}>
              <Text style={styles.adjustedBadgeText}>Adjusted</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.mealCardHeaderRight}>
        {showCheckbox && hasMeal && (
          <TouchableOpacity
            onPress={handleCheckboxPress}
            style={styles.checkboxButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isCompleted ? (
              <View style={styles.checkboxCompleted}>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              </View>
            ) : (
              <View style={styles.checkboxUncompleted}>
                <Ionicons
                  name="checkmark"
                  size={18}
                  color={isDarkMode ? '#FFFFFF' : colors.border}
                />
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Show loading spinner while generating
  if (isGenerating) {
    return (
      <View style={[styles.mealCard, styles.mealCardGenerating]}>
        {renderHeader()}
        <View style={styles.mealCardBody}>
          <View style={styles.generatingBody}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.generatingText}>Generating…</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.mealCard,
          isCompleted && styles.mealCardCompleted,
        ]}
        onPress={() => {
          if (hasMeal) {
            onMealPress(mealType, parsed);
          } else if (onEmptyPress) {
            onEmptyPress(mealType);
          }
        }}
        activeOpacity={0.75}
      >
        {renderHeader()}

        <View style={styles.mealCardBody}>
          {hasMeal ? (
            <>
              <Text style={[
                styles.mealName,
                isCompleted && styles.mealNameCompleted,
              ]}>
                {parsed.name}
              </Text>

              <View style={styles.macroRow}>
                <View style={[styles.macroChip, styles.macroChipCalories]}>
                  <Text style={styles.macroChipValue}>{parsed.calories}</Text>
                  <Text style={styles.macroChipLabel}>Cal</Text>
                </View>
                <View style={[styles.macroChip, styles.macroChipProtein]}>
                  <Text style={styles.macroChipValue}>{parsed.protein}g</Text>
                  <Text style={styles.macroChipLabel}>P</Text>
                </View>
                <View style={[styles.macroChip, styles.macroChipCarbs]}>
                  <Text style={styles.macroChipValue}>{parsed.carbs}g</Text>
                  <Text style={styles.macroChipLabel}>C</Text>
                </View>
                <View style={[styles.macroChip, styles.macroChipFat]}>
                  <Text style={styles.macroChipValue}>{parsed.fat}g</Text>
                  <Text style={styles.macroChipLabel}>F</Text>
                </View>
              </View>

              <View style={styles.ratingRow}>
                <StarRating rating={rating || 0} onRate={onRate} />
                <View style={styles.ratingRowActions}>
                  <TouchableOpacity
                    onPress={() => onMealPress(mealType, parsed)}
                    style={styles.mealOptionsButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyMeal}>
              <Ionicons name="add-circle-outline" size={32} color={colors.textTertiary} />
              <Text style={styles.emptyMealText}>Tap to add meal</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
