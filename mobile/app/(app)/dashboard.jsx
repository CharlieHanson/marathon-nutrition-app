import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMealPlan } from '../../hooks/useMealPlan';
import { useWorkoutLog } from '../../hooks/useWorkoutLog';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useMealCompletions } from '../../hooks/useMealCompletions';
import {
  calculateDayMacros,
  getDayMealToggles,
  getActiveMealTypes,
  parseMeal,
} from '../../utils/mealHelpers';
import { macroColors } from '../../../shared/lib/macroColors';
import { getLocalDateString } from '../../../shared/lib/dataClient';

const { width } = Dimensions.get('window');

const MEAL_CHIP_ORDER = ['breakfast', 'lunch', 'dinner', 'dessert'];
const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snack',
  dessert: 'Dessert',
};

const MACRO_ROWS = [
  { key: 'protein', label: 'Protein', color: macroColors.protein, calsPerGram: 4 },
  { key: 'carbs', label: 'Carbs', color: macroColors.carbs, calsPerGram: 4 },
  { key: 'fat', label: 'Fats', color: macroColors.fat, calsPerGram: 9 },
];

const getTodayDayName = () => {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayNames[new Date().getDay()];
};

const formatFullDate = () => {
  const today = new Date();
  return today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

const formatNumber = (n) => {
  if (n == null || Number.isNaN(n)) return '0';
  return Math.round(n).toLocaleString('en-US');
};

const getFirstName = (profile, rawProfile, isGuest) => {
  const full =
    profile?.name ||
    rawProfile?.name ||
    '';
  if (!full.trim()) return isGuest ? 'there' : 'friend';
  return full.trim().split(/\s+/)[0];
};

const getTodayWorkouts = (workouts) => {
  if (!workouts || !Array.isArray(workouts)) return [];

  return workouts.filter((w) => {
    const hasType = w.type && w.type.trim() && w.type !== 'Rest';
    const hasDistance = w.distance && w.distance.trim();
    const hasNotes = w.notes && w.notes.trim();
    return hasType || hasDistance || hasNotes;
  });
};

const getWorkoutIcon = (type) => {
  switch (type) {
    case 'Rest':
      return 'bed-outline';
    case 'Distance Run':
      return 'walk-outline';
    case 'Speed or Agility Training':
      return 'flash-outline';
    case 'Bike Ride':
      return 'bicycle-outline';
    case 'Walk/Hike':
      return 'trail-sign-outline';
    case 'Swim':
      return 'water-outline';
    case 'Strength Training':
      return 'barbell-outline';
    case 'Sport Practice':
      return 'football-outline';
    default:
      return 'fitness-outline';
  }
};

const getTodaysTraining = (trainingPlan, workouts, isGuest, trainingLoading) => {
  if (isGuest || !trainingPlan || trainingLoading) {
    return {
      quote: 'Start where you are.',
      caption: 'Set up a training plan to guide your week.',
      icon: 'fitness-outline',
    };
  }
  if (workouts.length > 0) {
    const first = workouts[0];
    const captionParts = [first.distance, first.intensity].filter(Boolean);
    return {
      quote: first.type || 'Workout day',
      caption: captionParts.length > 0
        ? captionParts.join(' · ')
        : 'Your session is ready when you are.',
      icon: getWorkoutIcon(first.type),
    };
  }
  return {
    quote: 'Rest day',
    caption: 'Recovery is part of the plan.',
    icon: 'bed-outline',
  };
};

/** Donut chart with optional center slot via absolute overlay in parent */
const MacroDonut = ({ data, size = 140, strokeWidth = 18, trackColor = '#E8E2D6' }) => {
  const total = data.reduce((sum, d) => sum + Math.max(0, d.value), 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const innerR = r - strokeWidth;

  if (total <= 0) {
    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={cx}
          cy={cy}
          r={(r + innerR) / 2}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
      </Svg>
    );
  }

  let angle = -Math.PI / 2;
  const slices = data.map((d) => {
    const value = Math.max(0, d.value);
    const sweep = (value / total) * 2 * Math.PI;
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

    const mid = start + sweep / 2;
    const labelR = r + 13;
    return {
      ...d,
      path,
      labelX: cx + labelR * Math.cos(mid),
      labelY: cy + labelR * Math.sin(mid),
      pct: d.goalPct,
    };
  });

  return (
    <View style={{ width: size + 28, height: size + 28, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <Path key={i} d={s.path} fill={s.color} />
        ))}
      </Svg>
      {slices.map((s, i) =>
        s.pct != null ? (
          <Text
            key={`pct-${i}`}
            style={[
              donutLabelStyles.pct,
              {
                left: s.labelX + 14 - 14,
                top: s.labelY + 14 - 8,
                color: s.color,
              },
            ]}
          >
            {s.pct}%
          </Text>
        ) : null
      )}
    </View>
  );
};

const donutLabelStyles = StyleSheet.create({
  pct: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '700',
    width: 28,
    textAlign: 'center',
  },
});

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const mealPlanHook = useMealPlan(user, isGuest);
  const workoutLogHook = useWorkoutLog(user, isGuest);
  const profileHook = useUserProfile(user, isGuest);
  const { refreshProfile } = profileHook;
  const mealCompletionsHook = useMealCompletions(user, isGuest);

  useFocusEffect(
    useCallback(() => {
      if (user?.id && !isGuest) {
        refreshProfile?.();
      }
    }, [user?.id, isGuest, refreshProfile])
  );

  const styles = getStyles(colors, isDarkMode);

  const todayDay = getTodayDayName();
  const todayDate = formatFullDate();
  const firstName = getFirstName(profileHook.profile, profileHook.rawUserProfile, isGuest);
  const todayMeals = mealPlanHook.mealPlan?.[todayDay];
  const todayToggles = getDayMealToggles(todayMeals);
  const todayActiveTypes = getActiveMealTypes(todayToggles, todayMeals);
  const todayMacros = todayMeals
    ? calculateDayMacros(todayMeals)
    : { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const todayWorkouts = getTodayWorkouts(
    workoutLogHook.getWorkoutsForDate(getLocalDateString())
  );
  const todaysTraining = getTodaysTraining(
    isGuest || workoutLogHook.isLoading ? null : { loaded: true },
    todayWorkouts,
    isGuest,
    workoutLogHook.isLoading
  );

  const calculateEatenMacros = () => {
    if (!todayMeals) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const eaten = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    todayActiveTypes.forEach((mealType) => {
      const isCompleted = mealCompletionsHook.completions.some(
        (c) => c.day_of_week === todayDay && c.meal_type === mealType
      );
      if (isCompleted) {
        const meal = todayMeals[mealType];
        if (meal) {
          const parsed = parseMeal(meal);
          eaten.calories += parsed.calories;
          eaten.protein += parsed.protein;
          eaten.carbs += parsed.carbs;
          eaten.fat += parsed.fat;
        }
      }
    });

    return eaten;
  };

  const eatenMacros = calculateEatenMacros();
  const displayCalories =
    eatenMacros.calories > 0 ? eatenMacros.calories : todayMacros.calories;

  const goalPct = (eaten, target) => {
    if (!target || target <= 0) return 0;
    return Math.round((eaten / target) * 100);
  };

  const macroGoalRows = MACRO_ROWS.map((m) => {
    const eaten = eatenMacros[m.key] || 0;
    const target = todayMacros[m.key] || 0;
    return {
      ...m,
      eaten,
      target,
      pct: goalPct(eaten, target),
      donutValue: target > 0 ? target * m.calsPerGram : 1,
    };
  });

  const isOnTrack =
    todayMacros.calories <= 0 ||
    eatenMacros.calories === 0 ||
    eatenMacros.calories <= todayMacros.calories * 1.08;

  const displayStreak = (() => {
    const raw = profileHook.rawUserProfile?.streak ?? 0;
    const last = profileHook.rawUserProfile?.last_streak_date;
    if (!last || raw === 0) return raw;
    const today = getLocalDateString();
    const yesterday = getLocalDateString(-1);
    if (last === today || last === yesterday) return raw;
    return 0;
  })();
  const maxStreak = profileHook.rawUserProfile?.max_streak ?? 0;

  const mealPlanFetchFailed =
    !!mealPlanHook.fetchError && !(mealPlanHook.mealPlan && Object.keys(mealPlanHook.mealPlan).length);

  const chipTypes = MEAL_CHIP_ORDER.filter(
    (t) => t !== 'dessert' || todayActiveTypes.includes('dessert')
  );

  const handleMealChipPress = async (mealType) => {
    const meal = todayMeals?.[mealType];
    const hasMeal = meal && typeof meal === 'string' && meal.trim();
    if (hasMeal && !isGuest) {
      try {
        await mealCompletionsHook.toggleMealCompletion(todayDay, mealType);
      } catch {
        router.push('/(app)/meals');
      }
      return;
    }
    router.push('/(app)/meals');
  };

  const donutSize = Math.min(148, width * 0.38);

  const streakSubtext = (() => {
    if (displayStreak > 0 && maxStreak > 0 && displayStreak >= maxStreak) {
      return 'This is your best streak! Keep going.';
    }
    if (maxStreak > 0) {
      return `Your best is ${maxStreak}. Keep going.`;
    }
    return 'Log today to keep it alive.';
  })();

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.bgDecor}>
        <View style={[styles.bgCircle, styles.bgCircleMint]} />
        <View style={[styles.bgCircle, styles.bgCirclePeach]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* Greeting */}
      <View style={styles.greetingBlock}>
        <Text style={styles.greetingLine}>
          <Text style={styles.greetingHey}>Hey </Text>
          <Text style={styles.greetingName}>{firstName},</Text>
        </Text>
        <Text style={styles.greetingDate}>{todayDate}</Text>
      </View>

      {/* Streak */}
      <View style={styles.streakCard}>
        <View style={styles.streakFlameWrap}>
          <Ionicons name="flame" size={28} color="#F0A03A" />
        </View>
        <View style={styles.streakTextBlock}>
          <Text style={styles.streakTitle}>
            {displayStreak} day streak!
          </Text>
          <Text style={styles.streakSub}>{streakSubtext}</Text>
        </View>
      </View>

      {/* Today's Nutrition */}
      <View style={styles.nutritionCard}>
        <TouchableOpacity
          onPress={() => router.push('/(app)/nutrition-detail')}
          activeOpacity={0.92}
        >
          <View style={styles.nutritionHeader}>
            <Text style={styles.nutritionTitle}>{"TODAY'S NUTRITION"}</Text>
            {todayMacros.calories > 0 ? (
              <View style={styles.onTrackBadge}>
                <Text style={styles.onTrackText}>{isOnTrack ? 'ON TRACK' : 'OVER'}</Text>
              </View>
            ) : null}
          </View>

          {mealPlanFetchFailed ? (
            <Text style={styles.fetchErrorText}>
              Couldn't load your meal plan. Pull to refresh.
            </Text>
          ) : null}

          <View style={styles.nutritionBody}>
            <View style={styles.donutWrap}>
              <MacroDonut
                data={macroGoalRows.map((m) => ({
                  value: todayMacros.calories > 0 ? m.donutValue : 0,
                  color: m.color,
                  goalPct: todayMacros.calories > 0 ? m.pct : null,
                }))}
                size={donutSize}
                trackColor={colors.border}
              />
              <View style={styles.donutCenter} pointerEvents="none">
                <Text style={styles.donutCalories}>
                  {todayMacros.calories > 0 ? formatNumber(displayCalories) : '—'}
                </Text>
                <Text style={styles.donutKcal}>kcal</Text>
              </View>
            </View>

            <View style={styles.macroList}>
              {macroGoalRows.map((m, index) => (
                <View
                  key={m.key}
                  style={[
                    styles.macroRow,
                    index < macroGoalRows.length - 1 && styles.macroRowDivider,
                  ]}
                >
                  <View style={styles.macroRowTop}>
                    <View style={styles.macroRowLeft}>
                      <View style={[styles.macroDot, { backgroundColor: m.color }]} />
                      <Text style={styles.macroLabel}>{m.label}</Text>
                    </View>
                    <Text style={styles.macroGrams}>
                      {todayMacros.calories > 0 ? `${Math.round(m.eaten)}g` : '—'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.mealChips}>
          {chipTypes.map((mealType) => {
            const meal = todayMeals?.[mealType];
            const parsed = meal ? parseMeal(meal) : { calories: 0 };
            const isCompleted = mealCompletionsHook.completions.some(
              (c) => c.day_of_week === todayDay && c.meal_type === mealType
            );
            const hasMeal = meal && typeof meal === 'string' && meal.trim();
            const logged = isCompleted && hasMeal;

            return (
              <TouchableOpacity
                key={mealType}
                style={[styles.mealChip, logged ? styles.mealChipLogged : styles.mealChipEmpty]}
                onPress={() => handleMealChipPress(mealType)}
                activeOpacity={0.85}
              >
                {logged ? (
                  <Ionicons name="checkmark" size={14} color={colors.primary} />
                ) : (
                  <Ionicons name="add" size={16} color={colors.textSecondary} />
                )}
                <Text style={[styles.mealChipLabel, logged && styles.mealChipLabelLogged]}>
                  {MEAL_LABELS[mealType] || mealType}
                </Text>
                {logged ? (
                  <Text style={styles.mealChipCals}>{parsed.calories}</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Daily Focus */}
      <TouchableOpacity
        style={styles.focusCard}
        onPress={() => router.push('/(app)/training')}
        activeOpacity={0.9}
      >
        <View style={styles.focusIconWrap}>
          <Ionicons name={todaysTraining.icon} size={18} color={colors.brandMuted} />
        </View>
        <View style={styles.focusTextBlock}>
          <Text style={styles.focusEyebrow}>{"TODAY'S TRAINING"}</Text>
          <Text style={styles.focusQuote}>{todaysTraining.quote}</Text>
          <Text style={styles.focusCaption}>{todaysTraining.caption}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    container: {
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
      width: width * 0.72,
      height: width * 0.72,
      backgroundColor: isDarkMode ? 'rgba(224,236,222,0.12)' : '#E0ECDE',
      top: -width * 0.18,
      right: -width * 0.28,
    },
    bgCirclePeach: {
      width: width * 0.78,
      height: width * 0.78,
      backgroundColor: isDarkMode ? 'rgba(247,233,218,0.1)' : '#F7E9DA',
      top: width * 0.22,
      left: -width * 0.42,
    },
    scroll: {
      flex: 1,
      zIndex: 1,
      backgroundColor: 'transparent',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 28,
    },

    greetingBlock: {
      marginBottom: 18,
      marginTop: 2,
    },
    greetingLine: {
      marginBottom: 4,
    },
    greetingHey: {
      fontFamily: 'PlayfairDisplay_600SemiBold',
      fontSize: 32,
      color: colors.text,
      letterSpacing: -0.3,
    },
    greetingName: {
      fontFamily: 'PlayfairDisplay_600SemiBold',
      fontSize: 32,
      color: colors.brandMuted,
      letterSpacing: -0.3,
    },
    greetingDate: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.textSecondary,
      marginTop: 2,
    },

    streakCard: {
      backgroundColor: colors.streakBackground,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 14,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: isDarkMode ? '#4A9B7A' : 'transparent',
    },
    streakFlameWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    streakTextBlock: {
      flex: 1,
    },
    streakTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: '#FFFFFF',
      marginBottom: 2,
    },
    streakSub: {
      fontSize: 13,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.78)',
    },

    nutritionCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 18,
      padding: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0 : 0.06,
      shadowRadius: 8,
      elevation: isDarkMode ? 0 : 2,
    },
    nutritionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    nutritionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 1,
    },
    onTrackBadge: {
      backgroundColor: colors.onTrackBackground,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    onTrackText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.onTrackText,
      letterSpacing: 0.4,
    },
    nutritionBody: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      marginBottom: 12,
    },
    donutWrap: {
      width: Math.min(172, width * 0.44),
      height: Math.min(172, width * 0.44),
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -4,
    },
    donutCenter: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    donutCalories: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
      lineHeight: 28,
    },
    donutKcal: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    macroList: {
      flex: 1,
      paddingLeft: 0,
    },
    macroRow: {
      paddingVertical: 7,
    },
    macroRowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    macroRowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    macroRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    macroDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    macroLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    macroGrams: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
    },

    mealChips: {
      flexDirection: 'row',
      gap: 8,
    },
    mealChip: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      minHeight: 64,
    },
    mealChipEmpty: {
      backgroundColor: colors.mealChipEmpty,
    },
    mealChipLogged: {
      backgroundColor: colors.mealChipLogged,
    },
    mealChipLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    mealChipLabelLogged: {
      color: colors.text,
    },
    mealChipCals: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.brandMuted,
    },

    focusCard: {
      backgroundColor: colors.focusBackground,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },
    focusIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? 'rgba(61,124,101,0.2)' : 'rgba(61,124,101,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    focusTextBlock: {
      flex: 1,
    },
    focusEyebrow: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textTertiary,
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    focusQuote: {
      fontFamily: 'PlayfairDisplay_400Regular_Italic',
      fontSize: 17,
      color: colors.text,
      marginBottom: 2,
    },
    focusCaption: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
    },

    fetchErrorText: {
      fontSize: 13,
      color: colors.error || '#DC2626',
      fontWeight: '600',
      marginBottom: 10,
      lineHeight: 18,
    },
  });
