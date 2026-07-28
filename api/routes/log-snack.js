/**
 * POST /api/log-snack — create/update a user-logged snack; rebalance today only
 * DELETE /api/log-snack — clear snack and restore original meal targets
 *
 * Timezone rule (matches meal_completions):
 * Client sends localDate = local calendar YYYY-MM-DD via
 *   year/month/day from Date#getFullYear/getMonth/getDate (NOT UTC toISOString).
 * Server uses that localDate for completion_date queries and "is today" checks.
 */

import { createClient } from '@supabase/supabase-js';
import { getRequestUserId } from '../lib/requestUser.js';
import { computeNutritionTargets } from '../../shared/lib/tdeeCalc.js';
import {
  formatMealString,
  rebalanceDayMacros,
  restoreDayFromOriginalTargets,
  parseMealMacros,
} from '../../shared/lib/rebalanceDayMacros.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_NAMES_SUN_FIRST = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const MACRO_MAX = { calories: 2000, protein: 300, carbs: 300, fat: 300 };

/**
 * Day-of-week for a client local calendar date (YYYY-MM-DD).
 * Uses UTC noon to avoid DST edge cases; civil date weekday is unambiguous.
 */
function dayOfWeekFromLocalDate(localDate) {
  const [y, m, d] = String(localDate).split('-').map(Number);
  if (!y || !m || !d) return null;
  const utcNoon = new Date(Date.UTC(y, m - 1, d, 12));
  return DAY_NAMES_SUN_FIRST[utcNoon.getUTCDay()];
}

/** Monday (YYYY-MM-DD) of the week containing localDate (Mon-start weeks). */
function mondayOfWeekContaining(localDate) {
  const [y, m, d] = String(localDate).split('-').map(Number);
  if (!y || !m || !d) return null;
  const utcNoon = new Date(Date.UTC(y, m - 1, d, 12));
  const dow = utcNoon.getUTCDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  utcNoon.setUTCDate(utcNoon.getUTCDate() + diff);
  return utcNoon.toISOString().split('T')[0];
}

function isTodaySnackDay({ day, weekStarting, localDate }) {
  if (!localDate || !day || !weekStarting) return false;
  const todayName = dayOfWeekFromLocalDate(localDate);
  const monday = mondayOfWeekContaining(localDate);
  return day === todayName && weekStarting === monday;
}

function validateMacros({ calories, protein, carbs, fat }) {
  const values = { calories, protein, carbs, fat };
  for (const [key, raw] of Object.entries(values)) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, error: `Invalid ${key}: must be a non-negative number` };
    }
    if (n > MACRO_MAX[key]) {
      return { ok: false, error: `Invalid ${key}: max ${MACRO_MAX[key]}` };
    }
    values[key] = n;
  }
  if (values.calories < 1) {
    return { ok: false, error: 'calories must be at least 1' };
  }
  return { ok: true, macros: values };
}

async function loadWeekMeals(userId, weekStarting) {
  const { data, error } = await supabase
    .from('meal_plans')
    .select('id, meals')
    .eq('user_id', userId)
    .eq('week_starting', weekStarting)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function saveWeekMeals(userId, weekStarting, meals, existingId) {
  if (existingId) {
    const { error } = await supabase
      .from('meal_plans')
      .update({ meals, updated_at: new Date().toISOString() })
      .eq('id', existingId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('meal_plans').insert({
    user_id: userId,
    week_starting: weekStarting,
    meals,
  });
  if (error) throw error;
}

async function loadDailyMacros(userId, day) {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('age, height, weight, goal, activity_level, gender, dietary_restrictions')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!profile) {
    throw new Error('User profile not found — complete onboarding before logging snacks');
  }

  // Training optional; budgets without workout shifts still valid
  let trainingPlan = null;
  try {
    const { data: tp } = await supabase
      .from('training_plans')
      .select('plan_data')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    trainingPlan = tp?.plan_data || null;
  } catch {
    trainingPlan = null;
  }

  const dayWorkouts = trainingPlan?.[day]?.workouts || [];
  const dayTiming = trainingPlan?.[day]?.timing || null;
  const timingMap = { Morning: 'am', Afternoon: 'pm', Evening: 'pm' };

  const nutrition = computeNutritionTargets({
    userProfile: profile,
    todayWorkouts: dayWorkouts,
    workoutTiming: timingMap[dayTiming] || null,
  });

  return nutrition.dailyMacros;
}

async function loadCompletedMealTypes(userId, localDate, day) {
  const { data, error } = await supabase
    .from('meal_completions')
    .select('meal_type')
    .eq('user_id', userId)
    .eq('completion_date', localDate)
    .eq('day_of_week', day);

  if (error) throw error;
  return (data || []).map((r) => r.meal_type).filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const body = req.body || {};
    const day = String(body.day || '').trim().toLowerCase();
    const weekStarting = String(body.weekStarting || '').trim();
    const localDate = String(body.localDate || '').trim();

    if (!day || !DAYS.includes(day)) {
      return res.status(400).json({ success: false, error: 'Invalid or missing day' });
    }
    if (!weekStarting || !/^\d{4}-\d{2}-\d{2}$/.test(weekStarting)) {
      return res.status(400).json({ success: false, error: 'Invalid or missing weekStarting' });
    }
    if (!localDate || !/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing localDate (client local YYYY-MM-DD, same as meal_completions)',
      });
    }

    const existing = await loadWeekMeals(userId, weekStarting);
    const weekMeals = { ...(existing?.meals || {}) };
    const dayMeals = { ...(weekMeals[day] || {}) };

    // ── DELETE: clear snack + restore ────────────────────────────────────────
    if (req.method === 'DELETE') {
      const restored = restoreDayFromOriginalTargets(dayMeals);
      weekMeals[day] = restored;
      await saveWeekMeals(userId, weekStarting, weekMeals, existing?.id);

      return res.status(200).json({
        success: true,
        day,
        weekStarting,
        dayMeals: restored,
        rebalanced: Boolean(dayMeals.original_targets),
        over_budget: false,
        adjusted_meal_types: [],
      });
    }

    // ── POST: create/update snack ────────────────────────────────────────────
    const name = String(body.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, error: 'Snack name is required' });
    }

    const validated = validateMacros({
      calories: body.calories,
      protein: body.protein,
      carbs: body.carbs,
      fat: body.fat,
    });
    if (!validated.ok) {
      return res.status(400).json({ success: false, error: validated.error });
    }
    const macros = validated.macros;

    const snackString = formatMealString(name, macros);
    dayMeals.snacks = snackString;
    dayMeals.snacks_user_logged = true;

    const shouldRebalance = isTodaySnackDay({ day, weekStarting, localDate });
    let overBudget = false;
    let adjustedMealTypes = [];
    let rebalanced = false;
    let resultDay = dayMeals;

    if (shouldRebalance) {
      const [dailyMacros, completedMealTypes] = await Promise.all([
        loadDailyMacros(userId, day),
        loadCompletedMealTypes(userId, localDate, day),
      ]);

      const result = rebalanceDayMacros({
        dayMeals,
        dailyMacros,
        completedMealTypes,
        snackMacros: macros,
      });

      resultDay = result.dayMeals;
      overBudget = result.over_budget;
      adjustedMealTypes = result.adjusted_meal_types;
      rebalanced = true;
    }

    weekMeals[day] = resultDay;
    await saveWeekMeals(userId, weekStarting, weekMeals, existing?.id);

    return res.status(200).json({
      success: true,
      day,
      weekStarting,
      dayMeals: resultDay,
      snack: {
        name: parseMealMacros(snackString).name,
        ...macros,
        description: snackString,
      },
      rebalanced,
      over_budget: overBudget,
      adjusted_meal_types: adjustedMealTypes,
    });
  } catch (err) {
    console.error('[api/log-snack] error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to log snack',
    });
  }
}
