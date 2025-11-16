import React, { useState } from 'react';
import { Card } from '../src/components/shared/Card';
import { Button } from '../src/components/shared/Button';
import { Input } from '../src/components/shared/Input';
import { Select } from '../src/components/shared/Select';
import { Save, Lock, User, Target, FileText, AlertCircle } from 'lucide-react';

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
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">
        User Profile
      </h2>
      
      <Card>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
              <p className="text-sm text-gray-600">Tell us about yourself so we can personalize your nutrition plan.</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <Input
            label="Name"
            type="text"
            placeholder="name"
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

        </div>

        {/* Training & Goals Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Training & Goals</h3>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Training Objective
            </label>
            <textarea
              placeholder="e.g., Training for first marathon in 6 months, improve 5K time, build endurance for trail running..."
              value={profile.objective}
              onChange={(e) => onUpdate('objective', e.target.value)}
              disabled={isGuest}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                isGuest ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-primary/50'
              }`}
              rows="3"
            />
            <p className="mt-2 text-sm text-gray-500">
              Describe your primary training goal or objective
            </p>
          </div>
        </div>

        {/* Dietary Preferences Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Dietary Preferences</h3>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Restrictions
            </label>
            <textarea
              placeholder="e.g., vegetarian, gluten-free, nut allergies, lactose intolerant..."
              value={profile.dietaryRestrictions}
              onChange={(e) => onUpdate('dietaryRestrictions', e.target.value)}
              disabled={isGuest}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                isGuest ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-primary/50'
              }`}
              rows="3"
            />
            <p className="mt-2 text-sm text-gray-500">
              Any foods you must avoid due to allergies, intolerances, or dietary choices
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          {!isGuest ? (
            <div className="flex items-center gap-4">
              <Button onClick={handleSave} disabled={isSaving} icon={Save} size="lg">
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>

              {showSaveConfirmation && (
                <div className="px-4 py-3 bg-green-50 border border-green-500 rounded-lg text-green-700 flex items-center gap-2 shadow-sm">
                  <span className="text-xl">✓</span>
                  <span className="font-medium">Profile saved successfully!</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-lg flex items-start gap-4 shadow-sm">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900 mb-1">Guest Mode</p>
                <p className="text-sm text-amber-700">
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
    <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Profile Completion
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Complete your profile for more personalized meal plans
            </p>
            
            {/* Progress Bar */}
            <div className="mb-4 bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-primary to-orange-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            
            {/* Missing Fields */}
            {completionPercentage < 100 && (
              <div>
                <p className="text-xs text-gray-600 font-medium mb-2">Missing fields:</p>
                <div className="flex flex-wrap gap-2">
                  {requiredFields
                    .filter(
                      (field) =>
                        !profile[field] || profile[field].toString().trim() === ''
                    )
                    .map((field) => (
                      <span
                        key={field}
                        className="text-xs bg-white/80 text-gray-700 px-3 py-1.5 rounded-full border border-orange-200 font-medium"
                      >
                        {field
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <div className="text-4xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
            {completionPercentage}%
          </div>
        </div>
      </div>
    </Card>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default ProfilePage;