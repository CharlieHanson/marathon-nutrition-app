import React, { useState } from 'react';
import { Card } from '../src/components/shared/Card';
import { Button } from '../src/components/shared/Button';
import { Input } from '../src/components/shared/Input';
import { Select } from '../src/components/shared/Select';
import { Save, Lock } from 'lucide-react';

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

export const ProfilePage = ({ profile, onUpdate, onSave, isSaving, isGuest }) => {
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  const handleSave = async () => {
    const { error } = await onSave();
    if (!error) {
      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 3000);
    } else {
      alert('Failed to save profile');
    }
  };

  return (
    <div className="space-y-6">
      <Card
        title="User Profile"
        subtitle="Tell us about yourself so we can personalize your nutrition plan."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <Input
            label="Name"
            type="text"
            placeholder="e.g., John Doe"
            value={profile.name}
            onChange={(e) => onUpdate('name', e.target.value)}
            disabled={isGuest}
          />

          {/* Age */}
          <Input
            label="Age"
            type="number"
            placeholder="e.g., 25"
            value={profile.age}
            onChange={(e) => onUpdate('age', e.target.value)}
            helperText="Used to calculate optimal calorie needs"
            disabled={isGuest}
          />

          {/* Height */}
          <Input
            label="Height"
            type="text"
            placeholder="e.g., 5'8&quot; or 173cm"
            value={profile.height}
            onChange={(e) => onUpdate('height', e.target.value)}
            disabled={isGuest}
          />

          {/* Weight */}
          <Input
            label="Weight"
            type="text"
            placeholder="e.g., 150 lbs or 68 kg"
            value={profile.weight}
            onChange={(e) => onUpdate('weight', e.target.value)}
            disabled={isGuest}
          />

          {/* Weight Goal */}
          <Select
            label="Weight Goal"
            value={profile.goal}
            onChange={(e) => onUpdate('goal', e.target.value)}
            options={GOAL_OPTIONS}
            placeholder="Select goal"
            disabled={isGuest}
          />

          {/* Activity Level (outside training) */}
          <Select
            label="Activity Level (outside training)"
            value={profile.activityLevel}
            onChange={(e) => onUpdate('activityLevel', e.target.value)}
            options={ACTIVITY_LEVEL_OPTIONS}
            placeholder="Select level"
            helperText="Your daily activity excluding structured workouts"
            disabled={isGuest}
          />

          {/* Objective - FULL WIDTH */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Training Objective
            </label>
            <textarea
              placeholder="e.g., Training for first marathon in 6 months, improve 5K time, build endurance for trail running..."
              value={profile.objective}
              onChange={(e) => onUpdate('objective', e.target.value)}
              disabled={isGuest}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                isGuest ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              rows="3"
            />
            <p className="mt-1 text-sm text-gray-500">
              Describe your primary training goal or objective
            </p>
          </div>

          {/* Dietary Restrictions - FULL WIDTH */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Restrictions
            </label>
            <textarea
              placeholder="e.g., vegetarian, gluten-free, nut allergies, lactose intolerant..."
              value={profile.dietaryRestrictions}
              onChange={(e) => onUpdate('dietaryRestrictions', e.target.value)}
              disabled={isGuest}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                isGuest ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              rows="3"
            />
            <p className="mt-1 text-sm text-gray-500">
              Any foods you must avoid due to allergies, intolerances, or dietary choices
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          {!isGuest ? (
            <>
              <Button onClick={handleSave} disabled={isSaving} icon={Save}>
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>

              {showSaveConfirmation && (
                <div className="px-4 py-2 bg-green-50 border border-green-500 rounded-md text-green-700 flex items-center gap-2 animate-fade-in">
                  <span className="text-lg">✓</span>
                  <span className="font-medium">Profile saved successfully!</span>
                </div>
              )}
            </>
          ) : (
            <div className="w-full p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900">Guest Mode</p>
                <p className="text-sm text-amber-700 mt-1">
                  You're browsing in guest mode. Create an account or sign in to save your profile and access all features.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Profile Completion Card - only show if not guest */}
      {!isGuest && <ProfileCompletionCard profile={profile} />}
    </div>
  );
};

// Optional: Show users how complete their profile is
const ProfileCompletionCard = ({ profile }) => {
  const requiredFields = [
    'name',
    'age',
    'height',
    'weight',
    'goal',
    'activityLevel',
    'objective',
  ];

  const filledFields = requiredFields.filter(
    (field) => profile[field] && profile[field].toString().trim() !== ''
  );

  const completionPercentage = Math.round(
    (filledFields.length / requiredFields.length) * 100
  );

  if (completionPercentage === 100) {
    return null; // Don't show if profile is complete
  }

  return (
    <Card className="bg-blue-50 border border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-blue-900">
            Profile Completion: {completionPercentage}%
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            Complete your profile for more personalized meal plans
          </p>
        </div>
        <div className="text-3xl font-bold text-blue-600">
          {completionPercentage}%
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4 bg-blue-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-600 h-full transition-all duration-500"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Missing Fields */}
      {completionPercentage < 100 && (
        <div className="mt-3">
          <p className="text-xs text-blue-700 font-medium">Missing fields:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {requiredFields
              .filter(
                (field) =>
                  !profile[field] || profile[field].toString().trim() === ''
              )
              .map((field) => (
                <span
                  key={field}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                >
                  {field
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())}
                </span>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default ProfilePage;