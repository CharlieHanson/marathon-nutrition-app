# Marathon Nutrition Planner

A personalized meal planning web app designed for marathon runners and athletes. Input your weekly training schedule and get AI-powered meal suggestions tailored to your workouts and food preferences.

[Link to Website](https://marathon-nutrition-app.vercel.app/)

## Features

- **Training Plan Input**: Set up your weekly workout schedule with exercise type, distance/duration, and intensity
- **User Profile Info**: Include your height, weight, allergies, goals, dietary restrictions, etc.
- **Food Preferences**: Enter foods you like and dislike to personalize recommendations
- **Meal Planning**: Generate AI-suggested meals for each day based on your training and preferences
- **Editable Plans**: Regenerate any meal with custom reasoning
- **Grocery List**: Create an organized shopping list based on all your weekly meals
- **Get Recipe**: Get a detailed recipe with ingredients and instructions for any meal
- **Clean UI**: Modern, responsive design that works on desktop and mobile

## Tech Stack

- **Frontend**: React 18 with Hooks
- **Styling**: Tailwind CSS for modern, responsive design
- **Icons**: Lucide React for clean iconography
- **State Management**: React useState for local data storage
- **Deployment**: Vercel (static hosting)

## File Structure

```
nutrition-training-coach/
├── api/
│   ├── generate-grocery-list.js   # AI-generated shopping lists
│   ├── generate-meals.js          # Main meal plan generation endpoint
│   ├── get-recipe.js              # Recipe generation for specific meals
│   └── regenerate-meal.js         # Individual meal regeneration
├── public/
│   ├── favicon.ico               # App icon
│   ├── index.html               # HTML template
│   ├── logo192.png              # App logo (192px)
│   ├── logo512.png              # App logo (512px)
│   ├── manifest.json            # PWA manifest
│   └── robots.txt               # SEO robots file
├── src/
│   ├── App.css                  # (unused, can be deleted)
│   ├── App.js                   # Main application component
│   ├── App.test.js              # Test file
│   ├── index.css                # Tailwind CSS imports
│   ├── index.js                 # React app entry point
│   ├── logo.svg                 # React logo
│   ├── reportWebVitals.js       # Performance monitoring
│   └── setupTests.js            # Test configuration
├── .env.local                   # Environment variables (OpenAI API key)
├── .gitignore                   # Git ignore rules
├── package-lock.json            # Dependency lock file
├── package.json                 # Dependencies and scripts
├── postcss.config.js            # PostCSS configuration for Tailwind
├── README.md                    # Project documentation
└── tailwind.config.js           # Tailwind CSS configuration
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/marathon-nutrition-app.git
cd marathon-nutrition-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000` 

## Contributing

This is a personal project built for marathon training nutrition planning. Feel free to fork and adapt for your own needs!

---