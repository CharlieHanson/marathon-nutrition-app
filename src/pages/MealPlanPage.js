import React, { useState } from 'react';
import { Plus, RotateCcw, Star, ShoppingCart } from 'lucide-react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { RecipeModal } from '../components/modals/RecipeModal';
import { GroceryModal } from '../components/modals/GroceryModal';
import { calculateDayMacros } from '../services/mealService';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks', 'dessert'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const MealPlanPage = ({ 
  mealPlan, 
  onUpdate, 
  onRate,
  onGenerate, 
  onRegenerate, 
  isGenerating,
  statusMessage,
  userProfile,
  foodPreferences,
  trainingPlan
}) => {
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState('');
  const [recipeTitle, setRecipeTitle] = useState('');
  
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [groceryList, setGroceryList] = useState([]);
  
  const [localStatusMessage, setLocalStatusMessage] = useState('');

  // Use either the passed statusMessage or local one
  const displayMessage = statusMessage || localStatusMessage;

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

  const getRecipe = async (day, mealType) => {
    setLocalStatusMessage(`Getting recipe for ${mealPlan[day][mealType]}...`);

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

    setTimeout(() => setLocalStatusMessage(''), 3000);
  };

  const generateGroceryList = async () => {
    setLocalStatusMessage('🔄 Generating grocery list...');

    try {
      const allMeals = [];
      
      // Iterate through each day and meal type
      Object.entries(mealPlan).forEach(([day, meals]) => {
        Object.entries(meals).forEach(([mealType, meal]) => {
          // Skip if:
          // - meal is empty/null/undefined
          // - meal is not a string (could be a number for ratings)
          // - mealType contains '_rating' (that's a rating field, not a meal)
          // - meal string is empty after trimming
          if (!meal || 
              typeof meal !== 'string' || 
              mealType.includes('_rating') || 
              meal.trim() === '') {
            return;
          }
          allMeals.push(meal);
        });
      });

      console.log('📋 Meals being sent for grocery list:', allMeals);

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
      console.error('❌ Grocery list generation error:', error);
      setLocalStatusMessage(`❌ Error: ${error.message}`);
    }

    setTimeout(() => setLocalStatusMessage(''), 5000);
  };

  const hasMeals = Object.values(mealPlan).some(day =>
    Object.entries(day).some(([mealType, meal]) => 
      !mealType.includes('_rating') && 
      meal && 
      typeof meal === 'string' && 
      meal.trim()
    )
  );

  return (
    <div className="space-y-6">
      <Card
        title="Weekly Meal Plan"
        headerAction={
          <div className="flex gap-2">
            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              icon={Plus}
              size="sm"
            >
              {isGenerating ? 'Generating...' : 'Generate Meals'}
            </Button>
            {hasMeals && (
              <Button
                onClick={generateGroceryList}
                variant="secondary"
                icon={ShoppingCart}
                size="sm"
              >
                Grocery List
              </Button>
            )}
          </div>
        }
      >
        {displayMessage && (
          <div className={`mb-4 p-4 rounded-lg border ${
            displayMessage.includes('✅') 
              ? 'bg-green-50 border-green-500 text-green-800'
              : displayMessage.includes('❌')
              ? 'bg-red-50 border-red-500 text-red-800'
              : 'bg-blue-50 border-blue-500 text-blue-800'
          }`}>
            <div className="flex items-center gap-2">
              {displayMessage.includes('🔄') && (
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              )}
              <span className="font-medium">{displayMessage}</span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {DAYS.map((day) => {
            const dayMacros = calculateDayMacros(mealPlan[day]);
            
            return (
              <div key={day} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900 capitalize">
                    {day}
                  </h3>
                  
                  {/* Daily Macro Summary */}
                  {dayMacros.hasData && (
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-600">
                        <span className="font-medium">Cal:</span> {dayMacros.calories}
                      </span>
                      <span className="text-gray-600">
                        <span className="font-medium">P:</span> {dayMacros.protein}g
                      </span>
                      <span className="text-gray-600">
                        <span className="font-medium">C:</span> {dayMacros.carbs}g
                      </span>
                      <span className="text-gray-600">
                        <span className="font-medium">F:</span> {dayMacros.fat}g
                      </span>
                    </div>
                  )}
                </div>

                {/* Main Meals */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                    />
                  ))}
                </div>

                {/* Snacks & Dessert */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

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
    </div>
  );
};

// Meal Card Component
const MealCard = ({ 
  day, 
  mealType, 
  meal, 
  rating,
  onUpdate, 
  onRate,
  onRegenerate, 
  onGetRecipe 
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700 capitalize">
          {mealType}
        </label>
        {meal && (
          <button
            onClick={() => onRegenerate(day, mealType)}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600 flex items-center gap-1"
            title="Regenerate this meal"
          >
            <RotateCcw className="w-3 h-3" />
            Regenerate
          </button>
        )}
      </div>

      <textarea
        value={meal || ''}
        onChange={(e) => onUpdate(day, mealType, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        rows="3"
        placeholder={`Enter ${mealType}...`}
      />

      {meal && (
        <>
          {/* Star Rating */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => onRate(day, mealType, star)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-4 h-4 ${
                    star <= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="text-xs text-gray-600 ml-2">
                ({rating}/5)
              </span>
            )}
          </div>

          {/* Get Recipe Button */}
          <button
            onClick={() => onGetRecipe(day, mealType)}
            className="w-full text-xs bg-yellow-100 hover:bg-yellow-200 px-2 py-1 rounded text-gray-900 font-medium"
          >
            Get Recipe
          </button>
        </>
      )}
    </div>
  );
};