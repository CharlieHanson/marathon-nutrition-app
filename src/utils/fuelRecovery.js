/**
 * Placeholder decision logic for the "Fuel & Recovery" dashboard card's
 * status/badge/headline (the ring + hero text). The workout-specific
 * fueling window shown below it is computed separately in
 * fuelRecoveryTimeline.js.
 *
 * Framing is intentionally about fueling, performance, and recovery — never
 * "calories in vs. calories out" or "earning" food. Thresholds below are
 * simple placeholders; swap in real physiology-driven rules once backend
 * support (e.g. workout completion) exists without changing the shape
 * consumed by <FuelRecoveryCard>.
 */

const PROTEIN_LOW_RATIO = 0.6;
const PROTEIN_WELL_FUELED_RATIO = 0.85;

/** Rough heuristic for whether today's workout has likely already happened. */
function isLikelyPastWorkout(timing, now) {
  const hour = now.getHours();
  if (timing === 'Morning') return hour >= 12;
  if (timing === 'Afternoon') return hour >= 17;
  if (timing === 'Evening') return hour >= 21;
  return hour >= 15;
}

/**
 * @param {object} input
 * @param {boolean} input.hasLoggedMeal - user has logged/completed at least one meal today
 * @param {{calories:number,protein:number,carbs:number,fat:number}} input.macroTargets - today's plan targets
 * @param {{calories:number,protein:number,carbs:number,fat:number}} input.macroEaten - logged so far today
 * @param {boolean} input.hasTrainingInfo - training data has loaded for a real (non-guest) user
 * @param {boolean} input.isRestDay - hasTrainingInfo is true and no workout is scheduled today
 * @param {{type?:string,intensity?:string,distance?:string,timing?:string}|null} input.workout - today's primary workout, if any
 * @param {Date} [input.now]
 */
export function getFuelRecoveryInsight({
  hasLoggedMeal,
  macroTargets,
  macroEaten,
  hasTrainingInfo,
  isRestDay,
  workout,
  now = new Date(),
}) {
  const hasNutritionData = Boolean(hasLoggedMeal);
  const hasTrainingData = Boolean(hasTrainingInfo);

  const proteinTarget = macroTargets?.protein || 0;
  const proteinEaten = macroEaten?.protein || 0;
  const proteinRatio = proteinTarget > 0 ? proteinEaten / proteinTarget : null;
  const intensity = workout?.intensity || null;

  // No data at all — avoid implying any conclusion.
  if (!hasNutritionData && !hasTrainingData) {
    return {
      status: 'Get started',
      tone: 'neutral',
      title: 'Add today’s info for a fuel insight',
      description: 'Log a meal and add today’s training to receive a personalized fuel insight.',
      balancePosition: null,
      recommendation: 'Log a meal or set up training',
      hasNutritionData,
      hasTrainingData,
      openTarget: 'meals',
    };
  }

  // Partial data — only one side known. Keep the assessment explicitly limited.
  if (!hasNutritionData || !hasTrainingData) {
    if (hasNutritionData) {
      return {
        status: 'Limited insight',
        tone: 'neutral',
        title: 'Nutrition looks logged for today',
        description: 'Add today’s training to get a full fuel and recovery picture.',
        balancePosition: null,
        recommendation: 'Add today’s training',
        hasNutritionData,
        hasTrainingData,
        openTarget: 'training',
      };
    }
    return {
      status: 'Limited insight',
      tone: 'neutral',
      title: isRestDay ? 'Resting today' : 'Training is on the books',
      description: 'Log a meal to see how it lines up with today’s training.',
      balancePosition: null,
      recommendation: 'Log a meal',
      hasNutritionData,
      hasTrainingData,
      openTarget: 'meals',
    };
  }

  // Both sides known.
  if (isRestDay) {
    return {
      status: 'Rest day balance',
      tone: 'positive',
      title: 'Recovery day',
      description: 'Focus on steady meals, hydration, and recovery today.',
      balancePosition: 55,
      recommendation: 'Review today’s nutrition',
      hasNutritionData,
      hasTrainingData,
      openTarget: 'meals',
    };
  }

  const pastWorkout = isLikelyPastWorkout(workout?.timing, now);

  if (pastWorkout && proteinRatio != null && proteinRatio < PROTEIN_LOW_RATIO) {
    return {
      status: 'More fuel recommended',
      tone: 'attention',
      title: 'Refuel to support recovery',
      description: 'You may benefit from additional carbohydrates and protein after today’s workout.',
      balancePosition: 22,
      recommendation: 'Add a recovery meal',
      hasNutritionData,
      hasTrainingData,
      openTarget: 'meals',
    };
  }

  if (!pastWorkout && intensity === 'High') {
    return {
      status: 'Prepare to fuel',
      tone: 'attention',
      title: 'Fuel up before you train',
      description: 'Your planned workout may require additional carbohydrates and hydration.',
      balancePosition: 35,
      recommendation: 'Plan a pre-workout meal',
      hasNutritionData,
      hasTrainingData,
      openTarget: 'meals',
    };
  }

  const wellFueled = proteinRatio == null || proteinRatio >= PROTEIN_WELL_FUELED_RATIO;
  return {
    status: 'Balanced',
    tone: 'positive',
    title: wellFueled ? 'Well fueled for today’s training' : 'Balanced for today',
    description: 'Your meals are supporting today’s activity and recovery needs.',
    balancePosition: wellFueled ? 68 : 55,
    recommendation: 'View your daily balance',
    hasNutritionData,
    hasTrainingData,
    openTarget: 'meals',
  };
}

/** Sample fixtures covering each card state — useful for manual QA/tests. */
export const FUEL_RECOVERY_MOCK_STATES = {
  moreFuelRecommended: getFuelRecoveryInsight({
    hasLoggedMeal: true,
    macroTargets: { calories: 2400, protein: 140, carbs: 280, fat: 80 },
    macroEaten: { calories: 900, protein: 40, carbs: 100, fat: 30 },
    hasTrainingInfo: true,
    isRestDay: false,
    workout: { type: 'Distance Run', intensity: 'High', timing: 'Morning' },
    now: new Date(new Date().setHours(14, 0, 0, 0)),
  }),
  balanced: getFuelRecoveryInsight({
    hasLoggedMeal: true,
    macroTargets: { calories: 2400, protein: 140, carbs: 280, fat: 80 },
    macroEaten: { calories: 2100, protein: 130, carbs: 250, fat: 70 },
    hasTrainingInfo: true,
    isRestDay: false,
    workout: { type: 'Bike Ride', intensity: 'Medium', timing: 'Morning' },
    now: new Date(new Date().setHours(18, 0, 0, 0)),
  }),
  prepareToFuel: getFuelRecoveryInsight({
    hasLoggedMeal: true,
    macroTargets: { calories: 2400, protein: 140, carbs: 280, fat: 80 },
    macroEaten: { calories: 500, protein: 25, carbs: 60, fat: 15 },
    hasTrainingInfo: true,
    isRestDay: false,
    workout: { type: 'Distance Run', intensity: 'High', timing: 'Evening' },
    now: new Date(new Date().setHours(9, 0, 0, 0)),
  }),
  restDay: getFuelRecoveryInsight({
    hasLoggedMeal: true,
    macroTargets: { calories: 2200, protein: 120, carbs: 240, fat: 75 },
    macroEaten: { calories: 1200, protein: 70, carbs: 140, fat: 40 },
    hasTrainingInfo: true,
    isRestDay: true,
    workout: null,
  }),
  empty: getFuelRecoveryInsight({
    hasLoggedMeal: false,
    macroTargets: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    macroEaten: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    hasTrainingInfo: false,
    isRestDay: false,
    workout: null,
  }),
  partialNutritionOnly: getFuelRecoveryInsight({
    hasLoggedMeal: true,
    macroTargets: { calories: 2200, protein: 120, carbs: 240, fat: 75 },
    macroEaten: { calories: 600, protein: 30, carbs: 70, fat: 20 },
    hasTrainingInfo: false,
    isRestDay: false,
    workout: null,
  }),
  partialTrainingOnly: getFuelRecoveryInsight({
    hasLoggedMeal: false,
    macroTargets: { calories: 2200, protein: 120, carbs: 240, fat: 75 },
    macroEaten: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    hasTrainingInfo: true,
    isRestDay: false,
    workout: { type: 'Swim', intensity: 'Medium', timing: 'Evening' },
  }),
};
