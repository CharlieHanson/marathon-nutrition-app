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

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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
    setLoadingRecipe({ day, mealType }); // Add this line
    setLocalStatusMessage(`🔄 Getting recipe for ${mealPlan[day][mealType]}...`);

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
        setLocalStatusMessage('✅ Recipe generated!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setLocalStatusMessage(`❌ Error getting recipe: ${error.message}`);
    }

    setLoadingRecipe(null); // Add this line
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

  const handleSave = async () => {
    if (!meal || isGuest) return;
    await onSaveMeal(mealType, meal);
  };

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
