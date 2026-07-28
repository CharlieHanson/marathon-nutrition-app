import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMealPlan } from '../../hooks/useMealPlan';
import { useMealCompletions, MEAL_TYPES } from '../../hooks/useMealCompletions';
import { getDayMealToggles, getActiveMealTypes } from '../../utils/mealHelpers';
import { macroColors } from '../../../shared/lib/macroColors';

const { width } = Dimensions.get('window');

const TABS = ['Overview', 'Calories', 'Macros'];

// ─── Meal type display config (muted palette, aligned with macroColors) ─────
const MEAL_CONFIG = {
  breakfast: { label: 'Breakfast', color: macroColors.calories }, // clay
  lunch:     { label: 'Lunch',     color: macroColors.protein },  // mint
  dinner:    { label: 'Dinner',    color: macroColors.carbs },    // dusty blue
  snacks:    { label: 'Snack',     color: macroColors.fat },      // mauve
  dessert:   { label: 'Dessert',   color: '#B8956C' },            // sand (same family)
};

// Fallback for any unknown meal type key
const getMealConfig = (mealType) =>
  MEAL_CONFIG[mealType] ?? { label: mealType.charAt(0).toUpperCase() + mealType.slice(1), color: '#6b7280' };

const MACRO_CONFIG = [
  { key: 'carbs',   label: 'Carbs',   color: macroColors.carbs, calsPerGram: 4 },
  { key: 'protein', label: 'Protein', color: macroColors.protein, calsPerGram: 4 },
  { key: 'fat',     label: 'Lipids',  color: macroColors.fat, calsPerGram: 9 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const parseMeal = (mealString) => {
  if (!mealString || typeof mealString !== 'string') {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
  return {
    calories: parseInt(mealString.match(/Cal:\s*(\d+)/)?.[1]  ?? 0, 10),
    protein:  parseInt(mealString.match(/P:\s*(\d+)g/)?.[1]   ?? 0, 10),
    carbs:    parseInt(mealString.match(/C:\s*(\d+)g/)?.[1]   ?? 0, 10),
    fat:      parseInt(mealString.match(/F:\s*(\d+)g/)?.[1]   ?? 0, 10),
  };
};

const getTodayDayName = () => {
  const names = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return names[new Date().getDay()];
};

// ─── Donut Pie Chart ─────────────────────────────────────────────────────────
const PieChart = ({ data, size = 220 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;
  const innerR = r * 0.52;

  let angle = -Math.PI / 2;

  const slices = data.map((d) => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const start = angle;
    const end = angle + sweep;
    angle = end;

    const cos0 = Math.cos(start), sin0 = Math.sin(start);
    const cos1 = Math.cos(end),   sin1 = Math.sin(end);
    const large = sweep > Math.PI ? 1 : 0;

    // Outer arc → inner arc (donut)
    const path = [
      `M ${cx + r * cos0} ${cy + r * sin0}`,
      `A ${r} ${r} 0 ${large} 1 ${cx + r * cos1} ${cy + r * sin1}`,
      `L ${cx + innerR * cos1} ${cy + innerR * sin1}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${cx + innerR * cos0} ${cy + innerR * sin0}`,
      'Z',
    ].join(' ');

    return { ...d, path, pct: Math.round((d.value / total) * 100) };
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => (
        <Path key={i} d={s.path} fill={s.color} />
      ))}
    </Svg>
  );
};

// ─── Horizontal progress bar row ────────────────────────────────────────────
const MacroBar = ({ label, eaten, total, color, unit = 'g', colors }) => {
  const pct = total > 0 ? Math.min((eaten / total) * 100, 100) : 0;
  return (
    <View style={barStyles.row}>
      <View style={barStyles.labelRow}>
        <View style={[barStyles.dot, { backgroundColor: color }]} />
        <Text style={[barStyles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[barStyles.values, { color: colors.textSecondary }]}>
          {eaten}{unit}
          <Text style={barStyles.valuesOf}> / {total}{unit}</Text>
        </Text>
      </View>
      <View style={[barStyles.track, { backgroundColor: colors.border }]}>
        <View style={[barStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const barStyles = StyleSheet.create({
  row:      { marginBottom: 18 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  dot:      { width: 10, height: 10, borderRadius: 5 },
  label:    { fontSize: 15, fontWeight: '700', flex: 1 },
  values:   { fontSize: 14, fontWeight: '800' },
  valuesOf: { fontWeight: '500', opacity: 0.6 },
  track:    { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill:     { height: '100%', borderRadius: 5 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function NutritionDetailScreen() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { colors } = useTheme();
  const mealPlanHook = useMealPlan(user, isGuest);
  const mealCompletionsHook = useMealCompletions(user, isGuest);

  const [activeTab, setActiveTab] = useState('Overview');

  const styles = getStyles(colors);

  const todayDay = getTodayDayName();
  const todayMeals = mealPlanHook.mealPlan?.[todayDay] ?? {};
  const activeTypes = getActiveMealTypes(getDayMealToggles(todayMeals), todayMeals);

  // Total planned macros for today (active types only)
  const totalMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  activeTypes.forEach((mt) => {
    if (todayMeals[mt]) {
      const p = parseMeal(todayMeals[mt]);
      totalMacros.calories += p.calories;
      totalMacros.protein  += p.protein;
      totalMacros.carbs    += p.carbs;
      totalMacros.fat      += p.fat;
    }
  });

  // Eaten macros (only completed meals, active types only)
  const eatenMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  activeTypes.forEach((mt) => {
    const done = mealCompletionsHook.completions.some(
      (c) => c.day_of_week === todayDay && c.meal_type === mt
    );
    if (done && todayMeals[mt]) {
      const p = parseMeal(todayMeals[mt]);
      eatenMacros.calories += p.calories;
      eatenMacros.protein  += p.protein;
      eatenMacros.carbs    += p.carbs;
      eatenMacros.fat      += p.fat;
    }
  });

  // Per-meal-type calories for Calories pie chart (active types only)
  const mealTypeCalories = activeTypes.map((mt) => {
    const cfg = getMealConfig(mt);
    const cal = todayMeals[mt] ? parseMeal(todayMeals[mt]).calories : 0;
    return { label: cfg.label, color: cfg.color, value: cal };
  }).filter((d) => d.value > 0);

  // Macro calories for Macros pie chart
  const macroPieData = MACRO_CONFIG.map((m) => ({
    label: m.label,
    color: m.color,
    value: totalMacros[m.key] * m.calsPerGram,
  })).filter((d) => d.value > 0);

  const noData = totalMacros.calories === 0;
  const { isLoading, fetchError } = mealPlanHook;
  const showLoading = isLoading && noData;
  const showFetchError = !!fetchError && noData && !isLoading;
  const showEmpty = !isLoading && !fetchError && noData;

  const renderDataPlaceholder = () => {
    if (showLoading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    if (showFetchError) {
      return (
        <View style={styles.stateContainer}>
          <Text style={styles.fetchErrorText}>Couldn't load nutrition data</Text>
        </View>
      );
    }
    if (showEmpty) {
      return <EmptyState />;
    }
    return null;
  };

  // ── Render tabs ──────────────────────────────────────────────────────────
  const renderOverview = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Header stat */}
      <View style={styles.consumedHeader}>
        <Text style={styles.consumedLabel}>You have consumed</Text>
        <View style={styles.consumedCalRow}>
          <Text style={styles.consumedCalEaten}>{eatenMacros.calories}</Text>
          <Text style={styles.consumedCalDivider}> out of </Text>
          <Text style={styles.consumedCalTotal}>{totalMacros.calories}</Text>
          <Text style={styles.consumedCalUnit}> cal</Text>
        </View>
      </View>

      {noData ? (
        renderDataPlaceholder()
      ) : (
        <View style={styles.barsContainer}>
          {MACRO_CONFIG.map((m) => (
            <MacroBar
              key={m.key}
              label={m.label}
              eaten={eatenMacros[m.key]}
              total={totalMacros[m.key]}
              color={m.color}
              colors={colors}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderCalories = () => {
    const total = mealTypeCalories.reduce((s, d) => s + d.value, 0);
    const keyItems = mealTypeCalories.map((d) => ({
      ...d,
      pct: total > 0 ? Math.round((d.value / total) * 100) : 0,
    }));
    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        {noData || mealTypeCalories.length === 0 ? (
          renderDataPlaceholder()
        ) : (
          <>
            <Text style={styles.pieTitle}>Calories by Meal</Text>
            <View style={styles.pieWrapper}>
              <PieChart data={mealTypeCalories} size={width * 0.62} />
              <View style={styles.pieCenterLabel}>
                <Text style={styles.pieCenterValue}>{totalMacros.calories}</Text>
                <Text style={styles.pieCenterUnit}>cal</Text>
              </View>
            </View>

            {/* Detail list */}
            <View style={styles.detailList}>
              {keyItems.map((item, i) => (
                <View key={i} style={[styles.detailRow, i < keyItems.length - 1 && styles.detailRowBorder]}>
                  <View style={[styles.detailSwatch, { backgroundColor: item.color }]} />
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={styles.detailValue}>{item.value} cal</Text>
                  <Text style={styles.detailPct}>{item.pct}%</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    );
  };

  const renderMacros = () => {
    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        {noData || macroPieData.length === 0 ? (
          renderDataPlaceholder()
        ) : (
          <>
            <Text style={styles.pieTitle}>Macros by Calories</Text>
            <View style={styles.pieWrapper}>
              <PieChart data={macroPieData} size={width * 0.62} />
              <View style={styles.pieCenterLabel}>
                <Text style={styles.pieCenterValue}>{totalMacros.calories}</Text>
                <Text style={styles.pieCenterUnit}>cal</Text>
              </View>
            </View>

            {/* Detail list */}
            <View style={styles.detailList}>
              {MACRO_CONFIG.filter((m) => totalMacros[m.key] > 0).map((m, i, arr) => {
                const calVal = totalMacros[m.key] * m.calsPerGram;
                const totalMacroCals = macroPieData.reduce((s, d) => s + d.value, 0);
                const pct = totalMacroCals > 0 ? Math.round((calVal / totalMacroCals) * 100) : 0;
                return (
                  <View key={m.key} style={[styles.detailRow, i < arr.length - 1 && styles.detailRowBorder]}>
                    <View style={[styles.detailSwatch, { backgroundColor: m.color }]} />
                    <Text style={styles.detailLabel}>{m.label}</Text>
                    <Text style={styles.detailValue}>{totalMacros[m.key]}g</Text>
                    <Text style={styles.detailPct}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.macroNote}>
              Protein &amp; Carbs = 4 cal/g · Lipids = 9 cal/g
            </Text>
          </>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-down" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Today's Nutrition</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <View style={styles.contentArea}>
        {activeTab === 'Overview' && renderOverview()}
        {activeTab === 'Calories' && renderCalories()}
        {activeTab === 'Macros'   && renderMacros()}
      </View>
    </View>
  );
}

const EmptyState = () => (
  <View style={{ alignItems: 'center', paddingVertical: 48 }}>
    <Ionicons name="restaurant-outline" size={48} color="#D1D5DB" />
    <Text style={{ fontSize: 16, fontWeight: '700', color: '#9CA3AF', marginTop: 12 }}>
      No meal data yet
    </Text>
    <Text style={{ fontSize: 14, color: '#D1D5DB', marginTop: 4 }}>
      Generate a meal plan to see stats
    </Text>
  </View>
);

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 24, // ← adjust this to raise/lower the bottom border
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.cardBackground,
    },
    backButton: {
      width: 36,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
    },
    headerSpacer: {
      width: 36,
    },
    // ── Tab bar ──
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabItem: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabItemActive: {
      borderBottomColor: colors.primary,
    },
    tabLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tabLabelActive: {
      color: colors.primary,
      fontWeight: '800',
    },
    // ── Content ──
    contentArea: {
      flex: 1,
      backgroundColor: colors.cardBackground,
    },
    tabContent: {
      padding: 20,
      paddingBottom: 40,
      backgroundColor: colors.cardBackground,
    },
    stateContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    fetchErrorText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.error || '#DC2626',
      textAlign: 'center',
    },
    // ── Overview ──
    consumedHeader: {
      alignItems: 'center',
      marginBottom: 32,
      paddingTop: 8,
    },
    consumedLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    consumedCalRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    consumedCalEaten: {
      fontSize: 44,
      fontWeight: '900',
      color: colors.text,
      lineHeight: 48,
    },
    consumedCalDivider: {
      fontSize: 16,
      color: colors.textTertiary,
      fontWeight: '500',
      marginBottom: 8,
    },
    consumedCalTotal: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.textSecondary,
      lineHeight: 36,
      marginBottom: 4,
    },
    consumedCalUnit: {
      fontSize: 16,
      color: colors.textTertiary,
      fontWeight: '500',
      marginBottom: 8,
    },
    barsContainer: {
      paddingTop: 4,
    },
    // ── Calories / Macros tabs ──
    pieTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      textAlign: 'center',
      marginBottom: 16,
    },
    pieWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    pieCenterLabel: {
      position: 'absolute',
      alignItems: 'center',
    },
    pieCenterValue: {
      fontSize: 26,
      fontWeight: '900',
      color: colors.text,
    },
    pieCenterUnit: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    detailList: {
      marginTop: 24,
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 13,
      gap: 10,
    },
    detailRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailSwatch: {
      width: 12,
      height: 12,
      borderRadius: 3,
    },
    detailLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      marginRight: 8,
    },
    detailPct: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      minWidth: 36,
      textAlign: 'right',
    },
    macroNote: {
      fontSize: 12,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 12,
      fontStyle: 'italic',
    },
  });