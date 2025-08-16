import React, { useState } from 'react';
import { Calendar, Clock, Utensils, CheckCircle, Edit3, Plus, User, Save } from 'lucide-react';

const MarathonNutritionApp = () => {
  const [currentView, setCurrentView] = useState('training');
  const [user, setUser] = useState({ name: '', loggedIn: false });
  const [username, setUsername] = useState('');
  const [trainingPlan, setTrainingPlan] = useState({
    monday: { type: '', distance: '', intensity: '', notes: '' },
    tuesday: { type: '', distance: '', intensity: '', notes: '' },
    wednesday: { type: '', distance: '', intensity: '', notes: '' },
    thursday: { type: '', distance: '', intensity: '', notes: '' },
    friday: { type: '', distance: '', intensity: '', notes: '' },
    saturday: { type: '', distance: '', intensity: '', notes: '' },
    sunday: { type: '', distance: '', intensity: '', notes: '' }
  });

  const [foodPreferences, setFoodPreferences] = useState({
    likes: new Set(),
    dislikes: new Set()
  });

  const [mealPlan, setMealPlan] = useState({
    monday: { breakfast: '', lunch: '', dinner: '', snacks: '' },
    tuesday: { breakfast: '', lunch: '', dinner: '', snacks: '' },
    wednesday: { breakfast: '', lunch: '', dinner: '', snacks: '' },
    thursday: { breakfast: '', lunch: '', dinner: '', snacks: '' },
    friday: { breakfast: '', lunch: '', dinner: '', snacks: '' },
    saturday: { breakfast: '', lunch: '', dinner: '', snacks: '' },
    sunday: { breakfast: '', lunch: '', dinner: '', snacks: '' }
  });

  const foodOptions = [
    'Chicken', 'Fish', 'Eggs', 'Greek Yogurt', 'Quinoa', 'Brown Rice', 'Oats', 'Sweet Potato',
    'Banana', 'Berries', 'Spinach', 'Broccoli', 'Avocado', 'Nuts', 'Seeds', 'Beans',
    'Pasta', 'Bread', 'Cheese', 'Milk', 'Tofu', 'Salmon', 'Turkey', 'Beef'
  ];

  const workoutTypes = ['Rest', 'Easy Run', 'Speed Work', 'Long Run', 'Strength Training', 'Cross Training', 'Recovery Run'];
  const intensityLevels = ['Low', 'Moderate', 'High', 'Peak'];

  const handleLogin = () => {
    if (username.trim()) {
      setUser({ name: username.trim(), loggedIn: true });
    }
  };

  const handleTrainingPlanChange = (day, field, value) => {
    setTrainingPlan(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleFoodPreferenceToggle = (food, type) => {
    setFoodPreferences(prev => {
      const newPrefs = { ...prev };
      if (type === 'like') {
        if (prev.likes.has(food)) {
          newPrefs.likes = new Set(prev.likes);
          newPrefs.likes.delete(food);
        } else {
          newPrefs.likes = new Set(prev.likes);
          newPrefs.likes.add(food);
          newPrefs.dislikes = new Set(prev.dislikes);
          newPrefs.dislikes.delete(food);
        }
      } else {
        if (prev.dislikes.has(food)) {
          newPrefs.dislikes = new Set(prev.dislikes);
          newPrefs.dislikes.delete(food);
        } else {
          newPrefs.dislikes = new Set(prev.dislikes);
          newPrefs.dislikes.add(food);
          newPrefs.likes = new Set(prev.likes);
          newPrefs.likes.delete(food);
        }
      }
      return newPrefs;
    });
  };

  const generateMealSuggestions = () => {
    // Mock AI suggestions based on training plan
    const suggestions = {
      monday: {
        breakfast: 'Oatmeal with berries and Greek yogurt',
        lunch: 'Quinoa bowl with grilled chicken and avocado',
        dinner: 'Salmon with sweet potato and broccoli',
        snacks: 'Banana with almond butter'
      },
      tuesday: {
        breakfast: 'Scrambled eggs with spinach and toast',
        lunch: 'Turkey and avocado wrap',
        dinner: 'Pasta with lean ground turkey and vegetables',
        snacks: 'Greek yogurt with nuts'
      },
      wednesday: {
        breakfast: 'Greek yogurt parfait with granola',
        lunch: 'Chicken and vegetable stir-fry with brown rice',
        dinner: 'Grilled fish with quinoa and steamed vegetables',
        snacks: 'Apple with peanut butter'
      },
      thursday: {
        breakfast: 'Smoothie bowl with protein powder and berries',
        lunch: 'Lentil soup with whole grain bread',
        dinner: 'Lean beef with roasted vegetables and sweet potato',
        snacks: 'Trail mix with dried fruit'
      },
      friday: {
        breakfast: 'Whole grain cereal with milk and banana',
        lunch: 'Tuna salad with mixed greens',
        dinner: 'Chicken breast with brown rice and asparagus',
        snacks: 'Cottage cheese with berries'
      },
      saturday: {
        breakfast: 'Pancakes with Greek yogurt and fresh fruit',
        lunch: 'Chicken Caesar salad wrap',
        dinner: 'Pasta with marinara sauce and lean meatballs',
        snacks: 'Energy balls with oats and dates'
      },
      sunday: {
        breakfast: 'Avocado toast with poached eggs',
        lunch: 'Quinoa salad with chickpeas and vegetables',
        dinner: 'Grilled chicken with roasted sweet potatoes',
        snacks: 'Hummus with vegetable sticks'
      }
    };
    setMealPlan(suggestions);
  };

  const handleMealEdit = (day, meal, value) => {
    setMealPlan(prev => ({
      ...prev,
      [day]: { ...prev[day], [meal]: value }
    }));
  };

  if (!user.loggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <Utensils className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Marathon Nutrition Planner</h1>
            <p className="text-gray-600 mt-2">Personalized meal planning for your training</p>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your username"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-8 h-8 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">Nutrition Planner</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Welcome, {user.name}!</span>
              <button
                onClick={() => setUser({ name: '', loggedIn: false })}
                className="text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {['training', 'preferences', 'meals'].map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize transition-colors ${
                  currentView === view
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {view === 'training' && <Calendar className="w-4 h-4 inline mr-2" />}
                {view === 'preferences' && <CheckCircle className="w-4 h-4 inline mr-2" />}
                {view === 'meals' && <Utensils className="w-4 h-4 inline mr-2" />}
                {view === 'training' ? 'Training Plan' : view === 'preferences' ? 'Food Preferences' : 'Meal Plan'}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'training' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Training Schedule</h2>
              <div className="space-y-4">
                {Object.keys(trainingPlan).map((day) => (
                  <div key={day} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div className="font-medium text-gray-900 capitalize flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {day}
                    </div>
                    <div>
                      <select
                        value={trainingPlan[day].type}
                        onChange={(e) => handleTrainingPlanChange(day, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select workout</option>
                        {workoutTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Distance/Duration"
                        value={trainingPlan[day].distance}
                        onChange={(e) => handleTrainingPlanChange(day, 'distance', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <select
                        value={trainingPlan[day].intensity}
                        onChange={(e) => handleTrainingPlanChange(day, 'intensity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Intensity</option>
                        {intensityLevels.map((level) => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentView === 'preferences' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Food Preferences</h2>
              <p className="text-gray-600 mb-6">Select foods you like and dislike to personalize your meal suggestions.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {foodOptions.map((food) => (
                  <div key={food} className="border rounded-lg p-3">
                    <div className="text-center mb-2 font-medium text-gray-900">{food}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFoodPreferenceToggle(food, 'like')}
                        className={`flex-1 py-1 px-2 rounded text-xs transition-colors ${
                          foodPreferences.likes.has(food)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                        }`}
                      >
                        Like
                      </button>
                      <button
                        onClick={() => handleFoodPreferenceToggle(food, 'dislike')}
                        className={`flex-1 py-1 px-2 rounded text-xs transition-colors ${
                          foodPreferences.dislikes.has(food)
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                        }`}
                      >
                        Dislike
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentView === 'meals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Weekly Meal Plan</h2>
                <button
                  onClick={generateMealSuggestions}
                  className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Generate AI Suggestions
                </button>
              </div>
              
              <div className="space-y-6">
                {Object.keys(mealPlan).map((day) => (
                  <div key={day} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 capitalize mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {day}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {['breakfast', 'lunch', 'dinner', 'snacks'].map((meal) => (
                        <div key={meal} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 capitalize">
                            {meal}
                          </label>
                          <textarea
                            value={mealPlan[day][meal]}
                            onChange={(e) => handleMealEdit(day, meal, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows="3"
                            placeholder={`Enter ${meal}...`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MarathonNutritionApp;