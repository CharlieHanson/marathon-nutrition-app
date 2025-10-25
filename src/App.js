// src/App.js
import React, { useEffect, useState } from 'react';
import { Calendar, Utensils, CheckCircle, Plus, User, RotateCcw } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import {
  fetchPersonalInfo,
  saveUserProfile,
  saveFoodPreferences,
} from './dataClient';

const MarathonNutritionApp = () => {
  const { user, signOut, loading, isGuest, disableGuestMode } = useAuth();

  const [currentView, setCurrentView] = useState('training');
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState('');
  const [recipeTitle, setRecipeTitle] = useState('');

  const [trainingPlan, setTrainingPlan] = useState({
    monday: { type: '', distance: '', intensity: '', notes: '' },
    tuesday: { type: '', distance: '', intensity: '', notes: '' },
    wednesday: { type: '', distance: '', intensity: '', notes: '' },
    thursday: { type: '', distance: '', intensity: '', notes: '' },
    friday: { type: '', distance: '', intensity: '', notes: '' },
    saturday: { type: '', distance: '', intensity: '', notes: '' },
    sunday: { type: '', distance: '', intensity: '', notes: '' },
  });

  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [groceryList, setGroceryList] = useState([]);

  const mockSuggestions = {
    monday: {
      breakfast: 'Oatmeal with berries and Greek yogurt (Cal: 350, P: 15g, C: 45g, F: 8g)',
      lunch: 'Quinoa bowl with grilled chicken and avocado (Cal: 450, P: 30g, C: 40g, F: 12g)',
      dinner: 'Salmon with sweet potato and broccoli (Cal: 500, P: 35g, C: 35g, F: 18g)',
      snacks: 'Banana with almond butter (Cal: 200, P: 6g, C: 25g, F: 9g)',
    },
    tuesday: {
      breakfast: 'Scrambled eggs with spinach and whole grain toast (Cal: 320, P: 18g, C: 25g, F: 14g)',
      lunch: 'Turkey and avocado wrap with mixed greens (Cal: 420, P: 25g, C: 35g, F: 16g)',
      dinner: 'Pasta with lean ground turkey and vegetables (Cal: 550, P: 32g, C: 58g, F: 15g)',
      snacks: 'Greek yogurt with mixed nuts (Cal: 180, P: 12g, C: 15g, F: 8g)',
    },
    wednesday: {
      breakfast: 'Greek yogurt parfait with granola and berries (Cal: 340, P: 16g, C: 42g, F: 10g)',
      lunch: 'Chicken and vegetable stir-fry with brown rice (Cal: 460, P: 28g, C: 45g, F: 14g)',
      dinner: 'Grilled fish with quinoa and steamed vegetables (Cal: 480, P: 33g, C: 38g, F: 16g)',
      snacks: 'Apple slices with peanut butter (Cal: 190, P: 7g, C: 20g, F: 9g)',
    },
    thursday: {
      breakfast: 'Smoothie bowl with protein powder, banana, and berries (Cal: 380, P: 22g, C: 48g, F: 8g)',
      lunch: 'Lentil soup with whole grain bread and side salad (Cal: 430, P: 18g, C: 58g, F: 12g)',
      dinner: 'Lean beef with roasted vegetables and sweet potato (Cal: 520, P: 36g, C: 34g, F: 20g)',
      snacks: 'Trail mix with dried fruit and nuts (Cal: 210, P: 8g, C: 18g, F: 12g)',
    },
    friday: {
      breakfast: 'Whole grain cereal with milk and sliced banana (Cal: 310, P: 12g, C: 52g, F: 6g)',
      lunch: 'Tuna salad with mixed greens and chickpeas (Cal: 440, P: 26g, C: 32g, F: 18g)',
      dinner: 'Chicken breast with brown rice and asparagus (Cal: 490, P: 34g, C: 42g, F: 14g)',
      snacks: 'Cottage cheese with fresh berries (Cal: 160, P: 14g, C: 18g, F: 4g)',
    },
    saturday: {
      breakfast: 'Whole grain pancakes with Greek yogurt and fresh fruit (Cal: 420, P: 18g, C: 58g, F: 12g)',
      lunch: 'Chicken Caesar salad wrap with whole wheat tortilla (Cal: 480, P: 28g, C: 38g, F: 20g)',
      dinner: 'Pasta with marinara sauce and lean turkey meatballs (Cal: 580, P: 30g, C: 65g, F: 18g)',
      snacks: 'Energy balls made with oats, dates, and nuts (Cal: 220, P: 6g, C: 28g, F: 10g)',
    },
    sunday: {
      breakfast: 'Avocado toast with poached eggs and tomatoes (Cal: 390, P: 16g, C: 32g, F: 22g)',
      lunch: 'Quinoa salad with chickpeas, vegetables, and feta (Cal: 450, P: 20g, C: 48g, F: 16g)',
      dinner: 'Grilled chicken with roasted sweet potatoes and green beans (Cal: 510, P: 35g, C: 40g, F: 16g)',
      snacks: 'Hummus with carrot and cucumber sticks (Cal: 140, P: 6g, C: 16g, F: 6g)',
    },
  };

  const [userProfile, setUserProfile] = useState({
    height: '',
    weight: '',
    goal: '',
    activityLevel: '',
    dietaryRestrictions: '',
  });

  const [foodPreferences, setFoodPreferences] = useState({
    likes: '',
    dislikes: '',
  });

  const [mealPlan, setMealPlan] = useState({
    monday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '' },
    tuesday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '' },
    wednesday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '' },
    thursday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '' },
    friday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '' },
    saturday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '' },
    sunday: { breakfast: '', lunch: '', dinner: '', dessert: '', snacks: '' },
  });

  const [aiTestResult, setAiTestResult] = useState('');
  const [isTestingAI, setIsTestingAI] = useState(false);

  const workoutTypes = [
    'Rest',
    'Distance Run',
    'Speed or Agility Training',
    'Bike Ride',
    'Walk/Hike',
    'Swim',
    'Strength Training',
    'Sport Practice',
  ];
  const intensityLevels = ['Low', 'Moderate', 'High'];

  const handleTrainingPlanChange = (day, field, value) => {
    setTrainingPlan((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  // --------- SAVE/LOAD PERSONAL INFO ---------

  // Load from DB after login (non-guest)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || isGuest) return;
      try {
        const data = await fetchPersonalInfo(user.id);
        if (cancelled) return;

        if (data.userProfile) {
          setUserProfile({
            height: data.userProfile.height || '',
            weight: data.userProfile.weight || '',
            goal: data.userProfile.goal || '',
            activityLevel: data.userProfile.activity_level || '',
            dietaryRestrictions: data.userProfile.dietary_restrictions || '',
          });
        }
        if (data.foodPreferences) {
          setFoodPreferences({
            likes: data.foodPreferences.likes || '',
            dislikes: data.foodPreferences.dislikes || '',
          });
        }
      } catch (e) {
        console.error('Load personal info failed:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isGuest]);

  const saveProfile = async () => {
    if (!user || isGuest) return;
    const { error } = await saveUserProfile(user.id, userProfile);
    if (error) {
      console.error(error);
      alert('Failed to save profile');
    }
  };

  const savePrefs = async () => {
    if (!user || isGuest) return;
    const { error } = await saveFoodPreferences(user.id, foodPreferences);
    if (error) {
      console.error(error);
      alert('Failed to save preferences');
    }
  };

  // --------- MEAL GEN + RECIPE (unchanged) ---------

  const generateMealSuggestions = async () => {
    setIsTestingAI(true);
    setAiTestResult('Generating personalized meal plan...');

    try {
      const requestData = {
        userProfile,
        foodPreferences: {
          likes: Array.from(foodPreferences.likes),
          dislikes: Array.from(foodPreferences.dislikes),
        },
        trainingPlan,
      };

      const response = await fetch('/api/generate-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        setMealPlan(result.meals);
        setAiTestResult('✅ Personalized meal plan generated successfully!');
      } else {
        throw new Error(result.error || 'Failed to generate meals');
      }
    } catch (error) {
      console.error('Error generating meals:', error);
      setAiTestResult(`❌ Error: ${error.message}`);
      setMealPlan(mockSuggestions); // fallback
    } finally {
      setIsTestingAI(false);
    }
  };

  const regenerateMeal = async (day, mealType) => {
    const reason = prompt(
      "Why would you like to regenerate this meal? (e.g., 'don't like salmon', 'too many carbs', 'prefer vegetarian option')"
    );
    if (!reason) return;

    setAiTestResult(`Regenerating ${mealType} for ${day}...`);

    try {
      const requestData = {
        userProfile,
        foodPreferences: {
          likes: Array.from(foodPreferences.likes),
          dislikes: Array.from(foodPreferences.dislikes),
        },
        trainingPlan,
        day,
        mealType,
        reason,
        currentMeal: mealPlan[day][mealType],
      };

      const response = await fetch('/api/regenerate-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        setMealPlan((prev) => ({
          ...prev,
          [day]: { ...prev[day], [mealType]: result.meal },
        }));
        setAiTestResult(`✅ ${mealType} for ${day} regenerated!`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setAiTestResult(`❌ Error regenerating meal: ${error.message}`);
    }
  };

  const getRecipe = async (day, mealType) => {
    setAiTestResult(`Getting recipe for ${mealPlan[day][mealType]}...`);

    try {
      const response = await fetch('/api/get-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal: mealPlan[day][mealType],
          day,
          mealType,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setRecipeTitle(mealPlan[day][mealType]);
        setCurrentRecipe(result.recipe);
        setShowRecipeModal(true);
        setAiTestResult(`✅ Recipe generated!`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setAiTestResult(`❌ Error getting recipe: ${error.message}`);
    }
  };

  const handleMealEdit = (day, meal, value) => {
    setMealPlan((prev) => ({
      ...prev,
      [day]: { ...prev[day], [meal]: value },
    }));
  };

  const handleProfileChange = (field, value) => {
    setUserProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateGroceryList = async () => {
    setAiTestResult('Generating grocery list...');

    try {
      const allMeals = [];
      Object.entries(mealPlan).forEach(([_, meals]) => {
        Object.entries(meals).forEach(([__ , meal]) => {
          if (meal.trim()) allMeals.push(meal);
        });
      });

      const response = await fetch('/api/generate-grocery-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meals: allMeals,
          userProfile,
        }),
      });

      const result = await response.json();

      if (result.success && result.groceryList) {
        setGroceryList(result.groceryList);
        setShowGroceryModal(true);
        setAiTestResult('✅ Grocery list generated!');
      } else {
        throw new Error(result.error || 'Failed to generate grocery list');
      }
    } catch (error) {
      setAiTestResult(`❌ Error generating grocery list: ${error.message}`);
    }
  };

  // ---------- AUTH GATES ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-indigo-600">Loading...</div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <Auth />;
  }

  // ---------- APP UI ----------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-8 h-8 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">Nutrition Coach</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Welcome, {user?.email ?? 'Guest'}!</span>
              <button
                onClick={() => {
                  if (isGuest) disableGuestMode();
                  else signOut();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                {isGuest ? 'Exit Guest Mode' : 'Logout'}
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
                {view === 'training'
                  ? 'Training Plan'
                  : view === 'profile'
                  ? 'Profile'
                  : view === 'preferences'
                  ? 'Food Preferences'
                  : 'Meal Plan'}
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Weekly Training Schedule</h2>
                {/* (optional) add a save button for training plan later */}
              </div>
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
                          <option key={type} value={type}>
                            {type}
                          </option>
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
                          <option key={level} value={level}>
                            {level}
                          </option>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                  <input
                    type="text"
                    placeholder="e.g., 5'8&quot; or 173cm"
                    value={userProfile.height}
                    onChange={(e) => handleProfileChange('height', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                  <input
                    type="text"
                    placeholder="e.g., 150 lbs or 68 kg"
                    value={userProfile.weight}
                    onChange={(e) => handleProfileChange('weight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight Goal</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Activity Level (outside training)</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Restrictions (optional)</label>
                  <textarea
                    placeholder="e.g., vegetarian, gluten-free, nut allergies, etc."
                    value={userProfile.dietaryRestrictions}
                    onChange={(e) => handleProfileChange('dietaryRestrictions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="3"
                  />
                </div>
              </div>

              <button
                onClick={saveProfile}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Save Profile
              </button>
            </div>
          </div>
        )}

        {currentView === 'preferences' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Food Preferences</h2>
              <p className="text-gray-600 mb-6">
                Describe the foods you like and dislike to personalize your meal suggestions.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foods I Like</label>
                  <textarea
                    placeholder="e.g., chicken, salmon, quinoa, berries, Greek yogurt, avocado..."
                    value={foodPreferences.likes}
                    onChange={(e) => setFoodPreferences((prev) => ({ ...prev, likes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foods I Dislike</label>
                  <textarea
                    placeholder="e.g., seafood, mushrooms, spicy food, dairy..."
                    value={foodPreferences.dislikes}
                    onChange={(e) => setFoodPreferences((prev) => ({ ...prev, dislikes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="4"
                  />
                </div>
              </div>

              <button
                onClick={savePrefs}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {currentView === 'meals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Weekly Meal Plan</h2>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={generateMealSuggestions}
                    disabled={isTestingAI}
                    className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
                  >
                    <Plus className="w-4 h-4" />
                    {isTestingAI ? 'Generating...' : 'Generate AI Suggestions'}
                  </button>
                  {Object.values(mealPlan).some((day) => Object.values(day).some((meal) => meal.trim())) && (
                    <button
                      onClick={generateGroceryList}
                      className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Generate Grocery List
                    </button>
                  )}
                </div>
              </div>

              {aiTestResult && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md whitespace-pre-line">
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

                    {/* Main meals */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {['breakfast', 'lunch', 'dinner'].map((meal) => (
                        <div key={meal} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-gray-700 capitalize">{meal}</label>
                            {mealPlan[day][meal] && (
                              <button
                                onClick={() => regenerateMeal(day, meal)}
                                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600 flex items-center gap-1"
                                title="Regenerate this meal"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Regenerate
                              </button>
                            )}
                          </div>
                          <textarea
                            value={mealPlan[day][meal]}
                            onChange={(e) => handleMealEdit(day, meal, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows="3"
                            placeholder={`Enter ${meal}...`}
                          />
                          {mealPlan[day][meal] && (
                            <button
                              onClick={() => getRecipe(day, meal)}
                              className="w-full text-xs bg-green-100 hover:bg-green-200 px-2 py-1 rounded text-green-700 mt-1"
                            >
                              Get Recipe
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Snacks & dessert */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['snacks', 'dessert'].map((meal) => (
                        <div key={meal} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-gray-700 capitalize">{meal}</label>
                            {mealPlan[day][meal] && (
                              <button
                                onClick={() => regenerateMeal(day, meal)}
                                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600 flex items-center gap-1"
                                title="Regenerate this meal"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Regenerate
                              </button>
                            )}
                          </div>
                          <textarea
                            value={mealPlan[day][meal]}
                            onChange={(e) => handleMealEdit(day, meal, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows="3"
                            placeholder={`Enter ${meal}...`}
                          />
                          {mealPlan[day][meal] && (
                            <button
                              onClick={() => getRecipe(day, meal)}
                              className="w-full text-xs bg-green-100 hover:bg-green-200 px-2 py-1 rounded text-green-700 mt-1"
                            >
                              Get Recipe
                            </button>
                          )}
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

      {/* Recipe Modal */}
      {showRecipeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Recipe: {recipeTitle}</h3>
              <button onClick={() => setShowRecipeModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{currentRecipe}</pre>
            </div>
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowRecipeModal(false)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grocery List Modal */}
      {showGroceryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Grocery List</h3>
              <button onClick={() => setShowGroceryModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {groceryList.map((category, index) => (
                  <div key={index}>
                    <h4 className="font-semibold text-gray-800 mb-2">{category.category}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {category.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-gray-700">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowGroceryModal(false)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarathonNutritionApp;
