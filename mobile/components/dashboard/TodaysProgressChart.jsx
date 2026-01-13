import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const MEAL_ICONS = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  dinner: 'moon-outline',
  snacks: 'fast-food-outline',
  dessert: 'ice-cream-outline',
};

const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
  dessert: 'Dessert',
};

export const TodaysProgressChart = ({ completions, completedCount, totalMeals, mealTypes, onMealPress }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  
  const percentage = totalMeals > 0 ? (completedCount / totalMeals) * 100 : 0;
  
  // Create a simple circular progress indicator with segments
  const renderCircularProgress = () => {
    const size = 130;
    const strokeWidth = 14;
    
    // Create 5 segments (one for each meal)
    const segmentAngle = 360 / totalMeals;
    const gapAngle = 4; // Small gap between segments
    
    return (
      <View style={[styles.progressCircle, { width: size, height: size }]}>
        {/* Background full circle */}
        <View 
          style={[
            styles.progressBackground,
            { 
              width: size, 
              height: size, 
              borderRadius: size / 2,
              backgroundColor: colors.borderLight,
            }
          ]}
        />
        
        {/* Inner circle to create ring effect */}
        <View 
          style={[
            styles.progressInner,
            { 
              width: size - (strokeWidth * 2), 
              height: size - (strokeWidth * 2), 
              borderRadius: (size - (strokeWidth * 2)) / 2,
              backgroundColor: colors.cardBackground,
            }
          ]}
        />
        
        {/* Segment indicators (simplified as small circles around the ring) */}
        {mealTypes.map((mealType, index) => {
          const isCompleted = completions.some((c) => c.meal_type === mealType);
          const angle = (index * segmentAngle) - 90; // Start from top
          const radian = (angle * Math.PI) / 180;
          const circleRadius = (size - strokeWidth) / 2;
          const x = (size / 2) + (circleRadius * Math.cos(radian)) - 6;
          const y = (size / 2) + (circleRadius * Math.sin(radian)) - 6;
          
          return (
            <View
              key={mealType}
              style={[
                styles.segmentDot,
                {
                  position: 'absolute',
                  left: x,
                  top: y,
                  backgroundColor: isCompleted ? '#22c55e' : colors.border,
                }
              ]}
            />
          );
        })}
        
        {/* Center text */}
        <View style={styles.progressCenter}>
          <Text style={styles.progressValue}>{completedCount}/{totalMeals}</Text>
          <Text style={styles.progressLabel}>meals</Text>
        </View>
      </View>
    );
  };

  // Check if a meal is completed
  const isMealCompleted = (mealType) => {
    return completions.some((c) => c.meal_type === mealType);
  };

  return (
    <View style={styles.container}>
      {/* Circular Progress */}
      <View style={styles.chartContainer}>
        {renderCircularProgress()}
      </View>

      {/* Meal Icons */}
      <View style={styles.mealIconsContainer}>
        {mealTypes.map((mealType) => {
          const isCompleted = isMealCompleted(mealType);
          return (
            <TouchableOpacity 
              key={mealType} 
              style={styles.mealIconWrapper}
              onPress={() => onMealPress && onMealPress(mealType)}
              activeOpacity={0.7}
            >
              <View 
                style={[
                  styles.mealIconCircle,
                  isCompleted && styles.mealIconCircleCompleted
                ]}
              >
                <Ionicons
                  name={MEAL_ICONS[mealType] || 'restaurant-outline'}
                  size={20}
                  color={isCompleted ? '#FFFFFF' : colors.textTertiary}
                />
                {isCompleted && (
                  <View style={styles.checkmarkBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                  </View>
                )}
              </View>
              <Text style={[styles.mealLabel, isCompleted && styles.mealLabelCompleted]}>
                {MEAL_LABELS[mealType]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  progressCircle: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBackground: {
    position: 'absolute',
  },
  progressInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    margin: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  mealIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 4,
  },
  mealIconWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  mealIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  mealIconCircleCompleted: {
    backgroundColor: '#22c55e',
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    textAlign: 'center',
  },
  mealLabelCompleted: {
    color: colors.success,
    fontWeight: '700',
  },
});
