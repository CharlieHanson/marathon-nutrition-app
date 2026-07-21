// api/server.js
// Standalone Express service exposing the backend routes that used to live in
// the Next.js `pages/api` tree. Route handlers keep their original
// `(req, res)` Next.js signature; Express populates `req.query`/`req.body` and
// `res.status().json()` the same way, so the handlers run unmodified.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// ── Route handlers (default export = Next-style (req, res) handler) ──────────
import deleteAccount from './routes/delete-account.js';
import estimateMacros from './routes/estimate-macros.js';
import mealPlan from './routes/meal-plan.js';
import preferences from './routes/preferences.js';
import profile from './routes/profile.js';
import getRecipe from './routes/get-recipe.js';

import generateDay from './routes/generate-day.js';
import generateDayGemini from './routes/generate-day-gemini.js';
import generateDayOpenai from './routes/generate-day-openai.js';
import generateDayWeb from './routes/generate-day-web.js';
import generateDayWebGemini from './routes/generate-day-web-gemini.js';
import generateDayWebOpenai from './routes/generate-day-web-openai.js';

import generateMealPrep from './routes/generate-meal-prep.js';
import generateMealPrepGemini from './routes/generate-meal-prep-gemini.js';
import generateMealPrepOpenai from './routes/generate-meal-prep-openai.js';

import generateSingleMeal from './routes/generate-single-meal.js';
import generateSingleMealGemini from './routes/generate-single-meal-gemini.js';
import generateSingleMealOpenai from './routes/generate-single-meal-openai.js';

import regenerateMeal from './routes/regenerate-meal.js';
import regenerateMealGemini from './routes/regenerate-meal-gemini.js';
import regenerateMealOpenai from './routes/regenerate-meal-openai.js';

import generateMeals from './routes/generate-meals.js';
import generateGroceryList from './routes/generate-grocery-list.js';
import rateMeal from './routes/rate-meal.js';

import proClients from './routes/pro/clients.js';
import proDashboard from './routes/pro/dashboard.js';
import proProfile from './routes/pro/profile.js';

const app = express();

// ── Body parsing (MUST be registered before routes) ─────────────────────────
// Meal-generation payloads carry a full week of meals + profile/training data,
// so allow a generous limit well above the default 100kb.
app.use(express.json({ limit: '5mb' }));

// ── CORS ─────────────────────────────────────────────────────────────────
// Allowed origins come from CORS_ORIGINS (comma-separated). If unset, allow
// all origins — intended for local development only.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (mobile apps, curl) that send no Origin,
      // and allow everything when no allowlist is configured.
      if (!origin || allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
  })
);

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.status(200).json({ ok: true }));

// ── Routes ──────────────────────────────────────────────────────────────────
// Paths are preserved exactly as they were under pages/api so existing clients
// keep working. Handlers do their own method checking (and return 405), so each
// path is registered with app.all().
const routes = {
  '/api/delete-account': deleteAccount,
  '/api/estimate-macros': estimateMacros,
  '/api/meal-plan': mealPlan,
  '/api/preferences': preferences,
  '/api/profile': profile,
  '/api/get-recipe': getRecipe,

  '/api/generate-day': generateDay,
  '/api/generate-day-gemini': generateDayGemini,
  '/api/generate-day-openai': generateDayOpenai,
  '/api/generate-day-web': generateDayWeb,
  '/api/generate-day-web-gemini': generateDayWebGemini,
  '/api/generate-day-web-openai': generateDayWebOpenai,

  '/api/generate-meal-prep': generateMealPrep,
  '/api/generate-meal-prep-gemini': generateMealPrepGemini,
  '/api/generate-meal-prep-openai': generateMealPrepOpenai,

  '/api/generate-single-meal': generateSingleMeal,
  '/api/generate-single-meal-gemini': generateSingleMealGemini,
  '/api/generate-single-meal-openai': generateSingleMealOpenai,

  '/api/regenerate-meal': regenerateMeal,
  '/api/regenerate-meal-gemini': regenerateMealGemini,
  '/api/regenerate-meal-openai': regenerateMealOpenai,

  '/api/generate-meals': generateMeals,
  '/api/generate-grocery-list': generateGroceryList,
  '/api/rate-meal': rateMeal,

  '/api/pro/clients': proClients,
  '/api/pro/dashboard': proDashboard,
  '/api/pro/profile': proProfile,
};

for (const [path, handler] of Object.entries(routes)) {
  app.all(path, handler);
}

// ── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
  console.log(
    `[api] CORS: ${
      allowedOrigins.length ? allowedOrigins.join(', ') : 'all origins (dev)'
    }`
  );
});
