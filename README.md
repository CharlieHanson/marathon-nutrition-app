# Marathon Nutrition Planner

A personalized meal planning web app designed for marathon runners and athletes. Create an account, input your weekly training schedule, and get AI-powered meal suggestions tailored to your workouts and food preferences - validated by machine learning for nutritional accuracy.

[Link to Website](https://marathon-nutrition-app.vercel.app/)

## Features

- **AI-Powered Meal Generation**: GPT-3.5 creates personalized weekly meal plans based on training schedule, dietary restrictions, and fitness goals
- **ML Validation System**: 5 specialized machine learning models (breakfast, lunch, dinner, snacks, desserts) validate macro predictions with 87% average accuracy
- **User Authentication**: Secure account creation and login with Supabase authentication
- **Training Plan Integration**: Weekly workout schedule input with exercise type, distance, and intensity
- **Smart Regeneration**: Replace any meal with custom reasoning (e.g., "prefer vegetarian option")
- **Recipe Generation**: Detailed cooking instructions with ingredients and steps for any meal
- **Auto Grocery Lists**: Organized shopping lists by category, with download capability
- **Data Persistence**: PostgreSQL database with Row-Level Security for user data protection
- **Responsive Design**: Modern UI built with Tailwind CSS, works on desktop and mobile

---

| Model | Calories | Protein | Carbs | Fat | **Average** |
|-------|----------|---------|-------|-----|-------------|
| Breakfast | 91.5% | 90.0% | 86.6% | 82.0% | 87.5% |
| Lunch | 91.4% | 89.4% | 85.5% | 86.3% | 88.2% |
| Dinner | 93.1% | 88.9% | 88.2% | 87.3% | 89.4% |
| Snacks | 76.4% | 89.7% | 74.5% | 87.9% | 82.1% |
| Desserts | 89.2% | 98.4% | 85.7% | 85.7% | 89.8% |
| **Overall** | **88.3%** | **91.3%** | **84.1%** | **85.8%** | **87.4%** |

*Accuracy = % of predictions within acceptable thresholds (±75 cal, ±3g protein, ±10g carbs, ±4g fat)*

---

## Tech Stack

**Frontend**
- React 18 with Hooks
- Next.js 14 for server-side rendering
- Tailwind CSS for styling
- Vercel serverless functions

**Backend**
- Node.js serverless API (Vercel)
- Flask API for ML predictions (Railway)
- Supabase (PostgreSQL + Authentication)

**AI & Machine Learning**
- OpenAI GPT-3.5 API for meal generation
- Python with scikit-learn (RandomForest, GradientBoosting)
- TF-IDF vectorization for feature extraction
- pandas, NumPy, joblib for data processing

**DevOps**
- GitHub Actions CI/CD pipeline
- Automated testing (pytest, vitest)
- Railway deployment for ML API
- Vercel deployment for frontend

---

## Architecture
```
┌─────────────────────────────────────────────────────────┐
│              React Frontend (Next.js 14)                │
│       Components | Hooks | Pages | Context              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌────────────────────────────────────────────────────────┐
│          Vercel Serverless Functions (Node.js)         │
│  • generate-meal-plan.js  • regenerate-meal.js         │
│  • get-recipe.js          • generate-grocery-list.js   │
└───────┬─────────────────────────────┬──────────────────┘
        │                             │
        ↓                             ↓
┌──────────────────┐       ┌──────────────────────────────┐
│  OpenAI API      │       │  ML Validation API (Flask)   │
│  GPT-3.5 Turbo   │       │  Railway Deployment          │
│  (Descriptions)  │       │  5 Specialized Models        │
└──────────────────┘       └──────────────────────────────┘
        │
        ↓
┌──────────────────────────────────────────────────────┐
│          Supabase (PostgreSQL + Auth)                │
│  • user_profiles    • food_preferences               │
│  • training_plans   • meal_plans                     │
│  Row-Level Security policies                         │
└──────────────────────────────────────────────────────┘
```

---

## Machine Learning Pipeline

### Training Process
1. **Data Collection**: 371 real foods from USDA FoodData Central API
2. **Synthetic Generation**: 5,000+ realistic meal combinations (1,000 per meal type)
3. **Feature Engineering**: TF-IDF vectorization of meal descriptions (200 features)
4. **Model Training**: Ensemble methods (RandomForest + GradientBoosting)
5. **Validation**: 80/20 train-test split with cross-validation
6. **Deployment**: Flask REST API on Railway

### Why 5 Separate Models?
Different meal types have distinct patterns:
- **Breakfast**: Typically 300-700 cal, higher carbs (oats, fruit)
- **Lunch**: 350-750 cal, balanced macros (sandwiches, salads)
- **Dinner**: 450-900 cal, higher protein (larger portions)
- **Snacks**: 100-400 cal, variable composition
- **Desserts**: 100-600 cal, higher carbs and fats

Specialized models achieve **40% error reduction** vs. ChatGPT's predictions.

---

## File Structure
```
marathon-nutrition-app/
├── .github/workflows/
│   └── ci-cd.yml                 # GitHub Actions CI/CD pipeline
├── api/                          # Serverless API functions (Node.js)
│   ├── generate-grocery-list.js  # AI-generated shopping lists
│   ├── generate-meals.js         # Main meal plan generation endpoint
│   ├── get-recipe.js             # Recipe generation for specific meals
│   └── regenerate-meal.js        # Individual meal regeneration
├── ml-service/                   # Python ML service
│   ├── archive/                  # Previous single model
│   ├── breakfast/                # Breakfast-specific models
│   ├── lunch/                    # Lunch-specific models
│   ├── dinner/                   # Dinner-specific models
│   ├── snacks/                   # Snacks-specific models
│   ├── desserts/                 # Desserts-specific models
│   ├── tests/                    # Pytest test suite
│   ├── app.py                    # Flask API
│   ├── requirements.txt          # Python dependencies
│   └── Procfile                  # Railway deployment
├── public/                       # Static assets
│   ├── favicon.ico               # App icon
│   ├── alimenta_logo.png         # Website logo
│   ├── index.html                # HTML template
│   ├── manifest.json             # PWA manifest
│   └── robots.txt                # SEO robots file
├── src/                          # React source code
│   ├── components/               # Reusable React components
│   ├── context/                  # React Context providers
│   ├── hooks/                    # Custom React hooks
│   ├── services/                 # Services needed
│   ├── App.css                   # Component styles
│   ├── App.js                    # Main application component
│   ├── App.test.js               # Test file
│   ├── index.css                 # Tailwind CSS imports
│   ├── index.js                  # React app entry point
│   ├── reportWebVitals.js        # Performance monitoring
│   ├── setupTests.js             # Test configuration
│   └── supabaseClient.js         # Supabase client configuration
├── tests/                        # Frontend tests (vitest)
├── .env.local                    # Environment variables (not committed)
├── .gitignore                    # Git ignore rules
├── package-lock.json             # Dependency lock file
├── package.json                  # Dependencies and scripts
├── postcss.config.js             # PostCSS configuration for Tailwind
├── README.md                     # Project documentation
└── tailwind.config.js            # Tailwind CSS configuration
```

---

## Database Schema

### Supabase Tables

**profiles**
- `id` (uuid, primary key)
- `email` (text)
- `created_at` (timestamp)

**user_profiles**
- `user_id` (uuid, foreign key)
- `height`, `weight` (text)
- `goal`, `activity_level` (text)
- `dietary_restrictions` (text)

**food_preferences**
- `user_id` (uuid, foreign key)
- `likes`, `dislikes` (text)

**training_plans**
- `user_id` (uuid, foreign key)
- `plan` (jsonb) - weekly workout schedule

**meal_plans**
- `user_id` (uuid, foreign key)
- `meals` (jsonb) - weekly meal plan

All tables use Row-Level Security (RLS) policies.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/CharlieHanson/marathon-nutrition-app.git
cd marathon-nutrition-app
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
```

4. **Start development server**
```bash
npm run dev
```

### ML Service (Optional - for local development)
```bash
cd ml-service
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py  # Runs on http://localhost:5000
```

---

## Testing

### Run all tests
```bash
# Frontend tests
npm test

# ML API tests
cd ml-service
python -m pytest tests/ -v
```

### CI/CD Pipeline
Every push to `main` triggers:
- ✅ Python ML model tests (15 tests)
- ✅ Frontend tests (8 tests)
- ✅ Model file validation
- ✅ Auto-deployment to Vercel & Railway

---

## Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import repo in Vercel
3. Add environment variables
4. Auto-deploys on push to `main`

### ML API (Railway)
1. Connect GitHub repo
2. Set root directory to `ml-service`
3. Add `requirements.txt` detected automatically
4. Auto-deploys via `Procfile`

---

## Roadmap

**Current Status**: Private beta with athletes ✅

### Near-term (Q1 2026)
- **B2B Pivot**: Transform into nutritionist management platform
  - Multi-client dashboards for nutritionists
  - Invitation-based client onboarding
  - Custom AI personalities per nutritionist
  - Bulk meal plan generation
- **Monetization**: Subscription tiers and payment processing

### Long-term (2026+)
- Mobile app (React Native)
- Fitness tracker integrations (Strava, Apple Health)
- Advanced analytics and reporting
- API access for third-party tools

**Strategic Direction**: Evolving from B2C athlete tool → B2B platform for nutritionists to manage clients at scale, combining professional expertise with AI automation.

---

## Contributing

This is a personal project built for marathon training nutrition planning. Feel free to fork and adapt for your own needs!

---

## Author

**Charlie Hanson** - Lehigh University Computer Science
- [LinkedIn](https://linkedin.com/in/charliehanson27)
- [GitHub](https://github.com/CharlieHanson)