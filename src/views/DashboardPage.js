import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Flame,
  Plus,
  Check,
  ChevronRight,
  Waves,
  Bike,
  Dumbbell,
  Footprints,
  Zap,
  Bed,
  Activity,
} from 'lucide-react';
import { macroColors } from '../../shared/lib/macroColors';
import { getLocalDateString } from '../dataClient';
import { supabase } from '../supabaseClient';
import {
  calculateDayMacros,
  getDayMealToggles,
  getActiveMealTypes,
  parseMeal,
} from '../utils/mealHelpers';
import { readDashboardCache, writeDashboardCache } from '../utils/dashboardCache';
// Fuel & Recovery card — temporarily disabled, see render section below.
// import { getFuelRecoveryInsight } from '../utils/fuelRecovery';
// import { getFuelTimeline, pickPrimaryWorkout } from '../utils/fuelRecoveryTimeline';
import { DashboardSkeleton } from '../components/shared/LoadingSkeleton';
// import { FuelRecoveryCard } from '../components/dashboard/FuelRecoveryCard';
import { Skeleton } from '@/src/components/ui/skeleton';

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

const formatFullDate = () =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

const formatNumber = (n) => {
  if (n == null || Number.isNaN(n)) return '0';
  return Math.round(n).toLocaleString('en-US');
};

const getFirstName = (profile, isGuest) => {
  const full = profile?.name || '';
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

const WorkoutIcon = ({ type, className = 'w-[18px] h-[18px]' }) => {
  switch (type) {
    case 'Rest':
      return <Bed className={className} />;
    case 'Distance Run':
    case 'Walk/Hike':
      return <Footprints className={className} />;
    case 'Speed or Agility Training':
      return <Zap className={className} />;
    case 'Bike Ride':
      return <Bike className={className} />;
    case 'Swim':
      return <Waves className={className} />;
    case 'Strength Training':
      return <Dumbbell className={className} />;
    case 'Sport Practice':
      return <Activity className={className} />;
    default:
      return <Activity className={className} />;
  }
};

const getTodaysTraining = (loaded, workouts, isGuest, trainingLoading) => {
  if (isGuest || !loaded || trainingLoading) {
    return {
      quote: 'Start where you are.',
      caption: 'Set up a training plan to guide your week.',
      iconType: null,
    };
  }
  if (workouts.length > 0) {
    const first = workouts[0];
    const captionParts = [first.distance, first.intensity].filter(Boolean);
    return {
      quote: first.type || 'Workout day',
      caption:
        captionParts.length > 0
          ? captionParts.join(' · ')
          : 'Your session is ready when you are.',
      iconType: first.type,
    };
  }
  return {
    quote: 'Rest day',
    caption: 'Recovery is part of the plan.',
    iconType: 'Rest',
  };
};

/** SVG macro donut — plan composition by kcal-weighted macros */
function MacroDonut({ data, size = 148, strokeWidth = 18, trackColor = '#E8E2D6' }) {
  const total = data.reduce((sum, d) => sum + Math.max(0, d.value), 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const innerR = r - strokeWidth;
  const pad = 28;
  const view = size + pad;

  if (total <= 0) {
    const mid = (r + innerR) / 2;
    return (
      <svg width={view} height={view} viewBox={`0 0 ${view} ${view}`} className="block">
        <circle
          cx={view / 2}
          cy={view / 2}
          r={mid}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
      </svg>
    );
  }

  let angle = -Math.PI / 2;
  const offset = pad / 2;
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
      `M ${offset + cx + r * cos0} ${offset + cy + r * sin0}`,
      `A ${r} ${r} 0 ${large} 1 ${offset + cx + r * cos1} ${offset + cy + r * sin1}`,
      `L ${offset + cx + innerR * cos1} ${offset + cy + innerR * sin1}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${offset + cx + innerR * cos0} ${offset + cy + innerR * sin0}`,
      'Z',
    ].join(' ');

    const mid = start + sweep / 2;
    const labelR = r + 14;
    return {
      ...d,
      path,
      labelX: offset + cx + labelR * Math.cos(mid),
      labelY: offset + cy + labelR * Math.sin(mid),
    };
  });

  return (
    <svg width={view} height={view} viewBox={`0 0 ${view} ${view}`} className="block">
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} />
      ))}
      {slices.map((s, i) =>
        s.goalPct != null ? (
          <text
            key={`pct-${i}`}
            x={s.labelX}
            y={s.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={s.color}
            className="text-[11px] font-bold"
            style={{ fontSize: 11, fontWeight: 700 }}
          >
            {s.goalPct}%
          </text>
        ) : null
      )}
    </svg>
  );
}

export const DashboardPage = ({
  profile,
  isGuest,
  user,
  mealPlan,
  mealPlanLoading,
  getWorkoutsForDate,
  workoutLoading,
  completions,
  toggleMealCompletion,
  onNavigate,
}) => {
  const cached = user?.id && !isGuest ? readDashboardCache(user.id) : null;
  const [streakInfo, setStreakInfo] = useState(() =>
    cached?.streakInfo || { streak: 0, max_streak: 0, last_streak_date: null }
  );
  const [cachedName, setCachedName] = useState(() => cached?.name || null);

  // Hydrate from localStorage when user id becomes available (client nav)
  useEffect(() => {
    if (!user?.id || isGuest) {
      setCachedName(null);
      return;
    }
    const fromStore = readDashboardCache(user.id);
    if (fromStore?.streakInfo) {
      setStreakInfo(fromStore.streakInfo);
    }
    if (fromStore?.name) {
      setCachedName(fromStore.name);
    }
  }, [user?.id, isGuest]);

  // Persist profile display name when loaded
  useEffect(() => {
    if (!user?.id || isGuest) return;
    const name = profile?.name?.trim();
    if (!name) return;
    setCachedName(name);
    writeDashboardCache(user.id, { name });
  }, [user?.id, isGuest, profile?.name]);

  useEffect(() => {
    if (!user?.id || isGuest) {
      setStreakInfo({ streak: 0, max_streak: 0, last_streak_date: null });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('streak, max_streak, last_streak_date')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn('DashboardPage: streak fetch', error.message);
        return;
      }
      const next = {
        streak: data?.streak ?? 0,
        max_streak: data?.max_streak ?? 0,
        last_streak_date: data?.last_streak_date ?? null,
      };
      setStreakInfo(next);
      writeDashboardCache(user.id, { streakInfo: next });
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isGuest]);

  const todayDay = getTodayDayName();
  const todayDate = formatFullDate();
  const firstName = getFirstName(
    profile?.name ? profile : (cachedName ? { name: cachedName } : profile),
    isGuest
  );
  const todayMeals = mealPlan?.[todayDay];
  const todayToggles = getDayMealToggles(todayMeals);
  const todayActiveTypes = getActiveMealTypes(todayToggles, todayMeals);
  const todayMacros = useMemo(
    () =>
      todayMeals
        ? calculateDayMacros(todayMeals)
        : { calories: 0, protein: 0, carbs: 0, fat: 0 },
    [todayMeals]
  );

  const todayWorkouts = getTodayWorkouts(getWorkoutsForDate?.(getLocalDateString()) || []);
  const todaysTraining = getTodaysTraining(
    !isGuest && !workoutLoading,
    todayWorkouts,
    isGuest,
    workoutLoading
  );

  const eatenMacros = useMemo(() => {
    if (!todayMeals) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const eaten = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    todayActiveTypes.forEach((mealType) => {
      const isCompleted = (completions || []).some(
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
  }, [todayMeals, todayActiveTypes, completions, todayDay]);

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

  // Fuel & Recovery card — temporarily disabled, see render section below.
  // const hasTrainingInfo = !isGuest && !workoutLoading;
  // const isRestDay = hasTrainingInfo && todayWorkouts.length === 0;
  // const primaryWorkout = useMemo(() => pickPrimaryWorkout(todayWorkouts), [todayWorkouts]);
  //
  // const fuelRecovery = useMemo(
  //   () =>
  //     getFuelRecoveryInsight({
  //       hasLoggedMeal: eatenMacros.calories > 0,
  //       macroTargets: todayMacros,
  //       macroEaten: eatenMacros,
  //       hasTrainingInfo,
  //       isRestDay,
  //       workout: primaryWorkout,
  //     }),
  //   [eatenMacros, todayMacros, hasTrainingInfo, isRestDay, primaryWorkout]
  // );
  //
  // const fuelTimeline = useMemo(
  //   () => getFuelTimeline({ workouts: todayWorkouts }),
  //   [todayWorkouts]
  // );

  const displayStreak = (() => {
    const raw = streakInfo.streak ?? 0;
    const last = streakInfo.last_streak_date;
    if (!last || raw === 0) return raw;
    const today = getLocalDateString();
    const yesterday = getLocalDateString(-1);
    if (last === today || last === yesterday) return raw;
    return 0;
  })();
  const maxStreak = streakInfo.max_streak ?? 0;

  const chipTypes = MEAL_CHIP_ORDER.filter(
    (t) => t !== 'dessert' || todayActiveTypes.includes('dessert')
  );

  const handleMealChipPress = useCallback(
    async (mealType) => {
      const meal = todayMeals?.[mealType];
      const hasMeal = meal && typeof meal === 'string' && meal.trim();
      if (hasMeal && !isGuest && toggleMealCompletion) {
        try {
          await toggleMealCompletion(todayDay, mealType);
        } catch {
          onNavigate?.('meals');
        }
        return;
      }
      onNavigate?.('meals');
    },
    [todayMeals, isGuest, toggleMealCompletion, todayDay, onNavigate]
  );

  const streakSubtext = (() => {
    if (displayStreak > 0 && maxStreak > 0 && displayStreak >= maxStreak) {
      return 'This is your best streak! Keep going.';
    }
    if (maxStreak > 0) {
      return `Your best is ${maxStreak}. Keep going.`;
    }
    return 'Log today to keep it alive.';
  })();

  const hasMeals =
    mealPlan &&
    Object.values(mealPlan).some(
      (day) =>
        day &&
        ['breakfast', 'lunch', 'dinner', 'snacks', 'dessert'].some((key) => {
          const meal = day[key];
          if (!meal) return false;
          if (typeof meal === 'string') return meal.trim().length > 0;
          return Boolean(meal?.name || meal?.ingredients || meal?.foods);
        })
    );

  if ((mealPlanLoading || workoutLoading) && !hasMeals) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="mx-auto space-y-4 max-w-3xl">
      {/* Greeting */}
      <div className="mb-1">
        <h2 className="text-3xl sm:text-[2rem] font-bold tracking-tight text-gray-900">
          Hey <span className="text-primary">{firstName},</span>
        </h2>
        <p className="mt-1 text-[15px] font-medium text-gray-500">{todayDate}</p>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-3.5 rounded-2xl bg-primary px-4 py-4 sm:px-[18px] text-white">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/12">
          <Flame className="w-7 h-7 text-[#F0A03A]" fill="#F0A03A" />
        </div>
        <div className="min-w-0">
          <p className="text-lg sm:text-xl font-extrabold leading-tight">
            {displayStreak} day streak!
          </p>
          <p className="text-sm font-medium text-white/80 mt-0.5">{streakSubtext}</p>
        </div>
      </div>

      {/* Today's Nutrition */}
      <div className="warm-card overflow-hidden">
        <button
          type="button"
          onClick={() => onNavigate?.('meals')}
          className="w-full text-left p-4 sm:p-5 hover:bg-cream-50/60 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-bold tracking-widest text-gray-500 uppercase">
              Today&apos;s Nutrition
            </span>
            {todayMacros.calories > 0 ? (
              <span
                className={`text-[11px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-lg ${
                  isOnTrack
                    ? 'bg-primary-50 text-primary'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {isOnTrack ? 'On track' : 'Over'}
              </span>
            ) : null}
          </div>

          {mealPlanLoading ? (
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              <Skeleton className="h-36 w-36 rounded-full shrink-0" />
              <div className="w-full sm:flex-1 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              <div className="relative shrink-0">
                <MacroDonut
                  data={macroGoalRows.map((m) => ({
                    value: todayMacros.calories > 0 ? m.donutValue : 0,
                    color: m.color,
                    goalPct: todayMacros.calories > 0 ? m.pct : null,
                  }))}
                />
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 leading-none">
                    {todayMacros.calories > 0 ? formatNumber(displayCalories) : '—'}
                  </span>
                  <span className="text-xs font-semibold text-gray-500 mt-0.5">kcal</span>
                </div>
              </div>

              <div className="w-full sm:flex-1 space-y-0">
                {macroGoalRows.map((m, index) => (
                  <div
                    key={m.key}
                    className={`flex items-center justify-between py-2.5 ${
                      index < macroGoalRows.length - 1 ? 'border-b border-cream-300' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: m.color }}
                      />
                      <span className="text-sm font-semibold text-gray-700">{m.label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {todayMacros.calories > 0 ? `${Math.round(m.eaten)}g` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </button>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 pb-4 sm:px-5 sm:pb-5">
          {chipTypes.map((mealType) => {
            const meal = todayMeals?.[mealType];
            const parsed = meal ? parseMeal(meal) : { calories: 0 };
            const isCompleted = (completions || []).some(
              (c) => c.day_of_week === todayDay && c.meal_type === mealType
            );
            const hasMeal = meal && typeof meal === 'string' && meal.trim();
            const logged = isCompleted && hasMeal;

            return (
              <button
                key={mealType}
                type="button"
                onClick={() => handleMealChipPress(mealType)}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-3 text-center transition-colors min-h-[72px] ${
                  logged
                    ? 'bg-primary-50 text-primary'
                    : 'bg-cream-200 text-gray-600 hover:bg-cream-300'
                }`}
              >
                {logged ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                ) : (
                  <Plus className="w-4 h-4 text-gray-400" />
                )}
                <span className={`text-xs font-bold ${logged ? 'text-primary' : 'text-gray-600'}`}>
                  {MEAL_LABELS[mealType] || mealType}
                </span>
                {logged ? (
                  <span className="text-[11px] font-semibold text-primary/80">{parsed.calories}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Training */}
      <button
        type="button"
        onClick={() => onNavigate?.('training')}
        className="w-full flex items-center gap-3.5 rounded-2xl bg-[#E6DFD2] px-4 py-4 text-left transition-colors hover:bg-[#ddd5c6]"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/70 text-primary">
          <WorkoutIcon type={todaysTraining.iconType} className="w-[18px] h-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">
            Today&apos;s Training
          </p>
          <p className="text-lg font-semibold italic text-gray-900 leading-snug mt-0.5">
            {todaysTraining.quote}
          </p>
          <p className="text-sm font-medium text-gray-600 mt-0.5">{todaysTraining.caption}</p>
        </div>
        <ChevronRight className="w-[18px] h-[18px] shrink-0 text-gray-400" />
      </button>

      {/* Fuel & Recovery — temporarily disabled
      <FuelRecoveryCard
        {...fuelRecovery}
        timeline={fuelTimeline}
        onOpen={() => onNavigate?.(fuelRecovery.openTarget)}
      />
      */}
    </div>
  );
};
