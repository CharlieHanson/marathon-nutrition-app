# Marathon Nutrition Planner

A personalized meal planning web app designed for marathon runners and athletes. Create an account, input your weekly training schedule, and get AI-powered meal suggestions tailored to your workouts and food preferences - validated by machine learning for nutritional accuracy.

[Link to Website](https://marathon-nutrition-app.vercel.app/)

## Features

- **User Authentication**: Secure account creation and login with email verification via Supabase
- **Training Plan Input**: Set up your weekly workout schedule with exercise type, distance/duration, and intensity
- **User Profile Management**: Store your height, weight, fitness goals, activity level, and dietary restrictions
- **Food Preferences**: Save foods you like and dislike to personalize recommendations
- **AI Meal Planning**: Generate personalized weekly meal plans (breakfast, lunch, dinner, snacks, and desserts) based on your training and preferences
- **ML Validation**: Custom-trained machine learning models verify nutritional accuracy, achieving 89% protein and 84% calorie prediction accuracy
- **Meal Regeneration**: Regenerate any individual meal with custom reasoning (e.g., "prefer vegetarian option")
- **Recipe Generation**: Get detailed recipes with ingredients and step-by-step instructions for any meal
- **Grocery List**: Auto-generate an organized shopping list categorized by food type from your weekly meal plan
- **Data Persistence**: All your profile data, preferences, and plans are saved to your account
- **Clean UI**: Modern, responsive design that works on desktop and mobile

## Tech Stack

- **Frontend**: React 18 with Hooks
- **Backend**: Node.js serverless functions on Vercel
- **Database & Auth**: Supabase (PostgreSQL + Authentication)
- **AI Integration**: OpenAI GPT-3.5 API for meal generation
- **ML Validation**: Python, scikit-learn, Flask (deployed on Railway)
- **ML Libraries**: pandas, NumPy, joblib, TF-IDF vectorization
- **Styling**: Tailwind CSS for modern, responsive design
- **Icons**: Lucide React for clean iconography
- **Deployment**: Vercel (frontend/APIs), Railway (ML service)

## Architecture
```
React Frontend (Vercel)
    ↓
Vercel Serverless API Functions (Node.js)
    ↓
OpenAI GPT-3.5 API ← Meal Generation
    ↓
Python ML Service (Railway) ← Macro Validation
    ↓
Supabase (PostgreSQL + Auth) ← Data Persistence
```

## Machine Learning Component

The app includes a custom ML validation system that fact-checks AI-generated nutritional data:

- **Training Data**: 1,000 synthetic meal combinations derived from 552 real foods in the USDA nutrition database
- **Models**: Ensemble methods (RandomForest & GradientBoosting) trained separately for each macro
- **Accuracy**: 89% protein, 84% calories, 84% carbs, 70% fat
- **Feature Extraction**: TF-IDF vectorization of meal descriptions
- **Deployment**: Flask API on Railway for independent scaling

### ML Pipeline
1. Collect real nutrition data from USDA FoodData Central API
2. Generate synthetic meal combinations with realistic serving sizes
3. Train regression models to predict macros from meal descriptions
4. Deploy models as REST API endpoint for real-time validation

## File Structure
```
marathon-nutrition-app/
├── api/                          # Serverless API functions (Node.js)
│   ├── generate-grocery-list.js  # AI-generated shopping lists
│   ├── generate-meals.js         # Main meal plan generation endpoint
│   ├── get-recipe.js             # Recipe generation for specific meals
│   └── regenerate-meal.js        # Individual meal regeneration
├── ml-service/                   # Machine learning validation service
│   ├── data/                     # Training datasets
│   │   ├── nutrition_data.csv    # USDA food data (552 foods)
│   │   └── training_data.csv     # Synthetic meals (1,000 examples)
│   ├── models/                   # Trained ML models (.joblib files)
│   │   ├── calories_model.joblib
│   │   ├── protein_model.joblib
│   │   ├── carbs_model.joblib
│   │   ├── fat_model.joblib
│   │   └── vectorizer.joblib     # TF-IDF vectorizer
│   ├── venv/                     # Python virtual environment
│   ├── app.py                    # Flask API for macro prediction
│   ├── collect_data.py           # USDA data collection script
│   ├── generate_meals.py         # Synthetic meal generation
│   ├── train_model.py            # Model training pipeline
│   ├── Procfile                  # Railway deployment config
│   ├── railway.json              # Railway service configuration
│   └── requirements.txt          # Python dependencies
├── public/                       # Static assets
│   ├── favicon.ico               # App icon
│   ├── index.html                # HTML template
│   ├── logo192.png               # App logo (192px)
│   ├── logo512.png               # App logo (512px)
│   ├── manifest.json             # PWA manifest
│   └── robots.txt                # SEO robots file
├── src/                          # React source code
│   ├── components/               # Reusable React components
│   │   └── Auth.js               # Login/signup component
│   ├── context/                  # React Context providers
│   │   └── AuthContext.js        # Authentication state management
│   ├── App.css                   # Component styles
│   ├── App.js                    # Main application component
│   ├── App.test.js               # Test file
│   ├── index.css                 # Tailwind CSS imports
│   ├── index.js                  # React app entry point
│   ├── logo.svg                  # React logo
│   ├── reportWebVitals.js        # Performance monitoring
│   ├── setupTests.js             # Test configuration
│   └── supabaseClient.js         # Supabase client configuration
├── .env.local                    # Environment variables (not committed)
├── .gitignore                    # Git ignore rules
├── package-lock.json             # Dependency lock file
├── package.json                  # Dependencies and scripts
├── postcss.config.js             # PostCSS configuration for Tailwind
├── README.md                     # Project documentation
└── tailwind.config.js            # Tailwind CSS configuration
```

## Database Schema

### Tables
- **profiles**: Basic user profile (name, created_at)
- **user_profiles**: Detailed health/fitness data (height, weight, goal, activity_level, dietary_restrictions)
- **food_preferences**: User's liked and disliked foods
- **training_plans**: Weekly workout schedules (stored as JSONB)
- **meal_plans**: AI-generated weekly meal plans (stored as JSONB)

All tables use Row-Level Security (RLS) policies to ensure users can only access their own data.

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm
- Python 3.8+ (for ML service)
- Supabase account
- OpenAI API key
- USDA FoodData Central API key (free)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/CharlieHanson/marathon-nutrition-app.git
cd marathon-nutrition-app
```

2. Install frontend dependencies:
```bash
npm install
```

3. Set up ML service (optional - only needed for local development):
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. Create a `.env.local` file in the root directory:
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
USDA_API_KEY=your_usda_api_key
```

5. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema to create tables (see Database Schema section)
   - Configure URL redirects in Supabase Authentication settings

6. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

### Training ML Models Locally (Optional)
```bash
cd ml-service
source venv/bin/activate

# Collect nutrition data
python collect_data.py

# Generate training data
python generate_meals.py

# Train models
python train_model.py

# Start ML API locally
python app.py  # Runs on http://localhost:5000
```

## Deployment

### Frontend & Node.js APIs (Vercel)
1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel project settings
4. Deploy

Vercel automatically handles the serverless API routes in the `/api` folder.

### ML Service (Railway)
1. Push your code to GitHub
2. Create new project in Railway
3. Set root directory to `/ml-service`
4. Add `USDA_API_KEY` environment variable
5. Railway auto-detects Python and deploys

## 🚀 Roadmap

- **Current Status**: Private Beta Testing
- **Q1 2025**: Soft launch with initial user cohort
- **Q2 2025**: Public launch with paid marketing campaign
- **Future Features**: 
  - Improved ML accuracy with larger datasets
  - Mobile app (React Native)
  - Integration with fitness trackers (Apple Health, Fitbit, Strava)
  - Social features (share meal plans, community recipes)
  - Meal prep optimization (batch cooking suggestions)

## Key Differentiators

Unlike calorie-tracking apps like MyFitnessPal, this app:
- **Plans ahead** instead of tracking after the fact
- **Adapts to training** - higher carbs before long runs, more protein after strength training
- **Validates AI output** - custom ML models ensure nutritional accuracy
- **Generates grocery lists** - streamlines meal prep workflow
- **Targets athletes** - designed specifically for endurance training nutrition needs

## Contributing

This is a personal project built for marathon training nutrition planning. Feel free to fork and adapt for your own needs!