// src/components/modals/AnalyticsModal.js
import React from 'react';
import { X, TrendingUp, Flame, Dumbbell, Beef, Wheat, Droplet } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks', 'dessert'];

// Extract macros from meal string
const extractMacros = (mealString) => {
  if (!mealString || typeof mealString !== 'string') {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
  
  const get = (re) => {
    const m = mealString.match(re);
    return m ? Number(m[1]) : 0;
  };
  
  return {
    calories: get(/Cal:\s*(\d+)/i),
    protein: get(/P:\s*(\d+)\s*g/i),
    carbs: get(/C:\s*(\d+)\s*g/i),
    fat: get(/F:\s*(\d+)\s*g/i),
  };
};

// Calculate day totals
const calculateDayMacros = (dayMeals) => {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  MEAL_TYPES.forEach(mealType => {
    const meal = dayMeals?.[mealType];
    if (meal && typeof meal === 'string') {
      const macros = extractMacros(meal);
      totals.calories += macros.calories;
      totals.protein += macros.protein;
      totals.carbs += macros.carbs;
      totals.fat += macros.fat;
    }
  });
  
  return totals;
};

// Calculate week totals and averages
const calculateWeekStats = (mealPlan) => {
  const dayStats = [];
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let daysWithData = 0;

  DAYS.forEach(day => {
    const dayMacros = calculateDayMacros(mealPlan?.[day]);
    dayStats.push({
      day: day.slice(0, 3).charAt(0).toUpperCase() + day.slice(1, 3),
      fullDay: day,
      ...dayMacros,
      hasData: dayMacros.calories > 0
    });

    if (dayMacros.calories > 0) {
      totalCalories += dayMacros.calories;
      totalProtein += dayMacros.protein;
      totalCarbs += dayMacros.carbs;
      totalFat += dayMacros.fat;
      daysWithData++;
    }
  });

  return {
    dayStats,
    totals: { calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fat: totalFat },
    averages: {
      calories: daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0,
      protein: daysWithData > 0 ? Math.round(totalProtein / daysWithData) : 0,
      carbs: daysWithData > 0 ? Math.round(totalCarbs / daysWithData) : 0,
      fat: daysWithData > 0 ? Math.round(totalFat / daysWithData) : 0,
    },
    daysWithData
  };
};

export const AnalyticsModal = ({ 
  isOpen, 
  onClose, 
  mealPlan,
  userProfile,
  trainingPlan
}) => {
  if (!isOpen) return null;

  const { dayStats, totals, averages, daysWithData } = calculateWeekStats(mealPlan);
  
  // Macro distribution for pie chart (calories from each macro)
  const macroDistribution = [
    { name: 'Protein', value: averages.protein * 4, grams: averages.protein, color: '#22c55e' },
    { name: 'Carbs', value: averages.carbs * 4, grams: averages.carbs, color: '#3b82f6' },
    { name: 'Fat', value: averages.fat * 9, grams: averages.fat, color: '#a855f7' },
  ];
  
  const totalMacroCalories = macroDistribution.reduce((sum, m) => sum + m.value, 0);
  
  // Training intensity correlation
  const getTrainingInsight = () => {
    if (!trainingPlan) return null;
    
    let highIntensityDays = [];
    let restDays = [];
    
    DAYS.forEach(day => {
      const workout = trainingPlan[day];
      const dayMacros = dayStats.find(d => d.fullDay === day);
      
      if (!dayMacros?.hasData) return;
      
      const intensity = workout?.intensity || 5;
      if (intensity >= 7) {
        highIntensityDays.push(dayMacros.calories);
      } else if (intensity <= 3 || workout?.type?.toLowerCase() === 'rest') {
        restDays.push(dayMacros.calories);
      }
    });
    
    const avgHigh = highIntensityDays.length > 0 
      ? Math.round(highIntensityDays.reduce((a, b) => a + b, 0) / highIntensityDays.length)
      : null;
    const avgRest = restDays.length > 0
      ? Math.round(restDays.reduce((a, b) => a + b, 0) / restDays.length)
      : null;
    
    return { avgHigh, avgRest, highCount: highIntensityDays.length, restCount: restDays.length };
  };
  
  const trainingInsight = getTrainingInsight();

  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border text-sm">
          <p className="font-semibold capitalize">{data.fullDay}</p>
          <p className="text-orange-600">{data.calories} cal</p>
          <p className="text-green-600">{data.protein}g protein</p>
          <p className="text-blue-600">{data.carbs}g carbs</p>
          <p className="text-purple-600">{data.fat}g fat</p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.1) return null; // Don't show label if slice is too small

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Weekly Analytics
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-6">
          {daysWithData === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No meal data yet</p>
              <p className="text-sm mt-1">Generate or log some meals to see analytics</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Daily Averages ({daysWithData} days)</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-orange-600">{averages.calories}</p>
                    <p className="text-xs text-orange-700">calories</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <Beef className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-600">{averages.protein}g</p>
                    <p className="text-xs text-green-700">protein</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <Wheat className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-600">{averages.carbs}g</p>
                    <p className="text-xs text-blue-700">carbs</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <Droplet className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-purple-600">{averages.fat}g</p>
                    <p className="text-xs text-purple-700">fat</p>
                  </div>
                </div>
              </div>

              {/* Daily Calories Bar Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Daily Calories</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayStats} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} width={40} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                        {dayStats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.hasData ? '#f97316' : '#e5e7eb'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Macro Distribution */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Macro Distribution</h4>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="h-52 w-52 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={macroDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          dataKey="value"
                          labelLine={false}
                          label={renderCustomLabel}
                        >
                          {macroDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                    {macroDistribution.map((macro) => (
                      <div key={macro.name} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: macro.color }} />
                          <span className="text-sm text-gray-700 font-medium">{macro.name}</span>
                        </span>
                        <span className="text-sm">
                          <span className="font-semibold">{macro.grams}g</span>
                          <span className="text-gray-500 ml-1">
                            ({totalMacroCalories > 0 ? Math.round((macro.value / totalMacroCalories) * 100) : 0}%)
                          </span>
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 border-t text-xs text-gray-500">
                      Based on calories: Protein & Carbs = 4 cal/g, Fat = 9 cal/g
                    </div>
                  </div>
                </div>
              </div>

              {/* Training Sync Insight */}
              {trainingInsight && (trainingInsight.avgHigh || trainingInsight.avgRest) && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Dumbbell className="w-4 h-4" />
                    Training & Nutrition Sync
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {trainingInsight.avgHigh && (
                      <div>
                        <p className="text-gray-500">High intensity days</p>
                        <p className="font-semibold text-lg">{trainingInsight.avgHigh} cal</p>
                        <p className="text-xs text-gray-400">{trainingInsight.highCount} day(s)</p>
                      </div>
                    )}
                    {trainingInsight.avgRest && (
                      <div>
                        <p className="text-gray-500">Rest days</p>
                        <p className="font-semibold text-lg">{trainingInsight.avgRest} cal</p>
                        <p className="text-xs text-gray-400">{trainingInsight.restCount} day(s)</p>
                      </div>
                    )}
                  </div>
                  {trainingInsight.avgHigh && trainingInsight.avgRest && (
                    <p className="text-xs text-gray-500 mt-2">
                      {trainingInsight.avgHigh > trainingInsight.avgRest
                        ? '✓ Good! Eating more on training days.'
                        : '⚠️ Consider eating more on high intensity days.'}
                    </p>
                  )}
                </div>
              )}

              {/* Week Totals */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Week Totals</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Calories</span>
                    <span className="font-semibold">{totals.calories.toLocaleString()} cal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Protein</span>
                    <span className="font-semibold">{totals.protein}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Carbs</span>
                    <span className="font-semibold">{totals.carbs}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Fat</span>
                    <span className="font-semibold">{totals.fat}g</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};