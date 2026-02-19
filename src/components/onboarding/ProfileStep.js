// src/components/onboarding/ProfileStep.js
import React from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Select } from '../shared/Select';
import { Card } from '../shared/Card';

const GOAL_OPTIONS = [
  { value: 'lose', label: 'Lose weight' },
  { value: 'maintain', label: 'Maintain weight' },
  { value: 'gain', label: 'Gain weight' },
];

const ACTIVITY_LEVEL_OPTIONS = [
  { value: 'low', label: 'Low (desk job, minimal activity)' },
  { value: 'moderate', label: 'Moderate (some walking, active lifestyle)' },
  { value: 'high', label: 'High (active job, lots of movement)' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other / Prefer not to say' },
];

export const ProfileStep = ({ profile, onUpdate, onNext, onBack, isSaving }) => {
  const isValid = profile.name && profile.age && profile.height && profile.weight && profile.goal;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Tell us about yourself
          </h2>
          <p className="text-gray-600">
            This helps us personalize your nutrition plan
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <Input
            label="Name"
            type="text"
            value={profile.name}
            onChange={(e) => onUpdate('name', e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Age"
              type="number"
              placeholder="e.g., 25"
              value={profile.age}
              onChange={(e) => onUpdate('age', e.target.value)}
              required
            />

            <Select
              label="Gender"
              value={profile.gender}
              onChange={(e) => onUpdate('gender', e.target.value)}
              options={GENDER_OPTIONS}
              placeholder="Select gender"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Height"
              type="text"
              placeholder="e.g., 5'8&quot; or 173cm"
              value={profile.height}
              onChange={(e) => onUpdate('height', e.target.value)}
              required
            />

            <Input
              label="Weight"
              type="text"
              placeholder="e.g., 150 lbs or 68 kg"
              value={profile.weight}
              onChange={(e) => onUpdate('weight', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Weight Goal"
              value={profile.goal}
              onChange={(e) => onUpdate('goal', e.target.value)}
              options={GOAL_OPTIONS}
              placeholder="Select goal"
              required
            />
          </div>

          <Select
            label="Activity Level (outside training)"
            value={profile.activityLevel}
            onChange={(e) => onUpdate('activityLevel', e.target.value)}
            options={ACTIVITY_LEVEL_OPTIONS}
            placeholder="Select level"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Training Objective (optional)
            </label>
            <textarea
              placeholder="e.g., Training for first marathon, improve 5K time..."
              value={profile.objective}
              onChange={(e) => onUpdate('objective', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Restrictions (optional)
            </label>
            <textarea
              placeholder="e.g., vegetarian, gluten-free, nut allergies..."
              value={profile.dietaryRestrictions}
              onChange={(e) => onUpdate('dietaryRestrictions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows="3"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onBack} variant="outline" className="flex-1">
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={!isValid || isSaving}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </Card>
    </div>
  );
};