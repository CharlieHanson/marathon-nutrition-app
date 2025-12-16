// src/components/modals/MealPrepModal.js
import React, { useState } from 'react';
import { X, ChefHat, Check, Loader2, Clock, Refrigerator, ChevronLeft, Heart } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

export const MealPrepModal = ({ 
  isOpen, 
  onClose, 
  onApply,
  onSaveMeal,
  userProfile,
  foodPreferences,
  isGuest
}) => {
  const [step, setStep] = useState(1); // 1: meal type, 2: days, 3: options
  const [selectedMealType, setSelectedMealType] = useState('lunch');
  const [selectedDays, setSelectedDays] = useState([]);
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);
  const [saveToFavorites, setSaveToFavorites] = useState(false);

  if (!isOpen) return null;

  const toggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const selectWeekdays = () => {
    setSelectedDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  };

  const selectAll = () => {
    setSelectedDays([...DAYS]);
  };

  const handleGenerateOptions = async () => {
    if (selectedDays.length === 0) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-meal-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType: selectedMealType,
          days: selectedDays,
          userProfile,
          foodPreferences,
        }),
      });

      const result = await response.json();

      if (result.success && result.options?.length > 0) {
        setOptions(result.options);
        setStep(3);
      } else {
        throw new Error(result.error || 'Failed to generate options');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = async (option) => {
    // Apply to all selected days
    selectedDays.forEach(day => {
      onApply(day, selectedMealType, option.fullDescription);
    });

    // Save to favorites if checked
    if (saveToFavorites && onSaveMeal && !isGuest) {
      await onSaveMeal(selectedMealType, option.fullDescription);
    }

    setApplied(true);
    setTimeout(() => {
      handleClose();
    }, 1000);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedMealType('lunch');
    setSelectedDays([]);
    setOptions([]);
    setError('');
    setApplied(false);
    setSaveToFavorites(false);
    onClose();
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-primary/10 to-orange-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            Meal Prep Mode
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                  step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mb-4">
            <span>Meal Type</span>
            <span>Days</span>
            <span>Choose</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* Step 1: Select Meal Type */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Which meal do you want to prep?</p>
              <div className="grid grid-cols-3 gap-3">
                {MEAL_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedMealType(type)}
                    className={`p-4 rounded-lg border-2 font-medium capitalize transition-all ${
                      selectedMealType === type
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors mt-4"
              >
                Next: Select Days
              </button>
            </div>
          )}

          {/* Step 2: Select Days */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Which days will you eat this prepped <span className="font-medium">{selectedMealType}</span>?
              </p>

              <div className="flex gap-2 mb-3">
                <button
                  onClick={selectWeekdays}
                  className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  Weekdays
                </button>
                <button
                  onClick={selectAll}
                  className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  All Week
                </button>
                <button
                  onClick={() => setSelectedDays([])}
                  className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  Clear
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`p-3 rounded-lg font-medium capitalize transition-all ${
                      selectedDays.includes(day)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleBack}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={handleGenerateOptions}
                  disabled={selectedDays.length === 0 || isLoading}
                  className="flex-1 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    `Generate Options (${selectedDays.length} days)`
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Choose Option */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Choose a meal prep option for <span className="font-medium">{selectedMealType}</span> on{' '}
                <span className="font-medium">{selectedDays.length} days</span>:
              </p>

              <div className="space-y-3">
                {options.map((option, idx) => (
                  <div
                    key={idx}
                    className="p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => !applied && handleSelectOption(option)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                          {option.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                        
                        {/* Macros */}
                        {option.macros && (
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                              {option.macros.calories} cal
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                              {option.macros.protein}g P
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {option.macros.carbs}g C
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                              {option.macros.fat}g F
                            </span>
                          </div>
                        )}

                        {/* Prep info */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {option.prepTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Refrigerator className="w-3 h-3" />
                            {option.prepReason}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectOption(option);
                        }}
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Save to favorites checkbox */}
              {!isGuest && onSaveMeal && (
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveToFavorites}
                    onChange={(e) => setSaveToFavorites(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Heart className="w-4 h-4" />
                  Save selected meal to favorites
                </label>
              )}

              {applied && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">
                    Applied to {selectedDays.length} days!
                  </span>
                </div>
              )}

              <button
                onClick={handleBack}
                disabled={applied}
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Days
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};