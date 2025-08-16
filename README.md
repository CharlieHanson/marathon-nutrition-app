# Marathon Nutrition Planner

A personalized meal planning web app designed for marathon runners and athletes. Input your weekly training schedule and get AI-powered meal suggestions tailored to your workouts and food preferences.

## Features

- **Training Plan Input**: Set up your weekly workout schedule with exercise type, distance/duration, and intensity
- **Food Preferences**: Mark foods you like and dislike to personalize recommendations
- **Meal Planning**: Generate AI-suggested meals for each day based on your training and preferences
- **Editable Plans**: Modify any suggested meals to fit your needs
- **Clean UI**: Modern, responsive design that works on desktop and mobile

## Tech Stack

- **Frontend**: React 18 with Hooks
- **Styling**: Tailwind CSS for modern, responsive design
- **Icons**: Lucide React for clean iconography
- **State Management**: React useState for local data storage
- **Deployment**: Vercel (static hosting)

## File Structure

```
src/
├── App.js          # Main application component with all functionality
├── index.js        # React app entry point
├── index.css       # Tailwind CSS imports
└── App.css         # (unused, can be deleted)

public/
├── index.html      # HTML template
└── favicon.ico     # App icon

Config files:
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration for Tailwind
└── README.md             # This file
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

## Current Status

- ✅ Complete UI/UX with training plan input
- ✅ Food preference selection system
- ✅ Mock meal suggestions (hardcoded)
- ✅ Fully editable meal plans
- ✅ Responsive design
- 🔄 **Next**: AI API integration for real meal suggestions
- 🔄 **Next**: Macro calculations (calories, protein, fat)
- 🔄 **Next**: Training-specific meal explanations
- 🔄 **Next**: User profile (height, weight, goals)

## Usage

1. **Login**: Enter any username to get started
2. **Training Plan**: Fill out your weekly workout schedule
3. **Food Preferences**: Mark foods you like/dislike
4. **Meal Plan**: Click "Generate AI Suggestions" to populate meals
5. **Edit**: Modify any meals as needed

## Contributing

This is a personal project built for marathon training nutrition planning. Feel free to fork and adapt for your own needs!

## Future Enhancements

- Real AI integration (OpenAI/Claude API)
- Macro nutrient tracking and goals
- Training-day specific nutrition explanations
- User profiles with body metrics and goals
- Meal prep shopping lists
- Integration with fitness tracking apps

---