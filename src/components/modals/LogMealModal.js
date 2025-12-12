// src/components/modals/LogMealModal.js
import React, { useState } from 'react';
import { X, UtensilsCrossed, Check, Loader2 } from 'lucide-react';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks', 'dessert'];

export const LogMealModal = ({ isOpen, onClose, onLog, defaultDay, defaultMealType }) => {
  const [mealDescription, setMealDescription] = useState('');
  const [selectedDay, setSelectedDay] = useState(defaultDay || 'monday');
  const [selectedMealType, setSelectedMealType] = useState(defaultMealType || 'lunch');
  const [isEstimating, setIsEstimating] = useState(false);
  const [logged, setLogged] = useState(false);
  const [estimatedMacros, setEstimatedMacros] = useState(null);

  if (!isOpen) return null;

  const handleEstimateMacros = async () => {
    if (!mealDescription.trim()) return;
    
    setIsEstimating(true);
    setEstimatedMacros(null);

    try {
      const response = await fetch('/api/estimate-macros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal: mealDescription.trim(),
          mealType: selectedMealType,
        }),
      });

      const result = await response.json();

      if (result.success && result.macros) {
        setEstimatedMacros(result.macros);
      }
    } catch (error) {
      console.error('Failed to estimate macros:', error);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleLog = async () => {
    if (!mealDescription.trim()) return;
    
    setIsEstimating(true);

    try {
      // Get macros before logging
      const response = await fetch('/api/estimate-macros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal: mealDescription.trim(),
          mealType: selectedMealType,
        }),
      });

      const result = await response.json();
      
      // Use meal with macros if available, otherwise just the description
      const finalMeal = result.success ? result.meal : mealDescription.trim();
      
      onLog(selectedDay, selectedMealType, finalMeal);
      
      setLogged(true);
      setTimeout(() => {
        setLogged(false);
        setMealDescription('');
        setEstimatedMacros(null);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Failed to log meal:', error);
      // Still log the meal without macros
      onLog(selectedDay, selectedMealType, mealDescription.trim());
      setLogged(true);
      setTimeout(() => {
        setLogged(false);
        setMealDescription('');
        onClose();
      }, 1000);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleClose = () => {
    setMealDescription('');
    setLogged(false);
    setEstimatedMacros(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-primary" />
            Log Meal
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Day Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Which day?
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`p-2 rounded-lg text-xs font-medium transition-colors capitalize ${
                    selectedDay === day
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Meal Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Which meal?
            </label>
            <div className="grid grid-cols-5 gap-2">
              {MEAL_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedMealType(type);
                    setEstimatedMacros(null); // Reset macros when meal type changes
                  }}
                  className={`p-2 rounded-lg text-xs font-medium transition-colors capitalize ${
                    selectedMealType === type
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {type === 'snacks' ? 'Snack' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Meal Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What did you eat?
            </label>
            <textarea
              value={mealDescription}
              onChange={(e) => {
                setMealDescription(e.target.value);
                setEstimatedMacros(null); // Reset macros when description changes
              }}
              placeholder="e.g., Grilled chicken salad with olive oil dressing, side of brown rice..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Be descriptive for better macro estimates
            </p>
          </div>

          {/* Estimate Macros Button */}
          {mealDescription.trim() && !estimatedMacros && (
            <button
              onClick={handleEstimateMacros}
              disabled={isEstimating}
              className="w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
            >
              {isEstimating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Estimating...
                </>
              ) : (
                'Preview Macro Estimate'
              )}
            </button>
          )}

          {/* Macro Preview */}
          {estimatedMacros && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-2">Estimated Macros:</p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                  Cal: {estimatedMacros.calories}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                  P: {estimatedMacros.protein}g
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  C: {estimatedMacros.carbs}g
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                  F: {estimatedMacros.fat}g
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleLog}
            disabled={!mealDescription.trim() || logged || isEstimating}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              logged
                ? 'bg-green-500 text-white'
                : !mealDescription.trim() || isEstimating
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            {logged ? (
              <>
                <Check className="w-4 h-4" />
                Logged!
              </>
            ) : isEstimating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Estimating macros...
              </>
            ) : (
              <>
                <UtensilsCrossed className="w-4 h-4" />
                Log Meal
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};