import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const CopyMealModal = ({ isOpen, onClose, meal, mealType, currentDay, onCopy }) => {
  const [selectedDays, setSelectedDays] = useState([]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const toggleDay = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const selectAll = () => {
    setSelectedDays(DAYS.filter(d => d !== currentDay));
  };

  const selectWeekdays = () => {
    setSelectedDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].filter(d => d !== currentDay));
  };

  const handleCopy = () => {
    if (selectedDays.length === 0) return;
    
    selectedDays.forEach(day => {
      onCopy(day, mealType, meal);
    });
    
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setSelectedDays([]);
      onClose();
    }, 1000);
  };

  // Extract just the meal name (without macros) for display
  const mealName = meal?.replace(/\(Cal:.*?\).*$/, '').trim() || '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Copy className="w-5 h-5 text-primary" />
            Copy Meal
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Copying:</p>
            <p className="font-medium text-gray-900">{mealName}</p>
            <p className="text-xs text-gray-500 mt-1 capitalize">
              {currentDay}'s {mealType}
            </p>
          </div>

          <p className="text-sm font-medium text-gray-700 mb-3">Copy to which days?</p>
          
          <div className="flex gap-2 mb-3">
            <button
              onClick={selectAll}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Select All
            </button>
            <button
              onClick={selectWeekdays}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Weekdays
            </button>
            <button
              onClick={() => setSelectedDays([])}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                disabled={day === currentDay}
                className={`p-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  day === currentDay
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : selectedDays.includes(day)
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {day === currentDay ? `${day} (current)` : day}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            disabled={selectedDays.length === 0 || copied}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              copied
                ? 'bg-green-500 text-white'
                : selectedDays.length === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy to {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};