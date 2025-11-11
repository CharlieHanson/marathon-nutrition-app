import React from 'react';

export const MealCardSkeleton = () => (
  <div className="space-y-3 p-4 rounded-lg bg-gray-50 border-l-4 border-gray-300 shadow-sm animate-pulse">
    {/* Meal type label */}
    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
    
    {/* Textarea placeholder */}
    <div className="h-20 bg-gray-300 rounded"></div>
    
    {/* Star rating placeholder */}
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="w-5 h-5 bg-gray-300 rounded-full"></div>
      ))}
    </div>
    
    {/* Get Recipe button placeholder */}
    <div className="h-9 bg-gray-300 rounded-md"></div>
  </div>
);

export const DayCardSkeleton = () => (
  <div className="border rounded-lg p-6 shadow-md animate-pulse">
    {/* Day header */}
    <div className="flex justify-between items-center mb-4">
      <div className="h-6 bg-gray-300 rounded w-24"></div>
      <div className="flex gap-2">
        <div className="h-6 w-20 bg-gray-300 rounded-full"></div>
        <div className="h-6 w-20 bg-gray-300 rounded-full"></div>
        <div className="h-6 w-20 bg-gray-300 rounded-full"></div>
        <div className="h-6 w-20 bg-gray-300 rounded-full"></div>
      </div>
    </div>

    {/* Main Meals (3 cards) */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <MealCardSkeleton />
      <MealCardSkeleton />
      <MealCardSkeleton />
    </div>

    {/* Snacks & Dessert (2 cards) */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <MealCardSkeleton />
      <MealCardSkeleton />
    </div>
  </div>
);

export const MealPlanSkeleton = () => (
  <div className="space-y-8">
    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
      <DayCardSkeleton key={i} />
    ))}
  </div>
);