import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { StarRating } from './StarRating';

const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
  dessert: 'Dessert',
};

const getStyles = (colors) => StyleSheet.create({
  mealCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  mealCardCompleted: {
    borderLeftColor: '#22c55e',
    backgroundColor: colors.successLight,
    borderColor: '#86efac',
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealCardHeaderLeft: {
    flex: 1,
  },
  mealCardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTypeLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
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
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22c55e',
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
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
  },
  macroChipProtein: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  macroChipCarbs: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
  },
  macroChipFat: {
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
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
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const parsed = parseMeal(meal);
  const hasMeal = !!(meal && meal.trim());

  // Animation for completion
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isCompleted) {
      // Scale up and down animation
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
    }
  }, [isCompleted]);

  const handleCheckboxPress = (e) => {
    e.stopPropagation();
    if (onToggleComplete) {
      onToggleComplete();
    }
  };

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
        <View style={styles.mealCardHeader}>
          <View style={styles.mealCardHeaderLeft}>
            <Text style={[
              styles.mealTypeLabel,
              isCompleted && styles.mealTypeLabelCompleted
            ]}>
              {MEAL_LABELS[mealType]}
            </Text>
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
                    <Ionicons name="checkmark" size={18} color={colors.border} />
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

      {hasMeal ? (
        <>
          <Text style={[
            styles.mealName,
            isCompleted && styles.mealNameCompleted
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
            <TouchableOpacity 
              onPress={() => onMealPress(mealType, parsed)} 
              style={styles.mealOptionsButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyMeal}>
          <Ionicons name="add-circle-outline" size={32} color={colors.textTertiary} />
          <Text style={styles.emptyMealText}>Tap to add meal</Text>
        </View>
      )}
      </TouchableOpacity>
    </Animated.View>
  );
};

