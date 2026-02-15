/**
 * TDEE Calculator for Alimenta
 * shared/lib/tdeeCalc.js
 *
 * Computes BMR, TDEE, daily macros, and per-meal macro budgets
 * from user profile + training data.
 *
 * All inputs are the raw values from Supabase (free-text height/weight,
 * inconsistent goal/activity strings from web vs mobile).
 */

// ─── Input Parsing ───────────────────────────────────────────────────────────

/**
 * Parse a free-text height string into centimeters.
 * Handles: "5'8", "5'8\"", "5'7.5\"", "6'2\"", "5 foot 9", "6 feet", "6 ft 7 in", 
 *          "173cm", "173", "68in", "68 inches", "1.73m", "1.73 m"
 */
export function parseHeightCm(raw) {
    if (!raw) return null;
    const s = String(raw).trim().toLowerCase();
  
    // "1.73m" or "1.73 m" or "1.73 meters"
    const mMatch = s.match(/^(\d+\.?\d*)\s*(m|meters?)$/);
    if (mMatch) return parseFloat(mMatch[1]) * 100;
  
    // "173cm" or "173 cm"
    const cmMatch = s.match(/^(\d+\.?\d*)\s*cm$/);
    if (cmMatch) return parseFloat(cmMatch[1]);
  
    // Feet + inches: "5'8", "5'8\"", "5' 8", "5'8\"", "5 ft 8 in", "5 foot 9", "6 feet", etc.
    // Handle various quote characters and words: ', ', ', ′, ft, foot, feet
    const ftInMatch = s.match(/(\d+\.?\d*)\s*(?:'|'|'|′|ft|feet|foot)\s*(\d+\.?\d*)?\s*(?:"|"|"|″|in|inches)?/);
    if (ftInMatch) {
      const feet = parseFloat(ftInMatch[1]);
      const inches = parseFloat(ftInMatch[2] || 0);
      return (feet * 12 + inches) * 2.54;
    }
  
    // "68in" or "68 inches"
    const inMatch = s.match(/^(\d+\.?\d*)\s*(in|inches)$/);
    if (inMatch) return parseFloat(inMatch[1]) * 2.54;
  
    // Plain number: if > 100, assume cm; if <= 100, assume inches
    const num = parseFloat(s);
    if (!isNaN(num)) {
      return num > 100 ? num : num * 2.54;
    }
  
    return null;
  }
  
  /**
   * Parse a free-text weight string into kilograms.
   * Handles: "150 lbs", "150lbs", "150", "68 kg", "68kg"
   */
  export function parseWeightKg(raw) {
    if (!raw) return null;
    const s = String(raw).trim().toLowerCase();
  
    // "68 kg" or "68kg"
    const kgMatch = s.match(/^(\d+\.?\d*)\s*(kg|kgs|kilos?)$/);
    if (kgMatch) return parseFloat(kgMatch[1]);
  
    // "150 lbs" or "150lbs" or "150 pounds"
    const lbMatch = s.match(/^(\d+\.?\d*)\s*(lbs?|pounds?)$/);
    if (lbMatch) return parseFloat(lbMatch[1]) * 0.4536;
  
    // Plain number: if > 120, assume lbs (most users are US-based athletes);
    // if <= 120, assume kg
    const num = parseFloat(s);
    if (!isNaN(num)) {
      return num > 120 ? num * 0.4536 : num;
    }
  
    return null;
  }
  
  // ─── Normalization Maps ──────────────────────────────────────────────────────
  
  /**
   * Normalize the goal string from web ("lose", "maintain", "gain") or
   * mobile ("lose weight", "gain muscle", "maintain weight") into one of
   * three canonical values.
   */
  export function normalizeGoal(raw) {
    const s = (raw || '').trim().toLowerCase();
    if (s.includes('lose')) return 'lose';
    if (s.includes('gain')) return 'gain';
    return 'maintain';
  }
  
  /**
   * Normalize activity level into a multiplier.
   * Web: "low", "moderate", "high"
   * Mobile: "lightly active", "very active", "sedentary", etc.
   */
  export function getActivityMultiplier(raw) {
    const s = (raw || '').trim().toLowerCase();
  
    const map = {
      'sedentary':        1.2,
      'low':              1.2,
      'lightly active':   1.375,
      'light':            1.375,
      'moderate':         1.55,
      'moderately active': 1.55,
      'high':             1.725,
      'very active':      1.725,
      'extra active':     1.9,
    };
  
    return map[s] || 1.55; // default to moderate
  }
  
  /**
   * Normalize gender string.
   */
  export function normalizeGender(raw) {
    const s = (raw || '').trim().toLowerCase();
    if (s === 'male' || s === 'm') return 'male';
    if (s === 'female' || s === 'f') return 'female';
    return 'other';
  }
  
  // ─── Training Adjustment ─────────────────────────────────────────────────────
  
  /**
   * Workout types from the training plan page:
   *   'Rest', 'Distance Run', 'Speed or Agility Training', 'Bike Ride',
   *   'Walk/Hike', 'Swim', 'Strength Training', 'Sport Practice'
   *
   * Each workout has { type, distance, intensity (1–10), notes }.
   * We compute a training multiplier for the day based on all workouts.
   */
  const WORKOUT_BASE_MULTIPLIERS = {
    'rest':                       1.0,
    'distance run':               1.08,
    'speed or agility training':  1.10,
    'bike ride':                  1.06,
    'walk/hike':                  1.03,
    'swim':                       1.08,
    'strength training':          1.06,
    'sport practice':             1.05,
  };
  
  /**
   * Get a training-day calorie multiplier from the day's workouts.
   *
   * @param {Array} workouts - Array of { type, distance, intensity, notes }
   *   from trainingPlan[dayName].workouts.  Can be undefined/empty (rest day).
   * @returns {number} multiplier (1.0 for rest, up to ~1.20 for hard days)
   */
  export function getTrainingMultiplier(workouts) {
    if (!workouts || !Array.isArray(workouts) || workouts.length === 0) {
      return 1.0;
    }
  
    // Filter out empty/rest entries
    const active = workouts.filter(
      (w) => w.type && w.type.toLowerCase() !== 'rest' && w.type.toLowerCase() !== ''
    );
    if (active.length === 0) return 1.0;
  
    // Take the highest-impact workout as the base, then add a small bump
    // for each additional workout (+0.02 each, capped)
    let maxBase = 1.0;
    for (const w of active) {
      const key = (w.type || '').trim().toLowerCase();
      const base = WORKOUT_BASE_MULTIPLIERS[key] || 1.04;
  
      // Scale by intensity (1–10). At intensity 5 → use base as-is.
      // At 10 → base + 0.04 extra. At 1 → base - 0.03.
      const intensityFactor = 1 + ((w.intensity || 5) - 5) * 0.01;
      const adjusted = base * intensityFactor;
  
      if (adjusted > maxBase) maxBase = adjusted;
    }
  
    // Additional workouts add a small bump
    const extraBump = Math.min((active.length - 1) * 0.02, 0.06);
  
    return Math.min(maxBase + extraBump, 1.25); // hard cap at 1.25
  }
  
  // ─── Core Calculations ───────────────────────────────────────────────────────
  
  /**
   * Calculate Basal Metabolic Rate using Mifflin-St Jeor.
   *
   * @param {object} params
   * @param {number} params.weightKg
   * @param {number} params.heightCm
   * @param {number} params.age
   * @param {string} params.gender - "male" | "female" | "other"
   * @returns {number} BMR in kcal/day
   */
  export function calculateBMR({ weightKg, heightCm, age, gender }) {
    // Mifflin-St Jeor:
    //   Male:   10 × kg + 6.25 × cm − 5 × age + 5
    //   Female: 10 × kg + 6.25 × cm − 5 × age − 161
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  
    if (gender === 'male') return base + 5;
    if (gender === 'female') return base - 161;
    // "other": average of male and female
    return base + (5 + -161) / 2; // = base - 78
  }
  
  /**
   * Calculate Total Daily Energy Expenditure.
   *
   * @param {object} params
   * @param {number} params.bmr
   * @param {number} params.activityMultiplier - from getActivityMultiplier()
   * @param {number} params.trainingMultiplier - from getTrainingMultiplier()
   * @param {string} params.goal - "lose" | "maintain" | "gain"
   * @returns {{ tdee: number, adjustedTdee: number, goalMultiplier: number }}
   */
  export function calculateTDEE({ bmr, activityMultiplier, trainingMultiplier, goal }) {
    const tdee = bmr * activityMultiplier * trainingMultiplier;
  
    const goalMultipliers = {
      lose: 0.85,      // 15% deficit
      maintain: 1.0,
      gain: 1.10,      // 10% surplus
    };
    const goalMult = goalMultipliers[goal] || 1.0;
    const adjustedTdee = Math.round(tdee * goalMult);
  
    return { tdee: Math.round(tdee), adjustedTdee, goalMultiplier: goalMult };
  }
  
  /**
   * Calculate daily macro targets from adjusted TDEE and body weight.
   *
   * Marathon/endurance runner defaults:
   *   Protein: 1.6 g/kg body weight
   *   Fat:     25% of calories
   *   Carbs:   remainder
   *
   * @param {object} params
   * @param {number} params.adjustedTdee - goal-adjusted TDEE
   * @param {number} params.weightKg
   * @param {string} params.goal - affects protein multiplier slightly
   * @returns {{ calories: number, protein: number, carbs: number, fat: number }}
   */
  export function calculateDailyMacros({ adjustedTdee, weightKg, goal }) {
    // Protein: higher when cutting (preserve muscle), slightly lower when bulking
    const proteinPerKg = {
      lose: 1.8,
      maintain: 1.6,
      gain: 1.6,
    };
    const protein = Math.round(weightKg * (proteinPerKg[goal] || 1.6));
  
    // Fat: 25% of total calories
    const fat = Math.round((adjustedTdee * 0.25) / 9);
  
    // Carbs: whatever's left
    const proteinCals = protein * 4;
    const fatCals = fat * 9;
    const carbCals = adjustedTdee - proteinCals - fatCals;
    const carbs = Math.round(Math.max(carbCals / 4, 0));
  
    return {
      calories: adjustedTdee,
      protein,
      carbs,
      fat,
    };
  }
  
  // ─── Meal Budget Splitting ───────────────────────────────────────────────────
  
  /**
   * Default meal percentage splits.
   * These sum to 1.0 and represent the share of daily macros per meal slot.
   */
  const DEFAULT_MEAL_SPLITS = {
    breakfast: 0.22,
    lunch:     0.28,
    dinner:    0.30,
    snack:     0.12,
    dessert:   0.08,
  };
  
  /**
   * Split daily macros into per-meal budgets.
   *
   * @param {object} params
   * @param {{ calories, protein, carbs, fat }} params.dailyMacros
   * @param {Array}  [params.workouts]     - today's workouts for carb timing shifts
   * @param {string} [params.workoutTiming] - "am" | "pm" | "midday" | null
   * @param {string[]} [params.mealSlots]  - which meals to generate (defaults to all 5)
   * @returns {Object<string, { calories, protein, carbs, fat }>}
   */
  export function splitMealBudgets({
    dailyMacros,
    workouts = [],
    workoutTiming = null,
    mealSlots = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'],
  }) {
    // Start with default splits, filtered to requested meals
    const splits = {};
    let totalPct = 0;
  
    for (const meal of mealSlots) {
      splits[meal] = DEFAULT_MEAL_SPLITS[meal] || 0.10;
      totalPct += splits[meal];
    }
  
    // Normalize so the requested meals sum to 1.0
    // (e.g., if user skips dessert, redistribute that 8%)
    for (const meal of mealSlots) {
      splits[meal] /= totalPct;
    }
  
    // Training-aware carb shifts
    const hasTraining = workouts && workouts.some(
      (w) => w.type && w.type.toLowerCase() !== 'rest' && w.type !== ''
    );
  
    const carbShifts = {}; // additive shifts to carb percentage (not total calories)
    if (hasTraining && workoutTiming) {
      if (workoutTiming === 'am' && splits.breakfast !== undefined) {
        carbShifts.breakfast = 0.05;
        carbShifts.dinner = -0.05;
      } else if (workoutTiming === 'pm' && splits.lunch !== undefined) {
        carbShifts.lunch = 0.05;
        carbShifts.breakfast = -0.05;
      }
      // Long/hard session: extra carbs in snack for recovery
      const maxIntensity = Math.max(...workouts.map((w) => w.intensity || 0));
      if (maxIntensity >= 7 && splits.snack !== undefined) {
        carbShifts.snack = (carbShifts.snack || 0) + 0.03;
        carbShifts.dinner = (carbShifts.dinner || 0) - 0.03;
      }
    }
  
    // Build per-meal budgets
    const budgets = {};
    for (const meal of mealSlots) {
      const pct = splits[meal];
      const carbPct = pct + (carbShifts[meal] || 0);
  
      budgets[meal] = {
        calories: Math.round(dailyMacros.calories * pct),
        protein: Math.round(dailyMacros.protein * pct),
        carbs: Math.round(dailyMacros.carbs * Math.max(carbPct, 0.02)),
        fat: Math.round(dailyMacros.fat * pct),
      };
    }
  
    return budgets;
  }
  
  /**
   * Compute the remaining macro budget after subtracting already-consumed meals.
   *
   * @param {{ calories, protein, carbs, fat }} dailyMacros - full daily targets
   * @param {Array<{ calories, protein, carbs, fat }>} consumed - meals already eaten/generated
   * @returns {{ calories, protein, carbs, fat }}
   */
  export function getRemainingBudget(dailyMacros, consumed = []) {
    const eaten = consumed.reduce(
      (acc, m) => ({
        calories: acc.calories + (m.calories || 0),
        protein: acc.protein + (m.protein || 0),
        carbs: acc.carbs + (m.carbs || 0),
        fat: acc.fat + (m.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  
    return {
      calories: Math.max(dailyMacros.calories - eaten.calories, 0),
      protein: Math.max(dailyMacros.protein - eaten.protein, 0),
      carbs: Math.max(dailyMacros.carbs - eaten.carbs, 0),
      fat: Math.max(dailyMacros.fat - eaten.fat, 0),
    };
  }
  
  // ─── Main Entry Point ────────────────────────────────────────────────────────
  
  /**
   * All-in-one: from raw user profile + today's training → daily macros + meal budgets.
   *
   * @param {object} params
   * @param {object} params.userProfile - raw from Supabase user_profiles table
   *   { height, weight, age, gender, goal, activity_level }
   * @param {Array}  [params.todayWorkouts] - from trainingPlan[today].workouts
   * @param {string} [params.workoutTiming] - "am" | "pm" | null
   * @param {string[]} [params.mealSlots] - which meals to generate
   * @returns {object} { bmr, tdee, adjustedTdee, dailyMacros, mealBudgets, parsed }
   *   or throws if profile data is insufficient
   */
  export function computeNutritionTargets({
    userProfile,
    todayWorkouts = [],
    workoutTiming = null,
    mealSlots = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'],
  }) {
    // Parse raw inputs
    const heightCm = parseHeightCm(userProfile.height);
    const weightKg = parseWeightKg(userProfile.weight);
    const age = parseInt(userProfile.age, 10);
    const gender = normalizeGender(userProfile.gender);
    const goal = normalizeGoal(userProfile.goal);
    const activityMultiplier = getActivityMultiplier(
      userProfile.activity_level || userProfile.activityLevel
    );
  
    // Validate
    if (!heightCm || !weightKg || !age || isNaN(age)) {
      throw new Error(
        `Incomplete profile data for TDEE calculation. ` +
        `Parsed: height=${heightCm}cm, weight=${weightKg}kg, age=${age}. ` +
        `Raw: height="${userProfile.height}", weight="${userProfile.weight}", age="${userProfile.age}"`
      );
    }
  
    // Compute
    const bmr = calculateBMR({ weightKg, heightCm, age, gender });
    const trainingMultiplier = getTrainingMultiplier(todayWorkouts);
    const { tdee, adjustedTdee, goalMultiplier } = calculateTDEE({
      bmr,
      activityMultiplier,
      trainingMultiplier,
      goal,
    });
    const dailyMacros = calculateDailyMacros({ adjustedTdee, weightKg, goal });
    const mealBudgets = splitMealBudgets({
      dailyMacros,
      workouts: todayWorkouts,
      workoutTiming,
      mealSlots,
    });
  
    return {
      // Raw parsed values (useful for debugging)
      parsed: { heightCm, weightKg, age, gender, goal, activityMultiplier, trainingMultiplier },
      bmr: Math.round(bmr),
      tdee,
      adjustedTdee,
      goalMultiplier,
      dailyMacros,
      mealBudgets,
    };
  }