import React, { useState } from 'react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { Save, Lock } from 'lucide-react';

export const FoodPreferencesPage = ({ 
  preferences, 
  onUpdate, 
  onSave, 
  isSaving,
  isGuest 
}) => {
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  const handleSave = async () => {
    const { error } = await onSave();
    if (!error) {
      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 3000);
    } else {
      alert('Failed to save preferences');
    }
  };

  return (
    <div className="space-y-6">
      <Card
        title="Food Preferences"
        subtitle="Describe your food preferences to personalize your meal suggestions."
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foods I Like
            </label>
            <textarea
              placeholder="e.g., chicken, salmon, quinoa, berries, Greek yogurt, avocado..."
              value={preferences.likes}
              onChange={(e) => onUpdate('likes', e.target.value)}
              disabled={isGuest}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                isGuest ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              rows="4"
            />
            <p className="mt-1 text-sm text-gray-500">
              List foods you enjoy eating, separated by commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foods I Dislike
            </label>
            <textarea
              placeholder="e.g., seafood, mushrooms, spicy food, dairy..."
              value={preferences.dislikes}
              onChange={(e) => onUpdate('dislikes', e.target.value)}
              disabled={isGuest}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                isGuest ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              rows="4"
            />
            <p className="mt-1 text-sm text-gray-500">
              List foods you want to avoid, separated by commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favorite Cuisines
            </label>
            <textarea
              placeholder="e.g., Mediterranean, Asian, Mexican, Italian..."
              value={preferences.cuisineFavorites}
              onChange={(e) => onUpdate('cuisineFavorites', e.target.value)}
              disabled={isGuest}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                isGuest ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              rows="3"
            />
            <p className="mt-1 text-sm text-gray-500">
              Types of cuisine you prefer for variety in your meal plan
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          {!isGuest ? (
            <>
              <Button onClick={handleSave} disabled={isSaving} icon={Save}>
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </Button>

              {showSaveConfirmation && (
                <div className="px-4 py-2 bg-green-50 border border-green-500 rounded-md text-green-700 flex items-center gap-2">
                  <span>✓</span>
                  <span>Preferences saved successfully!</span>
                </div>
              )}
            </>
          ) : (
            <div className="w-full p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900">Guest Mode</p>
                <p className="text-sm text-amber-700 mt-1">
                  You're browsing in guest mode. Create an account or sign in to save your preferences and get personalized meal plans.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};