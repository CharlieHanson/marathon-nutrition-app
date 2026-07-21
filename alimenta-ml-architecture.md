# Alimenta ML/AI Architecture — Implementation Plan

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      USER PROFILE                           │
│  height, weight, age, sex, activity_level, goal,            │
│  training_program, dietary_restrictions, food_preferences   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   TDEE CALCULATOR      │
              │   (deterministic)      │
              │                        │
              │  Mifflin-St Jeor BMR   │
              │  × activity multiplier │
              │  + training adjustment │
              │  → goal adjustment     │
              │                        │
              │  OUTPUT:               │
              │  daily_kcal, P, C, F   │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │   MEAL BUDGET          │
              │   SPLITTER             │
              │                        │
              │  daily macros ÷ meals  │
              │  goal-aware splits     │
              │  training-time shifts  │
              │                        │
              │  OUTPUT:               │
              │  per-meal macro budget  │
              │  {breakfast, lunch,     │
              │   dinner, snack,       │
              │   dessert}             │
              └───────────┬────────────┘
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
     ┌────────────┐ ┌──────────┐ ┌───────────┐
     │ GENERATE   │ │ GENERATE │ │ USER      │
     │ DAY/WEEK   │ │ SINGLE   │ │ ENTERS    │
     │            │ │ MEAL     │ │ OWN MEAL  │
     └─────┬──────┘ └────┬─────┘ └─────┬─────┘
           │              │             │
           ▼              ▼             ▼
     ┌────────────────────────────────────────┐
     │         OpenAI API CALL                │
     │  (meal composition OR meal parsing)    │
     │                                        │
     │  Returns: structured JSON              │
     │  [{name, type, grams}, ...]            │
     └───────────────────┬────────────────────┘
                         │
                         ▼
              ┌────────────────────────┐
              │   ML DENSITY LOOKUP    │
              │                        │
              │  ingredients × grams   │
              │  × type_macro_densities│
              │  → actual P, C, F, kcal│
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │   ALGEBRAIC SCALER    │
              │                        │
              │  if drift > threshold: │
              │  scale portions to hit │
              │  macro targets         │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │   FINAL MEAL OUTPUT    │
              │                        │
              │  meal_name, ingredients│
              │  with adjusted grams,  │
              │  final P/C/F/kcal      │
              └────────────────────────┘
```

---

## TDEE Calculator & Meal Budget Splitter

### When They Run

| Trigger | What Happens |
|---------|-------------|
| User completes onboarding | Compute TDEE + daily macros, store in `user_profiles` table |
| User updates profile (weight, goal, activity) | Recompute and update stored values |
| User's training week changes | Recompute (training adjustment may differ day-to-day) |
| Any generate endpoint is called | Read stored daily macros, run meal budget splitter on the fly |

### Where Output Lives

```
user_profiles table (or user_nutrition_targets):
  - user_id
  - bmr
  - tdee
  - daily_kcal
  - daily_protein_g
  - daily_carbs_g
  - daily_fat_g
  - computed_at (timestamp)
```

The **meal budget split** is computed at request time (not stored) because it depends on:
- what's already been eaten/generated that day
- today's specific training session
- whether the user has all 5 meals or skipped some

### TDEE Formula

```
BMR (Mifflin-St Jeor):
  Male:   10 × weight_kg + 6.25 × height_cm - 5 × age - 5 + 161
  Female: 10 × weight_kg + 6.25 × height_cm - 5 × age - 161

TDEE = BMR × activity_multiplier × training_adjustment

Activity multipliers:
  sedentary:        1.2
  lightly_active:   1.375
  moderately_active: 1.55
  very_active:      1.725
  extra_active:     1.9

Training adjustment (daily, based on that day's session):
  rest_day:         1.0
  easy_run:         1.05
  moderate_run:     1.10
  long_run:         1.15
  tempo/intervals:  1.12
  race:             1.20

Goal adjustment:
  lose_weight:      TDEE × 0.85  (15% deficit)
  maintain:         TDEE × 1.0
  gain_weight:      TDEE × 1.10  (10% surplus)
```

### Macro Split (from daily kcal)

```
Marathon/endurance runner defaults:
  Protein: 1.6 g/kg body weight (range: 1.4–2.0)
  Fat:     25% of daily kcal → fat_g = (daily_kcal × 0.25) / 9
  Carbs:   remainder → carbs_g = (daily_kcal - protein_g×4 - fat_g×9) / 4
```

### Meal Budget Splitting

```
Default split (% of daily macros):
  breakfast:  22%
  lunch:      28%
  dinner:     30%
  snack:      12%
  dessert:     8%

Training-aware adjustments:
  If workout is AM → shift +5% carbs to breakfast, -5% from dinner
  If workout is PM → shift +5% carbs to lunch, -5% from breakfast
  Long run day    → shift +3% carbs to snack (recovery)

Each meal gets:
  target_kcal = daily_kcal × meal_pct
  target_protein = daily_protein × meal_pct
  target_carbs = daily_carbs × meal_pct  (with training shifts)
  target_fat = daily_fat × meal_pct
```

---

## Endpoint Flows (Detailed)

### Flow 1: generate-day.js (Mobile — Full Day)

```
REQUEST: POST /api/generate-day
Body: { user_id, date }

STEP 1: Load user data
  ├── user_profiles → daily_kcal, P, C, F targets
  ├── training_program → today's session, tomorrow's session
  ├── food_preferences → likes, dislikes, cuisines
  ├── dietary_restrictions
  └── week_meals → what's been generated this week (for variety)

STEP 2: Compute meal budgets
  ├── meal_budget_splitter(daily_macros, training_today, goal)
  └── OUTPUT: { breakfast: {kcal, P, C, F},
                lunch:     {kcal, P, C, F},
                dinner:    {kcal, P, C, F},
                snack:     {kcal, P, C, F},
                dessert:   {kcal, P, C, F} }

STEP 3: For each meal (sequentially or parallel):
  │
  ├── OpenAI API Call
  │   SENDS:
  │     - role: "Sports nutritionist"
  │     - macro_target: { protein_g, carbs_g, fat_g, kcal }
  │     - meal_type: "breakfast" | "lunch" | etc.
  │     - food_preferences: { likes, dislikes, cuisines }
  │     - dietary_restrictions: ["vegetarian", ...]
  │     - training_context: "10mi long run today, rest tomorrow"
  │     - avoid_ingredients: [proteins/carbs used earlier this week]
  │     - already_generated_today: ["Oatmeal with...", "Chicken..."]
  │     - rag_context: (if available from user history)
  │   
  │   RECEIVES:
  │     {
  │       meal_name: "Grilled Salmon with Quinoa and Roasted Vegetables",
  │       ingredients: [
  │         { name: "salmon fillet", type: "protein", grams: 185 },
  │         { name: "quinoa cooked", type: "carb", grams: 210 },
  │         { name: "broccoli", type: "vegetable", grams: 150 },
  │         { name: "bell pepper", type: "vegetable", grams: 80 },
  │         { name: "olive oil", type: "fat", grams: 14 }
  │       ]
  │     }
  │
  ├── ML Density Lookup
  │   INPUT: ingredients with grams + type_macro_densities.json
  │   COMPUTE:
  │     for each ingredient:
  │       P += grams × densities[type].p_per_g
  │       C += grams × densities[type].c_per_g
  │       F += grams × densities[type].f_per_g
  │     kcal = 4×P + 4×C + 9×F
  │   OUTPUT: { protein: 46g, carbs: 52g, fat: 18g, kcal: 554 }
  │
  ├── Algebraic Scaler (if needed)
  │   IF |computed_kcal - target_kcal| > threshold (e.g., 50 kcal):
  │     - Scale protein-type grams to hit protein target
  │     - Scale carb-type grams to hit carb target
  │     - Adjust fat-type grams for remaining calories
  │     - Keep vegetable grams fixed (low caloric impact)
  │     - Recompute final macros
  │   OUTPUT: adjusted grams + final macros
  │
  └── Return meal with final macros

STEP 4: Accumulate daily totals
  └── Verify sum of all meals ≈ daily targets (log drift)

RESPONSE:
{
  meals: {
    breakfast: { name, ingredients: [{name, type, grams}], macros: {P,C,F,kcal} },
    lunch: { ... },
    dinner: { ... },
    snack: { ... },
    dessert: { ... }
  },
  daily_totals: { protein, carbs, fat, kcal },
  daily_targets: { protein, carbs, fat, kcal }
}
```

### Flow 2: generate-meals.js (Web — Full Week)

```
REQUEST: POST /api/generate-meals
Body: { user_id, week_start_date }

Same as generate-day but looped for 7 days:
  - Each day gets its own training adjustment
  - Each day's meals avoid repeating proteins from adjacent days
  - Week-level variety tracking (no same dinner 2x in a week)

For each day in week:
  ├── Get that day's training session
  ├── Compute that day's TDEE adjustment + meal budgets
  ├── Run Flow 1 (generate-day) for that day
  └── Feed generated meals into next day's "avoid" list
```

### Flow 3: generate-single-meal.js (One Meal)

```
REQUEST: POST /api/generate-single-meal
Body: { user_id, date, meal_type }

STEP 1: Load user data (same as Flow 1)

STEP 2: Compute that meal's budget
  ├── Get daily macros from user_profiles
  ├── Get already-consumed macros for today
  │   (sum macros of meals already generated/logged today)
  ├── remaining = daily_targets - already_consumed
  └── meal_budget = remaining adjusted for remaining meal slots
      (e.g., if lunch+dinner+snack remain, this meal gets
       its proportional share of remaining macros)

STEP 3: OpenAI API Call
  SENDS: (same fields as Flow 1, for this single meal)
    - macro_target: computed budget for this specific meal
    - already_eaten_today: list of today's meals + macros
    - everything else same as Flow 1

STEP 4–5: ML Density Lookup → Algebraic Scaler
  (identical to Flow 1)

RESPONSE:
{
  meal: { name, ingredients, macros },
  daily_totals_after: { P, C, F, kcal },
  daily_targets: { P, C, F, kcal },
  remaining_budget: { P, C, F, kcal }
}
```

### Flow 4: User Enters Own Meal

```
REQUEST: POST /api/log-custom-meal
Body: { user_id, date, meal_type, meal_description: "grilled chicken with rice and steamed broccoli" }

STEP 1: OpenAI Parse Call
  SENDS:
    - meal_description (user's text)
    - instruction: "Parse into structured ingredients with type and estimated grams"
    - type_options: ["protein", "carb", "vegetable", "fat"]
    - context: "Assume standard adult serving sizes"
  
  RECEIVES:
    {
      meal_name: "Grilled Chicken with Rice and Steamed Broccoli",
      ingredients: [
        { name: "chicken breast grilled", type: "protein", grams: 170 },
        { name: "white rice cooked", type: "carb", grams: 200 },
        { name: "broccoli steamed", type: "vegetable", grams: 120 }
      ]
    }

STEP 2: ML Density Lookup
  (identical to other flows)
  OUTPUT: { protein: 42g, carbs: 48g, fat: 5g, kcal: 405 }

STEP 3: NO algebraic scaler
  (user entered what they ate — we report actual macros,
   don't modify portions to fit targets)

STEP 4: Update daily consumed totals

RESPONSE:
{
  meal: { name, ingredients, macros },
  daily_totals_after: { P, C, F, kcal },
  daily_targets: { P, C, F, kcal },
  remaining_budget: { P, C, F, kcal }
}
```

### Flow 5: generate-meal-prep.js

```
REQUEST: POST /api/generate-meal-prep
Body: { user_id, meal_type, num_servings (e.g., 5 for weekday lunches) }

STEP 1: Compute average macro budget for that meal slot
  ├── Average the meal_type budget across the relevant days
  └── (training varies daily, so average smooths it)

STEP 2: OpenAI API Call
  SENDS:
    - macro_target: averaged budget per serving
    - meal_type
    - num_servings
    - instruction: "Create a meal prep recipe that scales to N servings.
                    Return per-serving ingredients with grams."
    - food_preferences, dietary_restrictions
    - variety: suggest 2–3 options

STEP 3: For each option → ML Density Lookup → Algebraic Scaler

RESPONSE:
{
  options: [
    {
      name: "Mediterranean Chicken Bowl",
      per_serving: { ingredients: [...], macros: {P,C,F,kcal} },
      total_for_prep: { ingredients: [...scaled], total_macros }
    },
    ...
  ]
}
```

---

## Implementation Checklist

### Phase 1: Foundation (Days 1–2)

- [ ] **1.1 TDEE Calculator**
  - [ ] Create `utils/tdee-calculator.js` (shared between web and mobile)
  - [ ] Implement Mifflin-St Jeor BMR formula
  - [ ] Add activity level multipliers
  - [ ] Add training-day adjustments (map training types to multipliers)
  - [ ] Add goal adjustments (cut/maintain/bulk)
  - [ ] Compute macro split (protein from body weight, fat 25%, carbs remainder)
  - [ ] Unit tests with known inputs/outputs
  - [ ] Wire into onboarding flow (compute + store on profile save)
  - [ ] Wire into profile update flow (recompute on changes)

- [ ] **1.2 Meal Budget Splitter**
  - [ ] Create `utils/meal-budget-splitter.js`
  - [ ] Define default meal percentage splits
  - [ ] Add training-timing carb shifts
  - [ ] Add goal-specific adjustments
  - [ ] Handle missing meals (redistribute budget)
  - [ ] Handle "remaining budget" calculation (for single-meal generation)
  - [ ] Unit tests

- [ ] **1.3 ML Density Endpoint**
  - [ ] Create new `/compute-macros` endpoint on ML service
  - [ ] Accepts: `[{type: "protein", grams: 170}, ...]`
  - [ ] Returns: `{protein_g, carbs_g, fat_g, kcal}`
  - [ ] Uses `type_macro_densities.json` (already exists)
  - [ ] Add validation (reject negative grams, unknown types)
  - [ ] Test with known meals

- [ ] **1.4 Algebraic Scaler**
  - [ ] Create `utils/algebraic-scaler.js` (or add to ML service)
  - [ ] Input: ingredients with grams, computed macros, target macros
  - [ ] Logic: scale protein sources → carb sources → fat sources, fix veg
  - [ ] Define drift threshold (e.g., >50 kcal or >10% off on any macro)
  - [ ] Enforce min/max portion bounds (don't scale chicken to 500g)
  - [ ] Return adjusted ingredients + final macros
  - [ ] Unit tests

### Phase 2: AI Prompt Rewrites (Days 2–3)

- [ ] **2.1 New Prompt Template**
  - [ ] Create shared prompt builder that all endpoints use
  - [ ] Include macro targets in every prompt
  - [ ] Request structured JSON output (meal_name + ingredients array)
  - [ ] Define consistent ingredient schema: `{name, type, grams}`
  - [ ] Add response format enforcement / JSON mode
  - [ ] Test prompts in playground first

- [ ] **2.2 Update generate-day.js**
  - [ ] Call TDEE calculator (or read stored values)
  - [ ] Call meal budget splitter for all 5 meals
  - [ ] Loop through meals, calling OpenAI with macro targets
  - [ ] Pass each meal through density lookup
  - [ ] Pass each meal through algebraic scaler
  - [ ] Accumulate and return daily totals
  - [ ] Handle streaming if still used (SSE)
  - [ ] Error handling: retry if OpenAI returns bad JSON

- [ ] **2.3 Update generate-meals.js (web — full week)**
  - [ ] Loop generate-day logic for 7 days
  - [ ] Per-day training adjustments
  - [ ] Cross-day variety tracking (avoid repeated proteins)
  - [ ] Return weekly summary

- [ ] **2.4 Update generate-single-meal.js**
  - [ ] Load already-consumed meals for the day
  - [ ] Compute remaining macro budget
  - [ ] Determine this meal's share of remaining budget
  - [ ] Same OpenAI → density → scaler pipeline
  - [ ] Return meal + updated daily totals + remaining budget

- [ ] **2.5 Update generate-meal-prep.js**
  - [ ] Average macro budget across target days
  - [ ] Prompt for scalable recipes (2–3 options)
  - [ ] Per-serving density lookup + scaling
  - [ ] Return per-serving and total-prep macros

- [ ] **2.6 User-Entered Meal Flow**
  - [ ] Create `/api/log-custom-meal` endpoint (or update existing)
  - [ ] OpenAI parsing prompt (meal text → structured ingredients JSON)
  - [ ] Density lookup only (no algebraic scaler — report actual macros)
  - [ ] Update daily consumed totals in database
  - [ ] Return macros + remaining daily budget

### Phase 3: Integration & Testing (Days 3–4)

- [ ] **3.1 Database Updates**
  - [ ] Add `daily_kcal, daily_protein, daily_carbs, daily_fat` to user_profiles
  - [ ] Add `computed_at` timestamp for nutrition targets
  - [ ] Ensure meal records store structured ingredients (not just name)
  - [ ] Add per-meal macro columns if not present
  - [ ] Migration script

- [ ] **3.2 Mobile App Integration**
  - [ ] Update generate-day call to use new endpoint response shape
  - [ ] Display per-meal macros from new structure
  - [ ] Display daily totals + remaining budget
  - [ ] Update "user enters meal" UI to handle new parsing flow
  - [ ] Test on TestFlight build

- [ ] **3.3 Web App Integration**
  - [ ] Update generate-meals call for new response shape
  - [ ] Display weekly macro tracking
  - [ ] Update single-meal regeneration UI

- [ ] **3.4 End-to-End Testing**
  - [ ] Test full day generation: verify daily totals ≈ TDEE targets
  - [ ] Test single meal: verify remaining budget math
  - [ ] Test user-entered meals: verify reasonable macro estimates
  - [ ] Test meal prep: verify per-serving × servings = total
  - [ ] Test edge cases: vegan user, very low calorie goal, rest day vs race day
  - [ ] Compare calorie accuracy against old ML model (should be much better)

- [ ] **3.5 Deploy**
  - [ ] Deploy ML service updates to Render
  - [ ] Deploy API updates to Vercel
  - [ ] Deploy mobile build for App Store submission
  - [ ] Smoke test production endpoints

### Phase 4: Post-Submission Refinement (Days 5–7, during App Review)

- [ ] **4.1 Improve Density Data**
  - [ ] Move from type-level to ingredient-level densities
  - [ ] Map common ingredients to their specific USDA per-100g macros
  - [ ] Fall back to type-level density for unknown ingredients
  - [ ] Re-evaluate calorie accuracy with finer densities

- [ ] **4.2 Prompt Tuning**
  - [ ] Track how often the algebraic scaler has to intervene
  - [ ] If scaler adjusts >20% frequently, refine prompts
  - [ ] A/B test prompt variations for portion accuracy
  - [ ] Add few-shot examples of well-portioned meals to prompts

- [ ] **4.3 Eval Suite**
  - [ ] Build evaluation set of 50+ real meals with known macros
  - [ ] Automate: run generate → density lookup → compare to ground truth
  - [ ] Track metrics: calorie MAE, % within ±15%, per-macro accuracy
  - [ ] Compare against old system

- [ ] **4.4 RAG Refinement**
  - [ ] Use meal ratings to improve future recommendations
  - [ ] Track which AI-generated portions get manually adjusted by users
  - [ ] Feed corrections back into prompt context

- [ ] **4.5 Explore Ingredient-Level Portion Model (Optional)**
  - [ ] If user-entered meals need better gram estimation
  - [ ] Train: (ingredient_name, meal_type) → typical_grams
  - [ ] Use USDA serving size data as ground truth
  - [ ] This replaces the LLM call for common ingredients (faster + cheaper)

---

## Key Design Decisions to Make

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Where does TDEE calc run? | Client-side vs API endpoint | Shared JS utility, runs on server at profile save, client reads stored values |
| Algebraic scaler location? | ML service (Python) vs API (JS) | JS in the API — keeps it in the same request, avoids extra network hop |
| Density lookup location? | ML service endpoint vs JS utility | Start as JS utility using the JSON file; move to ML service later if you add ingredient-level densities |
| Store meal ingredients? | Just meal name vs full structured data | Full structured data — you need it for daily tracking and the scaler |
| OpenAI JSON reliability? | Trust raw output vs enforce schema | Use JSON mode + zod/joi validation, retry once on parse failure |
| Meal budget: static or dynamic? | Fixed percentages vs user-configurable | Start with fixed defaults, add user customization in Phase 4 |
