import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { DAYS, calculateDayMacros } from '../../../utils/mealHelpers';
import { macroColors } from '../../../../shared/lib/macroColors';
import {
  AestheticSheet,
  AestheticCard,
  AestheticSectionLabel,
} from '../../ui/AestheticSheet';

// Calculate week totals and averages
const calculateWeekStats = (mealPlan) => {
  const dayStats = [];
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let daysWithData = 0;

  DAYS.forEach((day) => {
    const dayMacros = calculateDayMacros(mealPlan?.[day]);
    dayStats.push({
      day: day.slice(0, 3).charAt(0).toUpperCase() + day.slice(1, 3),
      fullDay: day,
      ...dayMacros,
      hasData: dayMacros.calories > 0,
    });

    if (dayMacros.calories > 0) {
      totalCalories += dayMacros.calories;
      totalProtein += dayMacros.protein;
      totalCarbs += dayMacros.carbs;
      totalFat += dayMacros.fat;
      daysWithData++;
    }
  });

  return {
    dayStats,
    totals: { calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fat: totalFat },
    averages: {
      calories: daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0,
      protein: daysWithData > 0 ? Math.round(totalProtein / daysWithData) : 0,
      carbs: daysWithData > 0 ? Math.round(totalCarbs / daysWithData) : 0,
      fat: daysWithData > 0 ? Math.round(totalFat / daysWithData) : 0,
    },
    daysWithData,
  };
};

// Get training intensity correlation
const getTrainingInsight = (trainingPlan, dayStats) => {
  if (!trainingPlan) return null;

  let highIntensityDays = [];
  let restDays = [];

  DAYS.forEach((day) => {
    const dayData = trainingPlan[day];
    const dayMacros = dayStats.find((d) => d.fullDay === day);

    if (!dayMacros?.hasData) return;

    const workouts = dayData?.workouts || [];
    if (workouts.length === 0) {
      restDays.push(dayMacros.calories);
      return;
    }

    let hasHighIntensity = false;
    let hasRest = false;

    workouts.forEach((workout) => {
      const intensity = workout?.intensity || 'Medium';
      if (intensity === 'High') {
        hasHighIntensity = true;
      } else if (intensity === 'Recovery' || workout?.type?.toLowerCase() === 'rest') {
        hasRest = true;
      }
    });

    if (hasHighIntensity) {
      highIntensityDays.push(dayMacros.calories);
    } else if (hasRest) {
      restDays.push(dayMacros.calories);
    }
  });

  const avgHigh =
    highIntensityDays.length > 0
      ? Math.round(highIntensityDays.reduce((a, b) => a + b, 0) / highIntensityDays.length)
      : null;
  const avgRest =
    restDays.length > 0
      ? Math.round(restDays.reduce((a, b) => a + b, 0) / restDays.length)
      : null;

  return {
    avgHigh,
    avgRest,
    highCount: highIntensityDays.length,
    restCount: restDays.length,
  };
};

const getStyles = (colors) =>
  StyleSheet.create({
    emptyState: {
      alignItems: 'center',
      paddingVertical: 48,
    },
    emptyStateTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textSecondary,
      marginTop: 12,
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.textTertiary,
      marginTop: 4,
      textAlign: 'center',
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    summaryCard: {
      flex: 1,
      minWidth: '45%',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      gap: 6,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '900',
    },
    caloriesValue: {
      color: macroColors.calories,
    },
    proteinValue: {
      color: macroColors.protein,
    },
    carbsValue: {
      color: macroColors.carbs,
    },
    fatValue: {
      color: macroColors.fat,
    },
    summaryLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    barChartContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      height: 160,
      paddingHorizontal: 8,
      paddingTop: 8,
    },
    barChartItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
    },
    barChartBarContainer: {
      width: '100%',
      height: 120,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    barChartBar: {
      width: '80%',
      borderRadius: 4,
      minHeight: 4,
    },
    barChartLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    barChartValue: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    macroDistributionContainer: {
      gap: 10,
    },
    macroItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    macroItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    macroColorDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
    },
    macroName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    macroItemRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    macroGrams: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
    },
    macroPercentage: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    macroNote: {
      fontSize: 11,
      color: colors.textTertiary,
      marginTop: 6,
      fontStyle: 'italic',
    },
    trainingInsightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    trainingInsightTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    trainingInsightGrid: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 8,
    },
    trainingInsightItem: {
      flex: 1,
    },
    trainingInsightLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    trainingInsightValue: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 2,
    },
    trainingInsightCount: {
      fontSize: 11,
      color: colors.textTertiary,
    },
    trainingInsightNote: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 8,
      fontWeight: '600',
    },
    weekTotalsGrid: {
      gap: 10,
    },
    weekTotalItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    weekTotalLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    weekTotalValue: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
    },
    closeButton: {
      width: '100%',
      paddingVertical: 14,
      backgroundColor: colors.primary,
      borderRadius: 12,
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });

export const AnalyticsModal = ({ visible, onClose, mealPlan, userProfile, trainingPlan }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { dayStats, totals, averages, daysWithData } = calculateWeekStats(mealPlan);
  const trainingInsight = getTrainingInsight(trainingPlan, dayStats);

  const macroDistribution = [
    { name: 'Protein', value: averages.protein * 4, grams: averages.protein, color: macroColors.protein },
    { name: 'Carbs', value: averages.carbs * 4, grams: averages.carbs, color: macroColors.carbs },
    { name: 'Fat', value: averages.fat * 9, grams: averages.fat, color: macroColors.fat },
  ];

  const totalMacroCalories = macroDistribution.reduce((sum, m) => sum + m.value, 0);
  const maxCalories = Math.max(...dayStats.map((d) => d.calories), 1);

  const footer = (
    <View style={{ padding: 16, paddingTop: 8 }}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AestheticSheet
      visible={visible}
      onClose={onClose}
      icon="bar-chart-outline"
      eyebrow="ANALYTICS"
      title="Weekly Analytics"
      footer={footer}
    >
      {daysWithData === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No meal data yet</Text>
          <Text style={styles.emptyStateText}>
            Generate or log some meals to see analytics
          </Text>
        </View>
      ) : (
        <>
          {/* Daily Averages */}
          <AestheticCard>
            <AestheticSectionLabel>Daily Averages ({daysWithData} days)</AestheticSectionLabel>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Ionicons name="flame-outline" size={20} color={macroColors.calories} />
                <Text style={[styles.summaryValue, styles.caloriesValue]}>{averages.calories}</Text>
                <Text style={styles.summaryLabel}>calories</Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons name="barbell-outline" size={20} color={macroColors.protein} />
                <Text style={[styles.summaryValue, styles.proteinValue]}>{averages.protein}g</Text>
                <Text style={styles.summaryLabel}>protein</Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons name="restaurant-outline" size={20} color={macroColors.carbs} />
                <Text style={[styles.summaryValue, styles.carbsValue]}>{averages.carbs}g</Text>
                <Text style={styles.summaryLabel}>carbs</Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons name="water-outline" size={20} color={macroColors.fat} />
                <Text style={[styles.summaryValue, styles.fatValue]}>{averages.fat}g</Text>
                <Text style={styles.summaryLabel}>fat</Text>
              </View>
            </View>
          </AestheticCard>

          {/* Daily Calories Bar Chart */}
          <AestheticCard>
            <AestheticSectionLabel>Daily Calories</AestheticSectionLabel>
            <View style={styles.barChartContainer}>
              {dayStats.map((day, index) => {
                const height = (day.calories / maxCalories) * 120;
                return (
                  <View key={index} style={styles.barChartItem}>
                    <View style={styles.barChartBarContainer}>
                      <View
                        style={[
                          styles.barChartBar,
                          {
                            height: Math.max(height, 4),
                            backgroundColor: day.hasData ? colors.primary : colors.borderLight,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barChartLabel}>{day.day}</Text>
                    <Text style={styles.barChartValue}>
                      {day.hasData ? day.calories : '—'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </AestheticCard>

          {/* Macro Distribution */}
          <AestheticCard>
            <AestheticSectionLabel>Macro Distribution</AestheticSectionLabel>
            <View style={styles.macroDistributionContainer}>
              {macroDistribution.map((macro, index) => {
                const percentage =
                  totalMacroCalories > 0
                    ? Math.round((macro.value / totalMacroCalories) * 100)
                    : 0;
                return (
                  <View key={index} style={styles.macroItem}>
                    <View style={styles.macroItemLeft}>
                      <View style={[styles.macroColorDot, { backgroundColor: macro.color }]} />
                      <Text style={styles.macroName}>{macro.name}</Text>
                    </View>
                    <View style={styles.macroItemRight}>
                      <Text style={styles.macroGrams}>{macro.grams}g</Text>
                      <Text style={styles.macroPercentage}>({percentage}%)</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <Text style={styles.macroNote}>
              Based on calories: Protein & Carbs = 4 cal/g, Fat = 9 cal/g
            </Text>
          </AestheticCard>

          {/* Training Sync Insight */}
          {trainingInsight && (trainingInsight.avgHigh || trainingInsight.avgRest) && (
            <AestheticCard>
              <View style={styles.trainingInsightHeader}>
                <Ionicons name="barbell-outline" size={18} color={colors.primary} />
                <Text style={styles.trainingInsightTitle}>Training & Nutrition Sync</Text>
              </View>
              <View style={styles.trainingInsightGrid}>
                {trainingInsight.avgHigh && (
                  <View style={styles.trainingInsightItem}>
                    <Text style={styles.trainingInsightLabel}>High intensity days</Text>
                    <Text style={styles.trainingInsightValue}>
                      {trainingInsight.avgHigh} cal
                    </Text>
                    <Text style={styles.trainingInsightCount}>
                      {trainingInsight.highCount} day(s)
                    </Text>
                  </View>
                )}
                {trainingInsight.avgRest && (
                  <View style={styles.trainingInsightItem}>
                    <Text style={styles.trainingInsightLabel}>Rest days</Text>
                    <Text style={styles.trainingInsightValue}>
                      {trainingInsight.avgRest} cal
                    </Text>
                    <Text style={styles.trainingInsightCount}>
                      {trainingInsight.restCount} day(s)
                    </Text>
                  </View>
                )}
              </View>
              {trainingInsight.avgHigh && trainingInsight.avgRest && (
                <Text style={styles.trainingInsightNote}>
                  {trainingInsight.avgHigh > trainingInsight.avgRest
                    ? '✓ Good! Eating more on training days.'
                    : '⚠️ Consider eating more on high intensity days.'}
                </Text>
              )}
            </AestheticCard>
          )}

          {/* Week Totals */}
          <AestheticCard>
            <AestheticSectionLabel>Week Totals</AestheticSectionLabel>
            <View style={styles.weekTotalsGrid}>
              <View style={styles.weekTotalItem}>
                <Text style={styles.weekTotalLabel}>Total Calories</Text>
                <Text style={styles.weekTotalValue}>{totals.calories.toLocaleString()} cal</Text>
              </View>
              <View style={styles.weekTotalItem}>
                <Text style={styles.weekTotalLabel}>Total Protein</Text>
                <Text style={styles.weekTotalValue}>{totals.protein}g</Text>
              </View>
              <View style={styles.weekTotalItem}>
                <Text style={styles.weekTotalLabel}>Total Carbs</Text>
                <Text style={styles.weekTotalValue}>{totals.carbs}g</Text>
              </View>
              <View style={styles.weekTotalItem}>
                <Text style={styles.weekTotalLabel}>Total Fat</Text>
                <Text style={styles.weekTotalValue}>{totals.fat}g</Text>
              </View>
            </View>
          </AestheticCard>
        </>
      )}
    </AestheticSheet>
  );
};
