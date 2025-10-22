# Marathon Nutrition Planner

A personalized meal planning web app designed for marathon runners and athletes. Create an account, input your weekly training schedule, and get AI-powered meal suggestions tailored to your workouts and food preferences.

[Link to Website](https://marathon-nutrition-app.vercel.app/)

## Features

- **User Authentication**: Secure account creation and login with email verification via Supabase
- **Training Plan Input**: Set up your weekly workout schedule with exercise type, distance/duration, and intensity
- **User Profile Management**: Store your height, weight, fitness goals, activity level, and dietary restrictions
- **Food Preferences**: Save foods you like and dislike to personalize recommendations
- **AI Meal Planning**: Generate personalized weekly meal plans (breakfast, lunch, dinner, snacks, and desserts) based on your training and preferences
- **Meal Regeneration**: Regenerate any individual meal with custom reasoning (e.g., "prefer vegetarian option, want a cheat meal, etc.")
- **Recipe Generation**: Get detailed recipes with ingredients and step-by-step instructions for any meal
- **Grocery List**: Auto-generate an organized shopping list categorized by food type from your weekly meal plan
- **Data Persistence**: All your profile data, preferences, and plans are saved to your account
- **Clean UI**: Modern, responsive design that works on desktop and mobile

## Tech Stack

- **Frontend**: React 18 with Hooks
- **Backend**: Node.js serverless functions on Vercel
- **Database & Auth**: Supabase (PostgreSQL + Authentication)
- **AI Integration**: OpenAI GPT-3.5 API for meal generation
- **Styling**: Tailwind CSS for modern, responsive design
- **Icons**: Lucide React for clean iconography
- **Deployment**: Vercel (serverless hosting)

## Architecture
```
React Frontend (Vercel)
    ↓
Vercel Serverless API Functions (Node.js)
    ↓
OpenAI GPT-3.5 API ← Meal Generation
    ↓
Supabase (PostgreSQL + Auth) ← Data Persistence
```

## File Structure
```
marathon-nutrition-app/
├── api/                          # Serverless API functions (Node.js)
│   ├── generate-grocery-list.js  # AI-generated shopping lists
│   ├── generate-meals.js         # Main meal plan generation endpoint
│   ├── get-recipe.js             # Recipe generation for specific meals
│   └── regenerate-meal.js        # Individual meal regeneration
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
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/CharlieHanson/marathon-nutrition-app.git
cd marathon-nutrition-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema from the project documentation to create tables
   - Configure URL redirects in Supabase Authentication settings

5. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Deployment

The app is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel project settings
4. Deploy

Vercel automatically handles the serverless API routes in the `/api` folder.

## Roadmap

- **Current Status**: Private Beta Testing
- **Q1 2025**: Soft launch with initial user cohort
- **Q2 2025**: Public launch with paid marketing campaign
- **Future Features**: 
  - ML-based macro validation using Python
  - Mobile app
  - Integration with fitness trackers (Apple Health, Fitbit)

## Contributing

This is a personal project built for marathon training nutrition planning. Feel free to fork and adapt for your own needs!