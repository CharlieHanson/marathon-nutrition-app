import React from 'react';
import { Calendar, Utensils, CheckCircle, User } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'training', label: 'Training Plan', icon: Calendar },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Food Preferences', icon: CheckCircle },
  { id: 'meals', label: 'Meal Plan', icon: Utensils },
];

export const Navigation = ({ currentView, onViewChange }) => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                currentView === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 inline mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};