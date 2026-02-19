import React, { useState, useRef, useEffect } from 'react';
import { Plus, MoreHorizontal, RotateCcw, BarChart3, Star, ShoppingCart, ChevronLeft, ChevronRight, Copy, UtensilsCrossed, Heart, ChefHat } from 'lucide-react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { RecipeModal } from '../components/modals/RecipeModal';
import { GroceryModal } from '../components/modals/GroceryModal';
import { CopyMealModal } from '../components/modals/CopyMealModal';
import { LogMealModal } from '../components/modals/LogMealModal';
import { calculateDayMacros } from '../services/mealService';
import { MealPlanSkeleton } from '../components/shared/LoadingSkeleton';
import { Tooltip } from '../components/shared/Tooltip';
import { MealPrepModal } from '../components/modals/MealPrepModal';
import { AnalyticsModal } from '../components/modals/AnalyticsModal';
import { Dropdown } from '../components/shared/Dropdown';
import { useAuth } from '../context/AuthContext';
import { ServingsPickerModal } from '../components/modals/ServingsPickerModal';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const MealPlanPage = ({ 
  mealPlan, 
  onUpdate, 
  onRate,
  onGenerate, 
  onRegenerate,
  onLoadWeek,
  onSave,
  isGenerating,
  isLoading,
  statusMessage,
  currentWeekStarting,
  userProfile,
  foodPreferences,
  trainingPlan,
  onSaveMeal,
  isMealSaved,
  isGuest,
  savedMeals,
  onUseSavedMeal,
  onDeleteSavedMeal
}) => {
  const { user } = useAuth();
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState('');
  const [recipeTitle, setRecipeTitle] = useState('');
  
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [groceryList, setGroceryList] = useState([]);
  
  // Copy meal state
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyMealData, setCopyMealData] = useState({ meal: '', mealType: '', day: '' });
  
  // Log meal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [logMealDefaults, setLogMealDefaults] = useState({ day: 'monday', mealType: 'lunch' });
  
  const [localStatusMessage, setLocalStatusMessage] = useState('');

  const [loadingRecipe, setLoadingRecipe] = useState(null);
  const [showMealPrepModal, setShowMealPrepModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // Servings picker state
  const [showServingsPicker, setShowServingsPicker] = useState(false);
  const [recipeContext, setRecipeContext] = useState({ day: '', mealType: '' });

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Test day generation state
  const [selectedTestDay, setSelectedTestDay] = useState('monday');
  const [isTestGenerating, setIsTestGenerating] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [testStatus, setTestStatus] = useState('');
  const [showTestResults, setShowTestResults] = useState(false);

  // Build Day (Test) state
  const [selectedBuildDay, setSelectedBuildDay] = useState('monday');
  const [isBuilding, setIsBuilding] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const [debugData, setDebugData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [builtMeals, setBuiltMeals] = useState([]);
  const [mealStatuses, setMealStatuses] = useState({});
  const [dailyTotals, setDailyTotals] = useState(null);
  const [dailyTargets, setDailyTargets] = useState(null);
  const [buildStatus, setBuildStatus] = useState('');
  const [showBuildResults, setShowBuildResults] = useState(false);
  const [debugTab, setDebugTab] = useState('prompt');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Use either the passed statusMessage or local one
  const displayMessage = statusMessage || localStatusMessage;

  // --- Safety: log what's going on when it "hangs" ---
  console.log('MealPlanPage render', {
    isLoading,
    hasMealsDebug: mealPlan && Object.values(mealPlan).some(day =>
      day &&
      Object.entries(day).some(([mealType, meal]) =>
        !mealType.includes('_rating') &&
        meal &&
        typeof meal === 'string' &&
        meal.trim()
      )
    ),
    currentWeekStarting,
  });

  const handleRegenerate = async (day, mealType) => {
    const reason = prompt(
      "Why would you like to regenerate this meal? (e.g., 'don't like salmon', 'too many carbs', 'prefer vegetarian option')"
    );
    if (!reason) return;

    await onRegenerate(day, mealType, reason, {
      userProfile,
      foodPreferences,
      trainingPlan,
    });
  };

  const handleCopyClick = (day, mealType, meal) => {
    setCopyMealData({ meal, mealType, day });
    setShowCopyModal(true);
  };

  const handleCopyMeal = (targetDay, mealType, meal) => {
    onUpdate(targetDay, mealType, meal);
  };

  const handleLogClick = (day = 'monday', mealType = 'lunch') => {
    setLogMealDefaults({ day, mealType });
    setShowLogModal(true);
  };

  const handleLogMeal = (day, mealType, description) => {
    onUpdate(day, mealType, description);
    setLocalStatusMessage(`✅ Logged ${mealType} for ${day}!`);
    setTimeout(() => setLocalStatusMessage(''), 3000);
  };

  // Count how many meals are filled vs total
  const countMeals = () => {
    let filled = 0;
    let total = 0;
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks', 'dessert'];
    
    DAYS.forEach(day => {
      mealTypes.forEach(mt => {
        total++;
        const meal = mealPlan?.[day]?.[mt];
        if (meal && typeof meal === 'string' && meal.trim()) {
          filled++;
        }
      });
    });
    
    return { filled, total, hasPartial: filled > 0 && filled < total };
  };

  const { filled, total, hasPartial } = countMeals();
  const isPlanComplete = filled === total && total > 0;

  const getRecipe = async (day, mealType) => {
    // Show servings picker first
    setRecipeContext({ day, mealType });
    setShowServingsPicker(true);
  };

  const handleServingsConfirm = async (servings) => {
    setShowServingsPicker(false);
    const { day, mealType } = recipeContext;

    setLoadingRecipe({ day, mealType });
    setLocalStatusMessage(`🔄 Getting recipe for ${mealPlan[day][mealType]}...`);

    try {
      const response = await fetch('/api/get-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal: mealPlan[day][mealType],
          day,
          mealType,
          servings: servings,
          dislikes: foodPreferences?.dislikes || '',
          dietaryRestrictions: userProfile?.dietary_restrictions || userProfile?.dietaryRestrictions || '',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setRecipeTitle(mealPlan[day][mealType]);
        setCurrentRecipe(result.recipe);
        setShowRecipeModal(true);
        setLocalStatusMessage('✅ Recipe generated!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setLocalStatusMessage(`❌ Error getting recipe: ${error.message}`);
    }

    setLoadingRecipe(null);
    setTimeout(() => setLocalStatusMessage(''), 3000);
  };

  const generateGroceryList = async () => {
    setLocalStatusMessage('🔄 Generating grocery list...');

    try {
      const allMeals = [];
      
      Object.entries(mealPlan || {}).forEach(([day, meals]) => {
        Object.entries(meals || {}).forEach(([mealType, meal]) => {
          if (
            !meal ||
            typeof meal !== 'string' ||
            mealType.includes('_rating') ||
            meal.trim() === ''
          ) {
            return;
          }
          allMeals.push(meal);
        });
      });

      if (allMeals.length === 0) {
        setLocalStatusMessage('❌ No meals found. Generate a meal plan first!');
        setTimeout(() => setLocalStatusMessage(''), 5000);
        return;
      }

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
        setLocalStatusMessage('✅ Grocery list generated!');
      } else {
        throw new Error(result.error || 'Failed to generate grocery list');
      }
    } catch (error) {
      setLocalStatusMessage(`❌ Error: ${error.message}`);
    }

    setTimeout(() => setLocalStatusMessage(''), 5000);
  };

  const hasMeals = mealPlan && Object.values(mealPlan).some(day =>
    day &&
    Object.entries(day).some(([mealType, meal]) => 
      !mealType.includes('_rating') && 
      meal && 
      typeof meal === 'string' && 
      meal.trim()
    )
  );

  // Helper function to get Monday of current week
  const getMondayOfCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };

  const formatWeekDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getPreviousWeek = () => {
    if (!currentWeekStarting) return null;
    const date = new Date(currentWeekStarting + 'T00:00:00');
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  };

  const getNextWeek = () => {
    if (!currentWeekStarting) return null;
    const date = new Date(currentWeekStarting + 'T00:00:00');
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const handlePreviousWeek = async () => {
    const prevWeek = getPreviousWeek();
    if (prevWeek && onLoadWeek) {
      await onLoadWeek(prevWeek);
    }
  };

  const handleNextWeek = async () => {
    const nextWeek = getNextWeek();
    if (nextWeek && onLoadWeek) {
      await onLoadWeek(nextWeek);
    }
  };

  const handleCurrentWeek = async () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    const weekStarting = monday.toISOString().split('T')[0];
    if (onLoadWeek) {
      await onLoadWeek(weekStarting);
    }
  };

  const handleTestDayGeneration = async () => {
    setIsTestGenerating(true);
    setTestStatus('Connecting to server...');
    setShowTestResults(true);
    
    const initialResults = {
      nutrition: null,
      meals: {},
      mealStatuses: {},
      dailyTotals: null,
      dailyTargets: null,
      error: null
    };
    setTestResults(initialResults);

    try {
      const response = await fetch('/api/generate-day-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          foodPreferences,
          trainingPlan,
          day: selectedTestDay
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          // Parse SSE format: "event: type" followed by "data: {...}"
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
            continue;
          }

          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5).trim());
              
              setTestResults(prev => {
                const updated = { ...prev };

                if (currentEvent === 'nutrition') {
                  updated.nutrition = data;
                  setTestStatus(`📊 Calculated TDEE: ${data.adjustedTdee} kcal/day`);
                }
                else if (currentEvent === 'status') {
                  updated.mealStatuses = {
                    ...updated.mealStatuses,
                    [data.mealType]: data.status
                  };
                  setTestStatus(`🔄 Generating ${data.mealType}...`);
                }
                else if (currentEvent === 'meal') {
                  updated.meals = {
                    ...updated.meals,
                    [data.mealType]: data.meal
                  };
                  updated.mealStatuses = {
                    ...updated.mealStatuses,
                    [data.mealType]: 'complete'
                  };
                  setTestStatus(`✅ ${data.mealType} complete!`);
                }
                else if (currentEvent === 'complete') {
                  updated.dailyTotals = data.dailyTotals;
                  updated.dailyTargets = data.dailyTargets;
                  setTestStatus(`✅ All meals generated for ${selectedTestDay}!`);
                }
                else if (currentEvent === 'error') {
                  updated.error = data.message;
                  setTestStatus(`❌ Error: ${data.message}`);
                }

                return updated;
              });

              currentEvent = null; // Reset after processing
            } catch (e) {
              console.error('Failed to parse SSE data:', e, line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Test generation error:', error);
      setTestStatus(`❌ Error: ${error.message}`);
      setTestResults(prev => ({ ...prev, error: error.message }));
    } finally {
      setIsTestGenerating(false);
    }
  };

  const handleBuildDay = async () => {
    setIsBuilding(true);
    setBuildStatus('Connecting...');
    setShowBuildResults(true);
    setDebugData(null);
    setNutritionData(null);
    setBuiltMeals([]);
    setMealStatuses({});
    setDailyTotals(null);
    setDailyTargets(null);

    try {
      const response = await fetch('/api/generate-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day: selectedBuildDay,
          userProfile,
          foodPreferences,
          trainingPlan,
          weekStarting: currentWeekStarting,
          existingMeals: mealPlan, // Pass current meal plan for cross-day variety
          forceRegenerate: true, // Always regenerate all meals for testing
          debug: showDebug,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          if (line.startsWith('event:')) {
            currentEvent = line.slice(7).trim();
            continue;
          }

          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(6).trim());

              if (currentEvent === 'debug') {
                setDebugData(data);
              } else if (currentEvent === 'nutrition') {
                setNutritionData(data);
                setBuildStatus(`📊 Nutrition calculated`);
              } else if (currentEvent === 'status') {
                if (data.mealType && data.status === 'processing') {
                  // Show loading indicator for this specific meal slot
                  onUpdate(selectedBuildDay, data.mealType, '__generating__');
                  setMealStatuses(prev => ({ ...prev, [data.mealType]: 'processing' }));
                } else {
                  setMealStatuses(prev => ({ ...prev, [data.mealType]: data.status }));
                }
                setBuildStatus(`🔄 ${data.message || `Generating ${data.mealType}...`}`);
              } else if (currentEvent === 'meal') {
                // Immediately update the meal plan for this slot
                if (data.meal && data.mealType && !data.error) {
                  onUpdate(selectedBuildDay, data.mealType, data.meal);
                }
                setBuiltMeals(prev => [...prev, { mealType: data.mealType, meal: data.meal, error: data.error }]);
                setMealStatuses(prev => ({ ...prev, [data.mealType]: data.error ? 'error' : 'done' }));
                setBuildStatus(data.error ? `❌ ${data.mealType} failed` : `✅ ${data.mealType} complete`);
              } else if (currentEvent === 'done') {
                setDailyTotals(data.dailyTotals);
                setDailyTargets(data.dailyTargets);
                setBuildStatus(`✅ ${selectedBuildDay} complete!`);
              } else if (currentEvent === 'error') {
                setBuildStatus(`❌ Error: ${data.message}`);
              }

              currentEvent = null;
            } catch (e) {
              console.error('Failed to parse SSE data:', e, line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Build day error:', error);
      setBuildStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsBuilding(false);
    }
  };

  // Auto-save meal plan when it changes (debounced)
  useEffect(() => {
    if (!currentWeekStarting || !onSave || !hasMeals) return;

    const timeoutId = setTimeout(() => {
      onSave();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [mealPlan, currentWeekStarting, onSave, hasMeals]);

  // ✅ Only show skeleton if loading AND we *don't* have meals yet
  if (isLoading && !hasMeals) {
    return (
      <div className="space-y-8">
        <MealPlanSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Left: Title + Week controls underneath */}
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-gray-900">Weekly Meal Plan</h2>

              {currentWeekStarting && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    onClick={handlePreviousWeek}
                    className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    disabled={!onLoadWeek}
                    title="Previous week"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <span className="text-sm font-semibold text-gray-700 px-3 whitespace-nowrap">
                    Week of {formatWeekDate(currentWeekStarting)}
                  </span>

                  <button
                    onClick={handleNextWeek}
                    className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    disabled={!onLoadWeek}
                    title="Next week"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {currentWeekStarting !== getMondayOfCurrentWeek() && (
                    <button
                      onClick={handleCurrentWeek}
                      className="px-3 py-1 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors border border-primary/20 whitespace-nowrap"
                    >
                      Go to Current Week
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right: Action buttons - single row with dropdown */}
            <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
              <Button
                onClick={onGenerate}
                disabled={isGenerating}
                icon={Plus}
                size="lg"
                className="bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-primary shadow-md hover:shadow-lg transition-all"
              >
                {isGenerating ? 'Generating...' : hasPartial ? 'Generate Remaining' : 'Generate Meals'}
              </Button>

              {isPlanComplete ? (
                <>
                  <Button onClick={() => setShowAnalyticsModal(true)} variant="outline" icon={BarChart3} size="sm">
                    Analytics
                  </Button>

                  {hasMeals && (
                    <Button onClick={generateGroceryList} variant="outline" icon={ShoppingCart} size="sm">
                      Grocery List
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button onClick={() => setShowMealPrepModal(true)} variant="outline" icon={ChefHat} size="sm">
                    Meal Prep
                  </Button>

                  <Button onClick={() => handleLogClick()} variant="outline" icon={UtensilsCrossed} size="sm">
                    Log Meal
                  </Button>
                </>
              )}

              {/* More Actions Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  title="More actions"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-600" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50 py-1">
                    {isPlanComplete ? (
                      <>
                        <button
                          onClick={() => {
                            setShowMealPrepModal(true);
                            setShowDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <ChefHat className="w-4 h-4" />
                          Meal Prep
                        </button>

                        <button
                          onClick={() => {
                            handleLogClick();
                            setShowDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <UtensilsCrossed className="w-4 h-4" />
                          Log Meal
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setShowAnalyticsModal(true);
                            setShowDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Analytics
                        </button>

                        {hasMeals && (
                          <button
                            onClick={() => {
                              generateGroceryList();
                              setShowDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Grocery List
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {(displayMessage || isGenerating) && (
          <div className={`mb-4 p-4 rounded-lg border ${
            displayMessage.includes('✅') 
              ? 'bg-green-50 border-green-500 text-green-800'
              : displayMessage.includes('❌')
              ? 'bg-red-50 border-red-500 text-red-800'
              : 'bg-blue-50 border-blue-500 text-blue-800'
          }`}>
            <div className="flex items-center gap-2">
              {(displayMessage.includes('🔄') || isGenerating) && (
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              )}
              <span className="font-medium">
                {isGenerating && !displayMessage ? '🔄 Generating personalized meal plan...' : displayMessage}
              </span>
            </div>
          </div>
        )}

        {/* TEST: Generate Day with New Architecture */}
        <div className="mb-6 p-4 bg-indigo-50 border-2 border-indigo-300 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-indigo-900">🧪 Test: Generate Day (New Architecture)</h3>
            {showTestResults && (
              <button
                onClick={() => setShowTestResults(false)}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Hide Results
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedTestDay}
              onChange={(e) => setSelectedTestDay(e.target.value)}
              disabled={isTestGenerating}
              className="px-3 py-2 border border-indigo-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DAYS.map(day => (
                <option key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</option>
              ))}
            </select>

            <Button
              onClick={handleTestDayGeneration}
              disabled={isTestGenerating || !userProfile || !foodPreferences}
              className="bg-indigo-600 hover:bg-indigo-700"
              size="sm"
            >
              {isTestGenerating ? 'Generating...' : 'Generate Day (Test)'}
            </Button>

            {testStatus && (
              <span className="text-sm text-indigo-700 font-medium">{testStatus}</span>
            )}
          </div>

          {!userProfile || !foodPreferences ? (
            <p className="text-xs text-indigo-600 mt-2">
              Complete your profile and preferences to test day generation
            </p>
          ) : null}
        </div>

        {/* Test Results Panel */}
        {showTestResults && testResults && (
          <div className="mb-6 p-6 bg-white border-2 border-indigo-300 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold text-indigo-900 mb-4">
              Test Results: {selectedTestDay.charAt(0).toUpperCase() + selectedTestDay.slice(1)}
            </h3>

            {testResults.error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg text-red-800">
                <strong>Error:</strong> {testResults.error}
              </div>
            )}

            {testResults.nutrition && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">📊 TDEE & Daily Targets</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-blue-700">BMR:</span>
                    <span className="ml-2 font-mono font-semibold">{testResults.nutrition.bmr} kcal</span>
                  </div>
                  <div>
                    <span className="text-blue-700">TDEE:</span>
                    <span className="ml-2 font-mono font-semibold">{testResults.nutrition.tdee} kcal</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Adjusted:</span>
                    <span className="ml-2 font-mono font-semibold">{testResults.nutrition.adjustedTdee} kcal</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Training:</span>
                    <span className="ml-2 font-mono font-semibold">{testResults.nutrition.parsed.trainingMultiplier}x</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-sm">
                  <span><strong>P:</strong> {testResults.nutrition.dailyMacros.protein}g</span>
                  <span><strong>C:</strong> {testResults.nutrition.dailyMacros.carbs}g</span>
                  <span><strong>F:</strong> {testResults.nutrition.dailyMacros.fat}g</span>
                </div>
              </div>
            )}

            {/* Meals */}
            <div className="space-y-4">
              {['breakfast', 'lunch', 'dinner', 'snack', 'dessert'].map(mealType => {
                const meal = testResults.meals[mealType];
                const status = testResults.mealStatuses[mealType];
                const budget = testResults.nutrition?.mealBudgets?.[mealType];

                return (
                  <div key={mealType} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 capitalize">{mealType}</h4>
                      {status === 'generating' && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                          Generating...
                        </div>
                      )}
                      {status === 'complete' && !meal && (
                        <span className="text-sm text-green-600">✓ Complete</span>
                      )}
                    </div>

                    {budget && (
                      <div className="mb-2 text-xs text-gray-600">
                        <strong>Budget:</strong> P: {budget.protein}g | C: {budget.carbs}g | F: {budget.fat}g | {Math.round(budget.protein * 4 + budget.carbs * 4 + budget.fat * 9)} kcal
                      </div>
                    )}

                    {meal && (
                      <div className="space-y-2">
                        <div className="font-medium text-gray-800">{meal.meal_name}</div>
                        
                        {meal.ingredients && meal.ingredients.length > 0 && (
                          <div className="text-sm space-y-1">
                            <div className="font-semibold text-gray-700">Ingredients:</div>
                            {meal.ingredients.map((ing, idx) => (
                              <div key={idx} className="text-gray-600 pl-4">
                                • {ing.name} <span className="text-gray-500">({ing.type})</span> — {ing.grams}g
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm mt-2">
                          <div className="font-semibold text-gray-700">Macros:</div>
                          <div className="flex gap-3">
                            <span className={budget && Math.abs(meal.macros.protein - budget.protein) > 5 ? 'text-orange-600' : 'text-gray-700'}>
                              P: {meal.macros.protein}g
                            </span>
                            <span className={budget && Math.abs(meal.macros.carbs - budget.carbs) > 10 ? 'text-orange-600' : 'text-gray-700'}>
                              C: {meal.macros.carbs}g
                            </span>
                            <span className={budget && Math.abs(meal.macros.fat - budget.fat) > 5 ? 'text-orange-600' : 'text-gray-700'}>
                              F: {meal.macros.fat}g
                            </span>
                            <span className="text-gray-700">
                              {meal.macros.calories} kcal
                            </span>
                          </div>
                        </div>

                        {meal.scaled && (
                          <div className="text-xs text-orange-600 mt-2">
                            ⚠️ Scaled by {(meal.scaleFactors?.overall || 1).toFixed(2)}x to match budget
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Daily Totals */}
            {testResults.dailyTotals && testResults.dailyTargets && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-3">📈 Daily Totals vs Targets</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-green-700">Protein</div>
                    <div className="font-mono font-semibold">
                      {testResults.dailyTotals.protein}g / {testResults.dailyTargets.protein}g
                    </div>
                  </div>
                  <div>
                    <div className="text-green-700">Carbs</div>
                    <div className="font-mono font-semibold">
                      {testResults.dailyTotals.carbs}g / {testResults.dailyTargets.carbs}g
                    </div>
                  </div>
                  <div>
                    <div className="text-green-700">Fat</div>
                    <div className="font-mono font-semibold">
                      {testResults.dailyTotals.fat}g / {testResults.dailyTargets.fat}g
                    </div>
                  </div>
                  <div>
                    <div className="text-green-700">Calories</div>
                    <div className="font-mono font-semibold">
                      {testResults.dailyTotals.calories} / {testResults.dailyTargets.calories} kcal
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BUILD DAY (TEST) - with Debug Output */}
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-900">🔧 Build Day (Test) - Old Pipeline with Debug</h3>
            {showBuildResults && (
              <button
                onClick={() => setShowBuildResults(false)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Hide Results
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedBuildDay}
              onChange={(e) => setSelectedBuildDay(e.target.value)}
              disabled={isBuilding}
              className="px-3 py-2 border border-blue-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DAYS.map(day => (
                <option key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</option>
              ))}
            </select>

            <Button
              onClick={handleBuildDay}
              disabled={isBuilding || !userProfile}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              {isBuilding ? 'Building...' : 'Build Day'}
            </Button>

            <label className="flex items-center gap-2 text-sm text-blue-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showDebug}
                onChange={(e) => setShowDebug(e.target.checked)}
                className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
              />
              Show Debug
            </label>

            {buildStatus && (
              <span className="text-sm text-blue-700 font-medium">{buildStatus}</span>
            )}
          </div>
        </div>

        {/* Build Day Results */}
        {showBuildResults && (
          <div className="mb-6 space-y-4">
            {/* Debug Box */}
            {showDebug && debugData && (
              <div className="p-4 bg-gray-100 border-2 border-gray-300 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">🐛 Debug Output</h4>
                
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setDebugTab('prompt')}
                    className={`px-3 py-1 text-sm rounded ${
                      debugTab === 'prompt'
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Prompt Sent
                  </button>
                  <button
                    onClick={() => setDebugTab('response')}
                    className={`px-3 py-1 text-sm rounded ${
                      debugTab === 'response'
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    AI Response
                  </button>
                </div>

                <div className="bg-white border border-gray-300 rounded p-3 max-h-96 overflow-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                    {debugTab === 'prompt' ? debugData.prompt : debugData.rawResponse}
                  </pre>
                </div>
              </div>
            )}

            {/* Nutrition Summary */}
            {nutritionData && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">📊 Nutrition Targets</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-blue-700">BMR:</span>
                    <span className="ml-2 font-mono font-semibold">{nutritionData.bmr || 'N/A'} kcal</span>
                  </div>
                  <div>
                    <span className="text-blue-700">TDEE:</span>
                    <span className="ml-2 font-mono font-semibold">{nutritionData.tdee || 'N/A'} kcal</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Adjusted:</span>
                    <span className="ml-2 font-mono font-semibold">{nutritionData.adjustedTdee || 'N/A'} kcal</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Training:</span>
                    <span className="ml-2 font-mono font-semibold">{nutritionData.trainingMultiplier || '1.0'}x</span>
                  </div>
                </div>
                {nutritionData.dailyMacros && (
                  <div className="mt-3 flex gap-4 text-sm">
                    <span><strong>Target P:</strong> {nutritionData.dailyMacros.protein}g</span>
                    <span><strong>C:</strong> {nutritionData.dailyMacros.carbs}g</span>
                    <span><strong>F:</strong> {nutritionData.dailyMacros.fat}g</span>
                  </div>
                )}
              </div>
            )}

            {/* Meals */}
            {builtMeals.length > 0 && (
              <div className="space-y-3">
                {builtMeals.map((item, idx) => {
                  const status = mealStatuses[item.mealType];
                  const isGenerating = status === 'generating' || status === 'processing';

                  return (
                    <div key={idx} className="p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-900 capitalize">{item.mealType}</h5>
                        {isGenerating && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                            Generating...
                          </div>
                        )}
                      </div>

                      {item.error ? (
                        <div className="text-sm text-red-600">Error: {item.error}</div>
                      ) : item.meal ? (
                        <div className="text-sm text-gray-800">{item.meal}</div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Daily Totals */}
            {dailyTotals && dailyTargets && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-3">📈 Daily Totals vs Targets</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-green-700">Protein</div>
                    <div className="font-mono font-semibold">
                      {dailyTotals.protein}g / {dailyTargets.protein}g
                    </div>
                  </div>
                  <div>
                    <div className="text-green-700">Carbs</div>
                    <div className="font-mono font-semibold">
                      {dailyTotals.carbs}g / {dailyTargets.carbs}g
                    </div>
                  </div>
                  <div>
                    <div className="text-green-700">Fat</div>
                    <div className="font-mono font-semibold">
                      {dailyTotals.fat}g / {dailyTargets.fat}g
                    </div>
                  </div>
                  <div>
                    <div className="text-green-700">Calories</div>
                    <div className="font-mono font-semibold">
                      {dailyTotals.calories} / {dailyTargets.calories} kcal
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!hasMeals && !isGenerating ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              No meal plan generated yet. Click "Generate Meals" to create your personalized weekly meal plan, or "Log Meal" to enter what you ate!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {DAYS.map((day) => {
              const dayMacros = calculateDayMacros(mealPlan[day]);
              
              return (
                <div key={day} className="border rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {day}
                    </h3>
                    
                    {dayMacros.hasData && (
                      <div className="flex gap-2 text-sm flex-wrap">
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-medium">
                          Cal: {dayMacros.calories}
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                          P: {dayMacros.protein}g
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                          C: {dayMacros.carbs}g
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                          F: {dayMacros.fat}g
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {['breakfast', 'lunch', 'dinner'].map((mealType) => (
                      <MealCard
                        key={mealType}
                        day={day}
                        mealType={mealType}
                        meal={mealPlan[day][mealType]}
                        rating={mealPlan[day][`${mealType}_rating`] || 0}
                        onUpdate={onUpdate}
                        onRate={onRate}
                        onRegenerate={handleRegenerate}
                        onGetRecipe={getRecipe}
                        onCopy={handleCopyClick}
                        onLogClick={handleLogClick}
                        loadingRecipe={loadingRecipe}
                        onSaveMeal={onSaveMeal}
                        isMealSaved={isMealSaved}
                        isGuest={isGuest}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['snacks', 'dessert'].map((mealType) => (
                      <MealCard
                        key={mealType}
                        day={day}
                        mealType={mealType}
                        meal={mealPlan[day][mealType]}
                        rating={mealPlan[day][`${mealType}_rating`] || 0}
                        onUpdate={onUpdate}
                        onRate={onRate}
                        onRegenerate={handleRegenerate}
                        onGetRecipe={getRecipe}
                        onCopy={handleCopyClick}
                        onLogClick={handleLogClick}
                        loadingRecipe={loadingRecipe}
                        onSaveMeal={onSaveMeal}
                        isMealSaved={isMealSaved}
                        isGuest={isGuest}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RecipeModal
        isOpen={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        recipe={currentRecipe}
        title={recipeTitle}
      />

      <GroceryModal
        isOpen={showGroceryModal}
        onClose={() => setShowGroceryModal(false)}
        groceryList={groceryList}
      />

      <CopyMealModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        meal={copyMealData.meal}
        mealType={copyMealData.mealType}
        currentDay={copyMealData.day}
        onCopy={handleCopyMeal}
      />

      <AnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        mealPlan={mealPlan}
        userProfile={userProfile}
        trainingPlan={trainingPlan}
      />

      <MealPrepModal
        isOpen={showMealPrepModal}
        onClose={() => setShowMealPrepModal(false)}
        onApply={onUpdate}
        onSaveMeal={onSaveMeal}
        userProfile={userProfile}
        foodPreferences={foodPreferences}
        isGuest={isGuest}
      />

      <LogMealModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onLog={handleLogMeal}
        defaultDay={logMealDefaults.day}
        defaultMealType={logMealDefaults.mealType}
        savedMeals={savedMeals}              // Add
        onUseSavedMeal={onUseSavedMeal}      // Add
        onDeleteSavedMeal={onDeleteSavedMeal} // Add
        isGuest={isGuest}                     // Add
      />

      <ServingsPickerModal
        isOpen={showServingsPicker}
        onClose={() => setShowServingsPicker(false)}
        onConfirm={handleServingsConfirm}
        mealName={recipeContext.day && recipeContext.mealType ? mealPlan?.[recipeContext.day]?.[recipeContext.mealType] : ''}
      />
    </div>
  );
};

const MealCard = ({ 
  day, 
  mealType, 
  meal, 
  rating,
  onUpdate, 
  onRate,
  onRegenerate, 
  onGetRecipe,
  onCopy,
  onLogClick,
  loadingRecipe,
  onSaveMeal,
  isMealSaved,
  isGuest
}) => {
  const isLoadingRecipe = loadingRecipe?.day === day && loadingRecipe?.mealType === mealType;
  const isSaved = isMealSaved?.(mealType, meal);
  const isGenerating = meal === '__generating__';

  const handleSave = async () => {
    if (!meal || isGuest) return;
    await onSaveMeal(mealType, meal);
  };

  // Show loading spinner while generating
  if (isGenerating) {
    return (
      <div className="space-y-3 p-4 rounded-lg bg-gray-50 border-l-4 border-primary shadow-sm">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-semibold text-gray-700 capitalize">
            {mealType}
          </label>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-sm text-gray-600">Generating {mealType}...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 rounded-lg bg-gray-50 border-l-4 border-primary shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-semibold text-gray-700 capitalize">
          {mealType}
        </label>
        <div className="flex gap-1">
          {meal ? (
            <>
              {/* Save/Heart Button */}
              {!isGuest && (
                <Tooltip text={isSaved ? "Saved!" : "Save meal"}>
                  <button
                    onClick={handleSave}
                    disabled={isSaved}
                    className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                      isSaved
                        ? 'bg-red-100 text-red-500 cursor-default'
                        : 'bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-3 h-3 ${isSaved ? 'fill-red-500' : ''}`} />
                  </button>
                </Tooltip>
              )}

              <Tooltip text="Copy meal">
                <button
                  onClick={() => onCopy(day, mealType, meal)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600 flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </Tooltip>

              <Tooltip text="Regenerate meal">
                <button
                  onClick={() => onRegenerate(day, mealType)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </Tooltip>
            </>
          ) : (
            <Tooltip text="Log what you ate">
              <button
                onClick={() => onLogClick(day, mealType)}
                className="text-xs bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded text-primary flex items-center gap-1 transition-colors"
              >
                <UtensilsCrossed className="w-3 h-3" />
                Log
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      <textarea
        value={meal || ''}
        onChange={(e) => onUpdate(day, mealType, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
        rows="3"
        placeholder={`Enter ${mealType}...`}
      />

      {meal && (
        <>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => onRate(day, mealType, star)}
                className="focus:outline-none hover:scale-110 transition-transform"
              >
                <Star
                  className={`w-5 h-5 ${
                    star <= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="text-xs text-gray-600 ml-2 font-medium">
                ({rating}/5)
              </span>
            )}
          </div>

          <button
            onClick={() => onGetRecipe(day, mealType)}
            disabled={isLoadingRecipe}
            className={`w-full text-sm px-3 py-2 rounded-md font-medium transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2 ${
              isLoadingRecipe
                ? 'bg-yellow-200 text-yellow-800 cursor-wait'
                : 'bg-yellow-100 hover:bg-yellow-200 text-gray-900'
            }`}
          >
            {isLoadingRecipe ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-yellow-800 border-t-transparent rounded-full" />
                Loading recipe...
              </>
            ) : (
              'Get Recipe'
            )}
          </button>
        </>
      )}
    </div>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default MealPlanPage;
