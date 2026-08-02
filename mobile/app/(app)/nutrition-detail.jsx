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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMealPlan } from '../../hooks/useMealPlan';
import { useMealCompletions } from '../../hooks/useMealCompletions';
import { getDayMealToggles, getActiveMealTypes } from '../../utils/mealHelpers';
import { macroColors } from '../../../shared/lib/macroColors';
import {
  AestheticCard,
  AestheticSectionLabel,
} from '../../components/ui/AestheticSheet';

const { width } = Dimensions.get('window');

const TABS = ['Overview', 'Calories', 'Macros'];

const MEAL_CONFIG = {
  breakfast: { label: 'Breakfast', color: macroColors.calories },
  lunch: { label: 'Lunch', color: macroColors.protein },
  dinner: { label: 'Dinner', color: macroColors.carbs },
  snacks: { label: 'Snack', color: macroColors.fat },
  dessert: { label: 'Dessert', color: '#B8956C' },
};

const getMealConfig = (mealType) =>
  MEAL_CONFIG[mealType] ?? {
    label: mealType.charAt(0).toUpperCase() + mealType.slice(1),
    color: '#6b7280',
  };

const MACRO_CONFIG = [
  { key: 'protein', label: 'Protein', color: macroColors.protein, calsPerGram: 4 },
  { key: 'carbs', label: 'Carbs', color: macroColors.carbs, calsPerGram: 4 },
  { key: 'fat', label: 'Fats', color: macroColors.fat, calsPerGram: 9 },
];

const parseMeal = (mealString) => {
  if (!mealString || typeof mealString !== 'string') {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
  return {
    calories: parseInt(mealString.match(/Cal:\s*(\d+)/)?.[1] ?? 0, 10),
    protein: parseInt(mealString.match(/P:\s*(\d+)g/)?.[1] ?? 0, 10),
    carbs: parseInt(mealString.match(/C:\s*(\d+)g/)?.[1] ?? 0, 10),
    fat: parseInt(mealString.match(/F:\s*(\d+)g/)?.[1] ?? 0, 10),
  };
};

const getTodayDayName = () => {
  const names = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return names[new Date().getDay()];
};

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

    const cos0 = Math.cos(start);
    const sin0 = Math.sin(start);
    const cos1 = Math.cos(end);
    const sin1 = Math.sin(end);
    const large = sweep > Math.PI ? 1 : 0;

    const path = [
      `M ${cx + r * cos0} ${cy + r * sin0}`,
      `A ${r} ${r} 0 ${large} 1 ${cx + r * cos1} ${cy + r * sin1}`,
      `L ${cx + innerR * cos1} ${cy + innerR * sin1}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${cx + innerR * cos0} ${cy + innerR * sin0}`,
      'Z',
    ].join(' ');

    return { ...d, path };
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => (
        <Path key={i} d={s.path} fill={s.color} />
      ))}
    </Svg>
  );
};

const MacroBar = ({ label, eaten, total, color, unit = 'g', colors }) => {
  const pct = total > 0 ? Math.round((eaten / total) * 100) : 0;
  const fillPct = Math.min(pct, 100);
  return (
    <View style={barStyles.row}>
      <View style={barStyles.labelRow}>
        <View style={[barStyles.dot, { backgroundColor: color }]} />
        <Text style={[barStyles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[barStyles.values, { color: colors.textSecondary }]}>
          {eaten}
          {unit}
          <Text style={barStyles.valuesOf}>
            {' '}
            / {total}
            {unit}
          </Text>
        </Text>
      </View>
      <Text style={[barStyles.meta, { color: colors.textTertiary }]}>
        {pct}% of goal · {total}
        {unit} target
      </Text>
      <View style={[barStyles.track, { backgroundColor: colors.border }]}>
        <View style={[barStyles.fill, { width: `${fillPct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const barStyles = StyleSheet.create({
  row: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: 15, fontWeight: '700', flex: 1 },
  values: { fontSize: 14, fontWeight: '800' },
  valuesOf: { fontWeight: '500', opacity: 0.6 },
  meta: { fontSize: 12, fontWeight: '500', marginBottom: 8, paddingLeft: 18 },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
});

export default function NutritionDetailScreen() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const mealPlanHook = useMealPlan(user, isGuest);
  const mealCompletionsHook = useMealCompletions(user, isGuest);

  const [activeTab, setActiveTab] = useState('Overview');
  const styles = getStyles(colors, isDarkMode);

  const todayDay = getTodayDayName();
  const todayMeals = mealPlanHook.mealPlan?.[todayDay] ?? {};
  const activeTypes = getActiveMealTypes(getDayMealToggles(todayMeals), todayMeals);

  const totalMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  activeTypes.forEach((mt) => {
    if (todayMeals[mt]) {
      const p = parseMeal(todayMeals[mt]);
      totalMacros.calories += p.calories;
      totalMacros.protein += p.protein;
      totalMacros.carbs += p.carbs;
      totalMacros.fat += p.fat;
    }
  });

  const eatenMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  activeTypes.forEach((mt) => {
    const done = mealCompletionsHook.completions.some(
      (c) => c.day_of_week === todayDay && c.meal_type === mt
    );
    if (done && todayMeals[mt]) {
      const p = parseMeal(todayMeals[mt]);
      eatenMacros.calories += p.calories;
      eatenMacros.protein += p.protein;
      eatenMacros.carbs += p.carbs;
      eatenMacros.fat += p.fat;
    }
  });

  const mealTypeCalories = activeTypes
    .map((mt) => {
      const cfg = getMealConfig(mt);
      const cal = todayMeals[mt] ? parseMeal(todayMeals[mt]).calories : 0;
      return { label: cfg.label, color: cfg.color, value: cal };
    })
    .filter((d) => d.value > 0);

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

  const onClose = () => router.back();

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
      return (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyStateTitle}>No meal data yet</Text>
          <Text style={styles.emptyStateText}>Generate a meal plan to see stats</Text>
        </View>
      );
    }
    return null;
  };

  const renderOverview = () => (
    <>
      <AestheticCard>
        <AestheticSectionLabel>CONSUMED TODAY</AestheticSectionLabel>
        <View style={styles.consumedCalRow}>
          <Text style={styles.consumedCalEaten}>{eatenMacros.calories}</Text>
          <Text style={styles.consumedCalDivider}> out of </Text>
          <Text style={styles.consumedCalTotal}>{totalMacros.calories}</Text>
          <Text style={styles.consumedCalUnit}> cal</Text>
        </View>
      </AestheticCard>

      {noData ? (
        renderDataPlaceholder()
      ) : (
        <AestheticCard>
          <AestheticSectionLabel>MACRO PROGRESS</AestheticSectionLabel>
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
        </AestheticCard>
      )}
    </>
  );

  const renderCalories = () => {
    const total = mealTypeCalories.reduce((s, d) => s + d.value, 0);
    const keyItems = mealTypeCalories.map((d) => ({
      ...d,
      pct: total > 0 ? Math.round((d.value / total) * 100) : 0,
    }));

    if (noData || mealTypeCalories.length === 0) {
      return renderDataPlaceholder();
    }

    return (
      <>
        <AestheticCard>
          <AestheticSectionLabel>CALORIES BY MEAL</AestheticSectionLabel>
          <View style={styles.pieWrapper}>
            <PieChart data={mealTypeCalories} size={width * 0.55} />
            <View style={styles.pieCenterLabel}>
              <Text style={styles.pieCenterValue}>{totalMacros.calories}</Text>
              <Text style={styles.pieCenterUnit}>cal</Text>
            </View>
          </View>
        </AestheticCard>

        <AestheticCard>
          <AestheticSectionLabel>BREAKDOWN</AestheticSectionLabel>
          {keyItems.map((item, i) => (
            <View
              key={i}
              style={[styles.detailRow, i < keyItems.length - 1 && styles.detailRowBorder]}
            >
              <View style={[styles.detailSwatch, { backgroundColor: item.color }]} />
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value} cal</Text>
              <Text style={styles.detailPct}>{item.pct}%</Text>
            </View>
          ))}
        </AestheticCard>
      </>
    );
  };

  const renderMacros = () => {
    if (noData || macroPieData.length === 0) {
      return renderDataPlaceholder();
    }

    return (
      <>
        <AestheticCard>
          <AestheticSectionLabel>MACROS BY CALORIES</AestheticSectionLabel>
          <View style={styles.pieWrapper}>
            <PieChart data={macroPieData} size={width * 0.55} />
            <View style={styles.pieCenterLabel}>
              <Text style={styles.pieCenterValue}>{totalMacros.calories}</Text>
              <Text style={styles.pieCenterUnit}>cal</Text>
            </View>
          </View>
        </AestheticCard>

        <AestheticCard>
          <AestheticSectionLabel>DISTRIBUTION</AestheticSectionLabel>
          {MACRO_CONFIG.filter((m) => totalMacros[m.key] > 0).map((m, i, arr) => {
            const calVal = totalMacros[m.key] * m.calsPerGram;
            const totalMacroCals = macroPieData.reduce((s, d) => s + d.value, 0);
            const pct = totalMacroCals > 0 ? Math.round((calVal / totalMacroCals) * 100) : 0;
            return (
              <View
                key={m.key}
                style={[styles.detailRow, i < arr.length - 1 && styles.detailRowBorder]}
              >
                <View style={[styles.detailSwatch, { backgroundColor: m.color }]} />
                <Text style={styles.detailLabel}>{m.label}</Text>
                <Text style={styles.detailValue}>{totalMacros[m.key]}g</Text>
                <Text style={styles.detailPct}>{pct}%</Text>
              </View>
            );
          })}
          <Text style={styles.macroNote}>
            Protein & Carbs = 4 cal/g · Fats = 9 cal/g
          </Text>
        </AestheticCard>
      </>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.sheet}>
      <View pointerEvents="none" style={styles.bgDecor}>
        <View style={[styles.bgCircle, styles.bgCircleMint]} />
        <View style={[styles.bgCircle, styles.bgCirclePeach]} />
      </View>

      <View style={styles.modalInner}>
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        <View style={styles.header}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="nutrition-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={styles.eyebrow}>NUTRITION</Text>
            <Text style={styles.title}>{"Today's Nutrition"}</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabPill, active && styles.tabPillActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'Overview' && renderOverview()}
          {activeTab === 'Calories' && renderCalories()}
          {activeTab === 'Macros' && renderMacros()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    sheet: {
      flex: 1,
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    bgDecor: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 0,
    },
    bgCircle: {
      position: 'absolute',
      borderRadius: 9999,
    },
    bgCircleMint: {
      width: width * 0.65,
      height: width * 0.65,
      backgroundColor: isDarkMode ? 'rgba(224,236,222,0.08)' : '#E0ECDE',
      top: -width * 0.22,
      right: -width * 0.3,
    },
    bgCirclePeach: {
      width: width * 0.7,
      height: width * 0.7,
      backgroundColor: isDarkMode ? 'rgba(247,233,218,0.08)' : '#F7E9DA',
      top: width * 0.55,
      left: -width * 0.4,
    },
    modalInner: {
      flex: 1,
      zIndex: 1,
    },
    handleRow: {
      alignItems: 'center',
      paddingTop: 10,
      paddingBottom: 4,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderDark,
      opacity: 0.7,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
      gap: 12,
    },
    headerIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? 'rgba(61,124,101,0.2)' : 'rgba(61,124,101,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    headerTextBlock: {
      flex: 1,
      paddingRight: 4,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textTertiary,
      letterSpacing: 0.9,
      marginBottom: 2,
    },
    title: {
      fontFamily: 'PlayfairDisplay_600SemiBold',
      fontSize: 24,
      color: colors.text,
      letterSpacing: -0.3,
      lineHeight: 30,
    },
    iconButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: isDarkMode ? colors.cardBackground : 'rgba(255,255,255,0.7)',
    },
    tabBar: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    tabPill: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tabLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    tabLabelActive: {
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
      minHeight: 0,
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingBottom: 20,
      gap: 12,
    },
    footer: {
      padding: 16,
      paddingTop: 8,
    },
    closeButton: {
      width: '100%',
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: colors.primary,
    },
    closeButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
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
    consumedCalRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      flexWrap: 'wrap',
    },
    consumedCalEaten: {
      fontSize: 40,
      fontWeight: '900',
      color: colors.text,
      lineHeight: 44,
    },
    consumedCalDivider: {
      fontSize: 15,
      color: colors.textTertiary,
      fontWeight: '500',
      marginBottom: 8,
    },
    consumedCalTotal: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.textSecondary,
      lineHeight: 34,
      marginBottom: 4,
    },
    consumedCalUnit: {
      fontSize: 15,
      color: colors.textTertiary,
      fontWeight: '500',
      marginBottom: 8,
    },
    pieWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      paddingVertical: 8,
    },
    pieCenterLabel: {
      position: 'absolute',
      alignItems: 'center',
    },
    pieCenterValue: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.text,
    },
    pieCenterUnit: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 10,
    },
    detailRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    detailSwatch: {
      width: 12,
      height: 12,
      borderRadius: 6,
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
      marginTop: 10,
      fontStyle: 'italic',
    },
  });
