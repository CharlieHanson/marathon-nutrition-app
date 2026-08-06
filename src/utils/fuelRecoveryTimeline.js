/**
 * Workout-aware "fueling window" timeline for the Fuel & Recovery card.
 *
 * The workout log only stores a coarse `timing` bucket (Morning/Afternoon/
 * Evening), a free-text `distance`, and an `intensity` — no clock time, no
 * duration, no completion flag (see src/hooks/useWorkoutLog.js). Everything
 * time-based here is therefore a best-effort placeholder anchored to a
 * representative hour per bucket, structured so it's a one-line swap once
 * real scheduling/completion data exists.
 *
 * Category mapping is best-effort against the app's existing WORKOUT_TYPES
 * (src/views/TrainingPlanPage.js) — there is no native HIIT or yoga type.
 * 'Sport Practice' and any unrecognized type fall back to the generic
 * category rather than guessing a specific one.
 */

export const TIMELINE_CATEGORIES = {
  endurance: {
    icon: '🏃',
    iconByType: { 'Bike Ride': '🚴', Swim: '🏊' },
    preFuel: { emphasis: 'Carb-forward', window: '60–90 min before' },
    postFuel: { emphasis: 'Carbs + protein', window: 'Within 45 min after' },
    preWindowMinutes: 90,
    workoutDurationMinutes: 60,
    postWindowMinutes: 45,
    tips: {
      pre: 'Endurance tip: carbs ~60–90 min out help top off glycogen — aim for about 30–40g of carbs before you head out.',
      post: 'Endurance tip: carbs + protein within 45 min after help refill glycogen and start repair — a mixed snack or meal works well.',
    },
  },
  strength: {
    icon: '🏋️',
    preFuel: { emphasis: 'Balanced protein + carb', window: '60–90 min before' },
    postFuel: { emphasis: 'Protein-forward', window: 'Within 45–60 min after' },
    preWindowMinutes: 90,
    workoutDurationMinutes: 60,
    postWindowMinutes: 60,
    tips: {
      pre: 'Strength tip: a protein + carb combo ~60–90 min out supports performance — aim for about 20–25g of protein beforehand.',
      post: 'Strength tip: protein-forward food within 45–60 min after supports muscle repair — aim for about 25–30g of protein.',
    },
  },
  hiit: {
    icon: '⚡',
    preFuel: { emphasis: 'Light, easily-digestible carb', window: '30–60 min before' },
    postFuel: { emphasis: 'Carb + protein replenish', window: 'Within 30–45 min after' },
    preWindowMinutes: 60,
    workoutDurationMinutes: 45,
    postWindowMinutes: 45,
    tips: {
      pre: 'Interval tip: a light, easily-digestible carb snack ~30–60 min out fuels quick efforts without weighing you down.',
      post: 'Interval tip: carbs + protein within 30–45 min after help you recover for the next session.',
    },
  },
  lowIntensity: {
    icon: '🧘',
    preFuel: { emphasis: 'Optional light snack', window: '30–60 min before' },
    postFuel: { emphasis: 'Hydration + light protein', window: 'Flexible, within 60 min' },
    preWindowMinutes: 60,
    workoutDurationMinutes: 45,
    postWindowMinutes: 60,
    tips: {
      pre: 'Mobility tip: a light snack is optional here — this kind of session doesn’t demand much extra fuel.',
      post: 'Mobility tip: focus on hydration and a little protein — recovery here is about consistency, not urgency.',
    },
  },
  generic: {
    icon: '🏅',
    preFuel: { emphasis: 'Balanced snack', window: '~60 min before' },
    postFuel: { emphasis: 'Balanced refuel', window: 'Within 60 min after' },
    preWindowMinutes: 60,
    workoutDurationMinutes: 60,
    postWindowMinutes: 60,
    tips: {
      pre: 'General tip: a balanced snack within the hour before activity supports steady energy.',
      post: 'General tip: a balanced snack within the hour after activity supports recovery.',
    },
  },
};

// Best-effort mapping onto the app's actual WORKOUT_TYPES. Anything not
// listed here (e.g. 'Sport Practice', future types) falls back to 'generic'.
const TYPE_TO_CATEGORY = {
  'Distance Run': 'endurance',
  'Bike Ride': 'endurance',
  Swim: 'endurance',
  'Strength Training': 'strength',
  'Speed or Agility Training': 'hiit',
  'Walk/Hike': 'lowIntensity',
};

const TIMING_ANCHOR_HOUR = { Morning: 8, Afternoon: 14, Evening: 19 };
const DEFAULT_ANCHOR_HOUR = 12;
const TIMING_RANK = { Morning: 0, Afternoon: 1, Evening: 2 };

export function getWorkoutCategoryKey(type) {
  return TYPE_TO_CATEGORY[type] || 'generic';
}

function getCategoryIcon(categoryKey, type) {
  const category = TIMELINE_CATEGORIES[categoryKey];
  return category.iconByType?.[type] || category.icon;
}

function getAnchorHour(timing) {
  return TIMING_ANCHOR_HOUR[timing] ?? DEFAULT_ANCHOR_HOUR;
}

/**
 * Coarse phase of today's fueling window, given only a Morning/Afternoon/
 * Evening bucket. Returns 'pre' | 'workout' | 'post' | 'done' | null
 * (null = pre-fuel window hasn't opened yet, nothing should pulse).
 */
export function getTimelinePhase(categoryKey, timing, now = new Date()) {
  const category = TIMELINE_CATEGORIES[categoryKey];
  const anchorMinutes = getAnchorHour(timing) * 60;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const preOpenMinutes = anchorMinutes - category.preWindowMinutes;
  const workoutEndMinutes = anchorMinutes + category.workoutDurationMinutes;
  const postCloseMinutes = workoutEndMinutes + category.postWindowMinutes;

  if (nowMinutes < preOpenMinutes) return null;
  if (nowMinutes < anchorMinutes) return 'pre';
  if (nowMinutes < workoutEndMinutes) return 'workout';
  if (nowMinutes < postCloseMinutes) return 'post';
  return 'done';
}

const HYDRATION_BASE_ML = 250;
const HYDRATION_BY_INTENSITY = {
  High: { amount: 500, bumpLabel: 'High intensity · +50% target' },
  Medium: { amount: 350, bumpLabel: 'Medium intensity · +25% target' },
  Low: { amount: HYDRATION_BASE_ML, bumpLabel: 'Standard target' },
  Recovery: { amount: HYDRATION_BASE_ML, bumpLabel: 'Standard target' },
};

export function getHydrationSuggestion(intensity) {
  return HYDRATION_BY_INTENSITY[intensity] || { amount: HYDRATION_BASE_ML, bumpLabel: 'Standard target' };
}

/**
 * Picks which of today's logged workouts the timeline should describe.
 * Assumption (flagged per spec): with no real scheduling data, "soonest
 * upcoming, else most recently active" is approximated by sorting on the
 * Morning/Afternoon/Evening bucket and picking the first one whose window
 * hasn't fully closed — falling back to the last (most recent) if all are done.
 */
export function pickPrimaryWorkout(workouts, now = new Date()) {
  const meaningful = (workouts || []).filter((w) => w?.type && w.type !== 'Rest');
  if (!meaningful.length) return null;

  const sorted = [...meaningful].sort(
    (a, b) => (TIMING_RANK[a.timing] ?? 3) - (TIMING_RANK[b.timing] ?? 3)
  );

  const stillRelevant = sorted.find((w) => {
    const categoryKey = getWorkoutCategoryKey(w.type);
    return getTimelinePhase(categoryKey, w.timing, now) !== 'done';
  });

  return stillRelevant || sorted[sorted.length - 1];
}

/**
 * Builds the full timeline view-model for today's primary workout, or null
 * when there's nothing to show (no meaningful workout logged today).
 */
export function getFuelTimeline({ workouts, now = new Date() }) {
  const workout = pickPrimaryWorkout(workouts, now);
  if (!workout) return null;

  const categoryKey = getWorkoutCategoryKey(workout.type);
  const category = TIMELINE_CATEGORIES[categoryKey];
  const phase = getTimelinePhase(categoryKey, workout.timing, now);
  const icon = getCategoryIcon(categoryKey, workout.type);
  const isDoneAt = { pre: 0, workout: 1, post: 2, done: 3 }[phase ?? 'pre'] ?? -1;

  const stops = [
    {
      key: 'pre',
      icon: '🍽️',
      title: 'Pre-fuel',
      sub: `${category.preFuel.emphasis} · ${category.preFuel.window}`,
      isNow: phase === 'pre',
      isDone: isDoneAt > 0,
    },
    {
      key: 'workout',
      icon,
      title: workout.type,
      sub: workout.intensity ? `${workout.intensity} intensity` : (workout.distance || 'Today’s session'),
      isNow: phase === 'workout',
      isDone: isDoneAt > 1,
    },
    {
      key: 'post',
      icon: '🥤',
      title: 'Post-fuel',
      sub: `${category.postFuel.emphasis} · ${category.postFuel.window}`,
      isNow: phase === 'post',
      isDone: isDoneAt > 2,
    },
  ];

  const tip = phase === 'workout' || phase === 'post' || phase === 'done'
    ? category.tips.post
    : category.tips.pre;

  return {
    categoryKey,
    workoutLabel: workout.type,
    intensity: workout.intensity || null,
    phase,
    stops,
    tip,
    hydration: getHydrationSuggestion(workout.intensity),
  };
}
