import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export const WeekNavigation = ({
  currentWeekStarting,
  isCurrentWeek,
  formatWeekDate,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  isGuest,
  user,
  animatedStyle,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <Animated.View style={[styles.weekNavRow, animatedStyle]}>
      <TouchableOpacity
        onPress={onPreviousWeek}
        style={[styles.weekNavIconBtn, (!user || isGuest) && styles.disabledBtn]}
        disabled={!user || isGuest}
      >
        <Ionicons
          name="chevron-back"
          size={18}
          color={!user || isGuest ? colors.textTertiary : colors.textSecondary}
        />
      </TouchableOpacity>

      <View style={styles.weekNavCenter}>
        <Text style={styles.weekNavText}>Week of {formatWeekDate(currentWeekStarting)}</Text>
        {!isCurrentWeek ? (
          <TouchableOpacity onPress={onCurrentWeek} style={styles.currentWeekChip}>
            <Text style={styles.currentWeekChipText}>Current</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={onNextWeek}
        style={[styles.weekNavIconBtn, (!user || isGuest) && styles.disabledBtn]}
        disabled={!user || isGuest}
      >
        <Ionicons
          name="chevron-forward"
          size={18}
          color={!user || isGuest ? colors.textTertiary : colors.textSecondary}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const QuickActionsRow = ({
  hasMeals,
  onAnalytics,
  onGroceryList,
  onMealPrep,
  onLogMeal,
  loadingGroceryList,
  animatedStyle,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    // IMPORTANT: no fixed paddingVertical here; parent animation controls paddingTop/paddingBottom
    <Animated.View style={[styles.quickActionsRow, animatedStyle]}>
      {hasMeals ? (
        <>
          <TouchableOpacity
            style={[styles.quickActionBtn, styles.quickActionBtnLeft]}
            onPress={onAnalytics}
          >
            <Ionicons name="bar-chart-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, styles.quickActionBtnRight]}
            onPress={onGroceryList}
            disabled={loadingGroceryList}
          >
            {loadingGroceryList ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <Ionicons name="cart-outline" size={18} color={colors.textSecondary} />
            )}
            <Text style={styles.quickActionText}>Grocery List</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.quickActionBtn, styles.quickActionBtnLeft]}
            onPress={onMealPrep}
          >
            <Ionicons name="restaurant-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.quickActionText}>Meal Prep</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, styles.quickActionBtnRight]}
            onPress={onLogMeal}
          >
            <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.quickActionText}>Log Meal</Text>
          </TouchableOpacity>
        </>
      )}
    </Animated.View>
  );
};

export const DaySelector = ({ days, dayLabels, selectedDay, onSelectDay, animatedStyle, todayDayOfWeek }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    // IMPORTANT: no fixed paddingVertical here; parent animation controls paddingTop/paddingBottom
    <Animated.View style={[styles.dayPillsContainer, animatedStyle]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayPills}
      >
        {days.map((day, index) => {
          const isToday = day === todayDayOfWeek;
          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayPill, selectedDay === day && styles.dayPillActive]}
              onPress={() => onSelectDay(day)}
            >
              <Text style={[styles.dayPillText, selectedDay === day && styles.dayPillTextActive]}>
                {dayLabels[index]}
              </Text>
              {isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>Today</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
};

export const MacrosSummary = ({ dayMacros, hasMealsForDay, animatedStyle }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <Animated.View style={[styles.macrosRow, animatedStyle]}>
      {hasMealsForDay && dayMacros && dayMacros.calories > 0 ? (
        <>
          <View style={[styles.macroChip, styles.macroChipCalories]}>
            <Text 
              style={styles.macroChipValue}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.7}
            >
              {dayMacros.calories}
            </Text>
            <Text style={styles.macroChipLabel}>Cal</Text>
          </View>

          <View style={[styles.macroChip, styles.macroChipProtein]}>
            <Text 
              style={styles.macroChipValue}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.7}
            >
              {dayMacros.protein}g
            </Text>
            <Text style={styles.macroChipLabel}>Protein</Text>
          </View>

          <View style={[styles.macroChip, styles.macroChipCarbs]}>
            <Text 
              style={styles.macroChipValue}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.7}
            >
              {dayMacros.carbs}g
            </Text>
            <Text style={styles.macroChipLabel}>Carbs</Text>
          </View>

          <View style={[styles.macroChip, styles.macroChipFat]}>
            <Text 
              style={styles.macroChipValue}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.7}
            >
              {dayMacros.fat}g
            </Text>
            <Text style={styles.macroChipLabel}>Fat</Text>
          </View>
        </>
      ) : (
        <View style={styles.noMealsContainer}>
          <Text style={styles.noMealsText}>No meals yet</Text>
        </View>
      )}
    </Animated.View>
  );
};

const CHIP_MIN_HEIGHT = 52;

const getStyles = (colors) => StyleSheet.create({
  weekNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBorder,
    backgroundColor: colors.primaryLight,
  },
  weekNavIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.45 },
  weekNavCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  currentWeekChip: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  currentWeekChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textInverse,
  },

  // NOTE: remove fixed paddingVertical so animated padding works correctly
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  quickActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionBtnLeft: { marginRight: 10 },
  quickActionBtnRight: { marginLeft: 0 },
  quickActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },

  // NOTE: remove fixed paddingVertical so animated padding works correctly
  dayPillsContainer: {
    overflow: 'hidden',
  },
  dayPills: {
    paddingHorizontal: 12,
  },
  dayPill: {
    width: 56,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dayPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  dayPillTextActive: { color: colors.textInverse },
  todayBadge: {
    position: 'absolute',
    top: -6,
    right: -2,
    backgroundColor: '#22c55e',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  todayBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Taller row + taller pills
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.inputBackground,
    gap: 8,
    alignItems: 'center',
    minHeight: CHIP_MIN_HEIGHT + 28, // ensures the row can actually hold the chips
  },
  macroChip: {
    flex: 1,
    minHeight: CHIP_MIN_HEIGHT,
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0, // Allow flex to shrink below content size
    flexBasis: 0, // Ensure equal distribution
    flexGrow: 1, // Ensure all chips grow equally
    flexShrink: 1, // Allow chips to shrink equally
  },
  macroChipCalories: { backgroundColor: '#F59E0B', borderColor: '#D97706' },
  macroChipProtein: { backgroundColor: '#10B981', borderColor: '#059669' },
  macroChipCarbs: { backgroundColor: '#3B82F6', borderColor: '#2563EB' },
  macroChipFat: { backgroundColor: '#8B5CF6', borderColor: '#7C3AED' },
  macroChipValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 16,
    textAlign: 'center',
  },
  macroChipLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 4,
    fontWeight: '800',
    lineHeight: 13,
  },
  noMealsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  noMealsText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textTertiary,
  },
});
