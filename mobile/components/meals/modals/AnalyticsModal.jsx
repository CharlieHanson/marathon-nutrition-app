import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { DAYS, MEAL_TYPES, parseMeal, calculateDayMacros } from '../../../utils/mealHelpers';

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

    // Check if there are workouts for this day
    const workouts = dayData?.workouts || [];
    if (workouts.length === 0) {
      restDays.push(dayMacros.calories);
      return;
    }

    // Check workout intensity
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

const getStyles = (colors) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  overlayPressable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    overflow: 'hidden',
    zIndex: 1,
  },
  modalInner: {
    flex: 1,
    flexDirection: 'column',
    pointerEvents: 'auto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.inputBackground,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  content: {
    flex: 1,
    minHeight: 0,
    flexShrink: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 12,
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
  caloriesCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  proteinCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  carbsCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  fatCard: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  caloriesValue: {
    color: '#F97316',
  },
  proteinValue: {
    color: '#22C55E',
  },
  carbsValue: {
    color: '#3B82F6',
  },
  fatValue: {
    color: '#A855F7',
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
    gap: 12,
    marginBottom: 8,
  },
  macroItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
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
    marginTop: 4,
    fontStyle: 'italic',
  },
  trainingInsightCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderRadius: 10,
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
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.inputBackground,
  },
  closeButton: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});

export const AnalyticsModal = ({ visible, onClose, mealPlan, userProfile, trainingPlan }) => {
  if (!visible) return null;

  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { dayStats, totals, averages, daysWithData } = calculateWeekStats(mealPlan);
  const trainingInsight = getTrainingInsight(trainingPlan, dayStats);

  // Macro distribution (calories from each macro)
  const macroDistribution = [
    { name: 'Protein', value: averages.protein * 4, grams: averages.protein, color: '#22c55e' },
    { name: 'Carbs', value: averages.carbs * 4, grams: averages.carbs, color: '#3b82f6' },
    { name: 'Fat', value: averages.fat * 9, grams: averages.fat, color: '#a855f7' },
  ];

  const totalMacroCalories = macroDistribution.reduce((sum, m) => sum + m.value, 0);

  // Find max calories for bar chart scaling
  const maxCalories = Math.max(...dayStats.map((d) => d.calories), 1);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable onPress={onClose} style={styles.overlayPressable} />
        <View style={styles.modalContent}>
          <View style={styles.modalInner}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="bar-chart-outline" size={22} color={colors.primary} />
                <Text style={styles.headerTitle}>Weekly Analytics</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              bounces={true}
              scrollEventThrottle={16}
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
                {/* Summary Cards */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Daily Averages ({daysWithData} days)
                  </Text>
                  <View style={styles.summaryGrid}>
                    <View style={[styles.summaryCard, styles.caloriesCard]}>
                      <Ionicons name="flame-outline" size={20} color="#F97316" />
                      <Text style={[styles.summaryValue, styles.caloriesValue]}>
                        {averages.calories}
                      </Text>
                      <Text style={styles.summaryLabel}>calories</Text>
                    </View>
                    <View style={[styles.summaryCard, styles.proteinCard]}>
                      <Ionicons name="barbell-outline" size={20} color="#22C55E" />
                      <Text style={[styles.summaryValue, styles.proteinValue]}>
                        {averages.protein}g
                      </Text>
                      <Text style={styles.summaryLabel}>protein</Text>
                    </View>
                    <View style={[styles.summaryCard, styles.carbsCard]}>
                      <Ionicons name="restaurant-outline" size={20} color="#3B82F6" />
                      <Text style={[styles.summaryValue, styles.carbsValue]}>
                        {averages.carbs}g
                      </Text>
                      <Text style={styles.summaryLabel}>carbs</Text>
                    </View>
                    <View style={[styles.summaryCard, styles.fatCard]}>
                      <Ionicons name="water-outline" size={20} color="#A855F7" />
                      <Text style={[styles.summaryValue, styles.fatValue]}>
                        {averages.fat}g
                      </Text>
                      <Text style={styles.summaryLabel}>fat</Text>
                    </View>
                  </View>
                </View>

                {/* Daily Calories Bar Chart */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Daily Calories</Text>
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
                </View>

                {/* Macro Distribution */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Macro Distribution</Text>
                  <View style={styles.macroDistributionContainer}>
                    {macroDistribution.map((macro, index) => {
                      const percentage =
                        totalMacroCalories > 0
                          ? Math.round((macro.value / totalMacroCalories) * 100)
                          : 0;
                      return (
                        <View key={index} style={styles.macroItem}>
                          <View style={styles.macroItemLeft}>
                            <View
                              style={[styles.macroColorDot, { backgroundColor: macro.color }]}
                            />
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
                </View>

                {/* Training Sync Insight */}
                {trainingInsight && (trainingInsight.avgHigh || trainingInsight.avgRest) && (
                  <View style={styles.section}>
                    <View style={styles.trainingInsightCard}>
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
                    </View>
                  </View>
                )}

                {/* Week Totals */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Week Totals</Text>
                  <View style={styles.weekTotalsGrid}>
                    <View style={styles.weekTotalItem}>
                      <Text style={styles.weekTotalLabel}>Total Calories</Text>
                      <Text style={styles.weekTotalValue}>
                        {totals.calories.toLocaleString()} cal
                      </Text>
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
                </View>
              </>
            )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

