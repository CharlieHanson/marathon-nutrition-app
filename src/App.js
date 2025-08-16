import React, { useState } from 'react';
import { Calendar, Clock, Utensils, CheckCircle, Edit3, Plus, User, Save } from 'lucide-react';
import OpenAI from 'openai';

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

  const [userProfile, setUserProfile] = useState({
    height: '',
    weight: '',
    goal: '', // 'lose', 'maintain', 'gain'
    activityLevel: '', // 'low', 'moderate', 'high'
    dietaryRestrictions: ''
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

  const [aiTestResult, setAiTestResult] = useState('');
  const [isTestingAI, setIsTestingAI] = useState(false);

  // Initialize OpenAI
  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
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

  const testAI = async () => {
    setIsTestingAI(true);
    setAiTestResult('Testing AI connection...');
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: "Reply with exactly: 'AI connection working!'"
          }
        ],
        max_tokens: 10
      });
      
      setAiTestResult(response.choices[0].message.content);
    } catch (error) {
      setAiTestResult(`Error: ${error.message}`);
    } finally {
      setIsTestingAI(false);
    }
  };

  const generateMealSuggestions = async () => {
    // Check if API key exists (only works locally)
    if (!process.env.REACT_APP_OPENAI_API_KEY) {
      setAiTestResult('⚠️ AI features only work in development. Using mock data for live site.');
      
      // Use the old mock data for the live site
      const mockSuggestions = {
        monday: {
          breakfast: 'Oatmeal with berries and Greek yogurt (Cal: 350, P: 15g, C: 45g, F: 8g)',
          lunch: 'Quinoa bowl with grilled chicken (Cal: 450, P: 30g, C: 40g, F: 12g)',
          dinner: 'Salmon with sweet potato (Cal: 500, P: 35g, C: 35g, F: 18g)',
          snacks: 'Banana with almond butter (Cal: 200, P: 6g, C: 25g, F: 9g)'
        },
        // Add other days...
      };
      setMealPlan(mockSuggestions);
      return;
    }
    
    setIsTestingAI(true);
    setAiTestResult('Generating personalized meal plan...');
    
    try {
      // Build the prompt with all user data
      const likedFoods = Array.from(foodPreferences.likes).join(', ');
      const dislikedFoods = Array.from(foodPreferences.dislikes).join(', ');
      
      // Get training schedule summary
      const trainingSchedule = Object.entries(trainingPlan)
        .map(([day, workout]) => `${day}: ${workout.type} ${workout.distance} (${workout.intensity} intensity)`)
        .filter(item => !item.includes('undefined') && !item.includes(' (intensity)'))
        .join('\n');
      
      const prompt = `You are a sports nutritionist creating a weekly meal plan for a marathon runner.

  USER PROFILE:
  - Height: ${userProfile.height || 'Not specified'}
  - Weight: ${userProfile.weight || 'Not specified'}  
  - Goal: ${userProfile.goal || 'maintain weight'}
  - Activity Level: ${userProfile.activityLevel || 'moderate'}
  - Dietary Restrictions: ${userProfile.dietaryRestrictions || 'None'}

  FOOD PREFERENCES:
  - Likes: ${likedFoods || 'No preferences specified'}
  - Dislikes: ${dislikedFoods || 'No dislikes specified'}

  TRAINING SCHEDULE:
  ${trainingSchedule || 'No training plan specified'}

  Create a weekly meal plan with breakfast, lunch, dinner, and snacks for each day. 

  CRITICAL REQUIREMENTS:
  - NEVER include these disliked foods: ${dislikedFoods || 'None'}
  - PRIORITIZE these liked foods: ${likedFoods || 'None'}
  - If no dislikes are specified, use variety
  - Tailor nutrition to support each day's training  
  - Support their weight goal (${userProfile.goal || 'maintain'})
  - Include estimated macros for each meal: (Calories, Protein, Carbs, Fat)

  FORBIDDEN INGREDIENTS: ${dislikedFoods || 'None'} - Do not include these in ANY meal.

  Format each meal like this:
  "Meal name - Brief description (Cal: XXX, P: XXg, C: XXg, F: XXg)"

  Respond with ONLY a JSON object in this exact format:
  {
    "monday": {
      "breakfast": "meal with macros",
      "lunch": "meal with macros", 
      "dinner": "meal with macros",
      "snacks": "snack with macros"
    },
    "tuesday": { ... },
    ... (all 7 days)
  }`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.7
      });
      
      const aiResponse = response.choices[0].message.content;
      const mealData = JSON.parse(aiResponse);
      
      setMealPlan(mealData);
      setAiTestResult('✅ Personalized meal plan generated successfully!');
      
    } catch (error) {
      console.error('AI Error:', error);
      setAiTestResult(`❌ Error generating meals: ${error.message}`);
      
      // Fallback to mock data if AI fails
      const fallbackMeals = {
        monday: {
          breakfast: 'Oatmeal with berries and Greek yogurt (Cal: 350, P: 15g, C: 45g, F: 8g)',
          lunch: 'Quinoa bowl with grilled chicken (Cal: 450, P: 30g, C: 40g, F: 12g)',
          dinner: 'Salmon with sweet potato (Cal: 500, P: 35g, C: 35g, F: 18g)',
          snacks: 'Banana with almond butter (Cal: 200, P: 6g, C: 25g, F: 9g)'
        }
        // Add other days as needed...
      };
      setMealPlan(fallbackMeals);
    } finally {
      setIsTestingAI(false);
    }
  };
  const handleMealEdit = (day, meal, value) => {
    setMealPlan(prev => ({
      ...prev,
      [day]: { ...prev[day], [meal]: value }
    }));
  };

  const handleProfileChange = (field, value) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
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
            {['training', 'profile', 'preferences', 'meals'].map((view) => (
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
                {view === 'profile' && <User className="w-4 h-4 inline mr-2" />}
                {view === 'preferences' && <CheckCircle className="w-4 h-4 inline mr-2" />}
                {view === 'meals' && <Utensils className="w-4 h-4 inline mr-2" />}
                {view === 'training' ? 'Training Plan' : view === 'profile' ? 'Profile' : view === 'preferences' ? 'Food Preferences' : 'Meal Plan'}
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

        {currentView === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Profile</h2>
              <p className="text-gray-600 mb-6">Tell us about yourself so we can personalize your nutrition plan.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 5'8&quot; or 173cm"
                    value={userProfile.height}
                    onChange={(e) => handleProfileChange('height', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 150 lbs or 68 kg"
                    value={userProfile.weight}
                    onChange={(e) => handleProfileChange('weight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight Goal
                  </label>
                  <select
                    value={userProfile.goal}
                    onChange={(e) => handleProfileChange('goal', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select goal</option>
                    <option value="lose">Lose weight</option>
                    <option value="maintain">Maintain weight</option>
                    <option value="gain">Gain weight</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Level (outside training)
                  </label>
                  <select
                    value={userProfile.activityLevel}
                    onChange={(e) => handleProfileChange('activityLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select level</option>
                    <option value="low">Low (desk job, minimal activity)</option>
                    <option value="moderate">Moderate (some walking, active lifestyle)</option>
                    <option value="high">High (active job, lots of movement)</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dietary Restrictions (optional)
                  </label>
                  <textarea
                    placeholder="e.g., vegetarian, gluten-free, nut allergies, etc."
                    value={userProfile.dietaryRestrictions}
                    onChange={(e) => handleProfileChange('dietaryRestrictions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="3"
                  />
                </div>
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
                <div className="space-x-2">
                  <button
                    onClick={generateMealSuggestions}
                    className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Generate AI Suggestions
                  </button>
                </div>
              </div>
              
              {aiTestResult && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  {aiTestResult}
                </div>
              )}
              
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