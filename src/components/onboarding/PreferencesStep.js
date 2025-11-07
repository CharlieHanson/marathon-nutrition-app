// src/components/onboarding/PreferencesStep.js
import React from 'react';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';

export const PreferencesStep = ({ preferences, onUpdate, onComplete, onBack, isSaving }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            What are your food preferences?
          </h2>
          <p className="text-gray-600">
            Help us personalize your meal suggestions
          </p>
        </div>

        <div className="space-y-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foods I Like
            </label>
            <textarea
              placeholder="e.g., chicken, salmon, quinoa, berries, Greek yogurt, avocado..."
              value={preferences.likes}
              onChange={(e) => onUpdate('likes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows="4"
            />
            <p className="mt-1 text-sm text-gray-500">
              List foods you enjoy, separated by commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foods I Dislike
            </label>
            <textarea
              placeholder="e.g., seafood, mushrooms, spicy food..."
              value={preferences.dislikes}
              onChange={(e) => onUpdate('dislikes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows="4"
            />
            <p className="mt-1 text-sm text-gray-500">
              List foods you want to avoid, separated by commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favorite Cuisines (optional)
            </label>
            <textarea
              placeholder="e.g., Mediterranean, Asian, Mexican, Italian..."
              value={preferences.cuisineFavorites}
              onChange={(e) => onUpdate('cuisineFavorites', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows="3"
            />
            <p className="mt-1 text-sm text-gray-500">
              Types of cuisine you prefer for variety
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onBack} variant="outline" className="flex-1">
            Back
          </Button>
          <Button
            onClick={onComplete}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Complete Setup'}
          </Button>
        </div>
      </Card>
    </div>
  );
};