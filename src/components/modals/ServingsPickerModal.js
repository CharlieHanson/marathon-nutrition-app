import React, { useState } from 'react';

export const ServingsPickerModal = ({ isOpen, onClose, onConfirm, mealName }) => {
  const [selectedServings, setSelectedServings] = useState(1);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedServings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
          How many servings?
        </h3>
        
        {mealName && (
          <p className="text-sm text-gray-600 mb-6 text-center line-clamp-2">
            {mealName}
          </p>
        )}

        <div className="grid grid-cols-6 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              onClick={() => setSelectedServings(num)}
              className={`
                aspect-square rounded-xl border-2 font-bold text-lg
                transition-all duration-200 hover:scale-105
                ${
                  selectedServings === num
                    ? 'bg-primary border-primary text-white shadow-md'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-primary/50'
                }
              `}
            >
              {num}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg"
          >
            Generate Recipe
          </button>
        </div>
      </div>
    </div>
  );
};
