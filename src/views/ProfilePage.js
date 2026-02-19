import React, { useState } from 'react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { Select } from '../components/shared/Select';
import { Save, Lock, User, Target, FileText, AlertCircle } from 'lucide-react';
import { parseHeightCm, parseWeightKg, computeNutritionTargets } from '../../shared/lib/tdeeCalc.js';

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

const WEIGHT_UNITS = [
  { value: 'lbs', label: 'lbs' },
  { value: 'kg', label: 'kg' },
];

/**
 * Parse stored weight string into display value and unit.
 * "150 lbs" / "150lbs" → { value: '150', unit: 'lbs' }
 * "68 kg" / "68kg" → { value: '68', unit: 'kg' }
 * No number or no unit → { value: '', unit: 'lbs' }
 */
function parseWeightForDisplay(raw) {
  if (!raw || typeof raw !== 'string') return { value: '', unit: 'lbs' };
  const s = raw.trim().toLowerCase();
  const kgMatch = s.match(/^(\d+\.?\d*)\s*(kg|kgs|kilos?)$/);
  if (kgMatch) return { value: kgMatch[1], unit: 'kg' };
  const lbMatch = s.match(/^(\d+\.?\d*)\s*(lbs?|pounds?)$/);
  if (lbMatch) return { value: lbMatch[1], unit: 'lbs' };
  const numMatch = s.match(/^(\d+\.?\d*)/);
  if (numMatch) return { value: numMatch[1], unit: 'lbs' };
  return { value: '', unit: 'lbs' };
}

const HEIGHT_UNITS = [
  { value: 'm', label: 'm' },
  { value: 'ft', label: 'ft' },
];

/**
 * Parse stored height string into display values and unit using parseHeightCm.
 * Metric (cm/m) → { unit: 'm', meters: string }; imperial (ft/in) → { unit: 'ft', feet: string, inches: string }.
 * If it doesn't match any format, default to ft with empty boxes.
 */
function parseHeightForDisplay(raw) {
  const emptyFt = { unit: 'ft', feet: '', inches: '' };
  const emptyM = { unit: 'm', meters: '', feet: '', inches: '' };
  
  if (!raw || typeof raw !== 'string') return emptyFt;
  const s = raw.trim().toLowerCase();
  
  // Check if string has unit markers even without numbers (e.g., " m" or "ft in")
  const hasMetricMarker = /\s*(m|meters?|cm)\s*$/i.test(s);
  const hasImperialMarker = /(?:'|'|'|′|ft|feet|foot)|(?:"|"|"|″|in|inches)|['"″]/i.test(s);
  
  const cm = parseHeightCm(raw);
  
  // If no valid number but has metric marker, return empty metric
  if (cm == null && hasMetricMarker) return emptyM;
  
  // If no valid number and no markers, return empty ft
  if (cm == null) return emptyFt;

  // Detect preferred unit from raw string
  const isMetric = /^\d+\.?\d*\s*(m|meters?|cm)\s*$/i.test(s);
  const isImperial = /\d+\.?\d*\s*(?:'|'|'|′|ft|feet|foot)|(\d+\.?\d*)\s*(in|inches)|['"″]/i.test(s);
  const plainNum = parseFloat(s);
  const looksLikeMetric = !isNaN(plainNum) && plainNum > 100;

  let unit = 'ft';
  if (isMetric || (looksLikeMetric && !isImperial)) unit = 'm';
  else if (isImperial) unit = 'ft';

  if (unit === 'm') {
    // Extract the raw meters value from the string if it exists, otherwise convert from cm
    let meters = '';
    const mMatch = s.match(/^(\d+\.?\d*)\s*(m|meters?)$/);
    if (mMatch) {
      meters = mMatch[1];
    } else {
      // Converting from cm or plain number, format it
      meters = String((cm / 100).toFixed(2));
    }
    return { unit: 'm', meters, feet: '', inches: '' };
  }
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round((totalInches % 12) * 10) / 10;
  return { unit: 'ft', feet: String(feet), inches: String(inches), meters: '' };
}

export const ProfilePage = ({ profile, onUpdate, onSave, isSaving, isGuest }) => {
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showTdeeTest, setShowTdeeTest] = useState(false);
  const [tdeeResults, setTdeeResults] = useState(null);

  // Local state for height
  const [heightUnit, setHeightUnit] = useState(() => parseHeightForDisplay(profile.height).unit);
  const [heightMeters, setHeightMeters] = useState(() => parseHeightForDisplay(profile.height).meters);
  const [heightFeet, setHeightFeet] = useState(() => parseHeightForDisplay(profile.height).feet);
  const [heightInches, setHeightInches] = useState(() => parseHeightForDisplay(profile.height).inches);

  // Local state for weight
  const [weightValue, setWeightValue] = useState(() => parseWeightForDisplay(profile.weight).value);
  const [weightUnit, setWeightUnit] = useState(() => parseWeightForDisplay(profile.weight).unit);

  // Sync local state when profile changes from external source
  React.useEffect(() => {
    const parsed = parseHeightForDisplay(profile.height);
    setHeightUnit(parsed.unit);
    setHeightMeters(parsed.meters);
    setHeightFeet(parsed.feet);
    setHeightInches(parsed.inches);
  }, [profile.height]);

  React.useEffect(() => {
    const parsed = parseWeightForDisplay(profile.weight);
    setWeightValue(parsed.value);
    setWeightUnit(parsed.unit);
  }, [profile.weight]);

  // Build height string from local state and update profile
  const updateHeightInProfile = () => {
    if (heightUnit === 'm') {
      onUpdate('height', heightMeters ? `${heightMeters} m` : '');
    } else {
      onUpdate('height', heightFeet || heightInches ? `${heightFeet || '0'} ft ${heightInches || '0'} in` : '');
    }
  };

  // Build weight string from local state and update profile
  const updateWeightInProfile = () => {
    onUpdate('weight', weightValue ? `${weightValue} ${weightUnit}` : '');
  };

  const handleSave = async () => {
    // Update profile with current local state before saving
    updateHeightInProfile();
    updateWeightInProfile();
    
    const { error } = await onSave();
    if (!error) {
      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 3000);
    } else {
      alert('Failed to save profile');
    }
  };

  const handleTestTdee = () => {
    try {
      // Test with no workouts first
      const noWorkouts = computeNutritionTargets({
        userProfile: {
          height: profile.height,
          weight: profile.weight,
          age: profile.age,
          gender: profile.gender,
          goal: profile.goal,
          activity_level: profile.activityLevel,
        },
        todayWorkouts: [],
        workoutTiming: null,
      });

      // Test with sample workouts
      const withWorkouts = computeNutritionTargets({
        userProfile: {
          height: profile.height,
          weight: profile.weight,
          age: profile.age,
          gender: profile.gender,
          goal: profile.goal,
          activity_level: profile.activityLevel,
        },
        todayWorkouts: [
          { type: 'Distance Run', intensity: 8, distance: '10k' },
        ],
        workoutTiming: 'am',
      });

      setTdeeResults({ noWorkouts, withWorkouts });
      setShowTdeeTest(true);
    } catch (error) {
      alert(`TDEE Calculation Error: ${error.message}`);
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

          {/* Gender */}
          <Select
            label="Gender"
            value={profile.gender}
            onChange={(e) => onUpdate('gender', e.target.value)}
            options={GENDER_OPTIONS}
            placeholder="Select gender"
            disabled={isGuest}
          />

          {/* Height with unit dropdown: m (one box) or ft & in (two boxes) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {heightUnit === 'm' ? (
                <>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 1.73"
                    value={heightMeters}
                    onChange={(e) => setHeightMeters(e.target.value)}
                    onBlur={updateHeightInProfile}
                    disabled={isGuest}
                    className={`w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary border-gray-300 ${
                      isGuest ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  />
                  <Select
                    options={HEIGHT_UNITS}
                    value={heightUnit}
                    onChange={(e) => {
                      const newUnit = e.target.value;
                      setHeightUnit(newUnit);
                      if (newUnit === 'ft') {
                        // Convert from meters to ft/in
                        const meters = parseFloat(heightMeters);
                        if (!isNaN(meters)) {
                          const cm = meters * 100;
                          const totalInches = cm / 2.54;
                          const feet = Math.floor(totalInches / 12);
                          const inches = Math.round((totalInches % 12) * 10) / 10;
                          setHeightFeet(String(feet));
                          setHeightInches(String(inches));
                          onUpdate('height', `${feet} ft ${inches} in`);
                        } else {
                          setHeightFeet('');
                          setHeightInches('');
                          onUpdate('height', '');
                        }
                      }
                    }}
                    disabled={isGuest}
                    className="w-24 flex-shrink-0"
                  />
                </>
              ) : (
                <>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={heightFeet}
                    onChange={(e) => setHeightFeet(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    onBlur={updateHeightInProfile}
                    disabled={isGuest}
                    className={`w-16 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary border-gray-300 ${
                      isGuest ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="text-sm text-gray-600">ft</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={heightInches}
                    onChange={(e) => setHeightInches(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))}
                    onBlur={updateHeightInProfile}
                    disabled={isGuest}
                    className={`w-16 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary border-gray-300 ${
                      isGuest ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="text-sm text-gray-600">in</span>
                  <Select
                    options={HEIGHT_UNITS}
                    value={heightUnit}
                    onChange={(e) => {
                      const newUnit = e.target.value;
                      setHeightUnit(newUnit);
                      if (newUnit === 'm') {
                        // Convert from ft/in to meters
                        const feet = parseFloat(heightFeet) || 0;
                        const inches = parseFloat(heightInches) || 0;
                        const totalInches = feet * 12 + inches;
                        const cm = totalInches * 2.54;
                        const meters = (cm / 100).toFixed(2);
                        setHeightMeters(meters);
                        onUpdate('height', `${meters} m`);
                      }
                    }}
                    disabled={isGuest}
                    className="w-24 flex-shrink-0"
                  />
                </>
              )}
            </div>
          </div>

          {/* Weight with unit dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g., 150 or 68"
                value={weightValue}
                onChange={(e) => setWeightValue(e.target.value)}
                onBlur={updateWeightInProfile}
                disabled={isGuest}
                className={`flex-1 min-w-0 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  isGuest ? 'bg-gray-100 cursor-not-allowed' : ''
                } border-gray-300`}
              />
              <Select
                options={WEIGHT_UNITS}
                value={weightUnit}
                onChange={(e) => {
                  setWeightUnit(e.target.value);
                  onUpdate('weight', weightValue ? `${weightValue} ${e.target.value}` : '');
                }}
                disabled={isGuest}
                className="w-20 flex-shrink-0"
              />
            </div>
          </div>

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
            <div className="flex flex-col gap-4">
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

              {/* TDEE Test Button - FOR LOCAL TESTING ONLY */}
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleTestTdee} 
                  className="bg-purple-600 hover:bg-purple-700"
                  size="md"
                >
                  🧪 Test TDEE Calculator
                </Button>
                {showTdeeTest && (
                  <button
                    onClick={() => setShowTdeeTest(false)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Hide Results
                  </button>
                )}
              </div>
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

      {/* TDEE Test Results - FOR LOCAL TESTING ONLY */}
      {showTdeeTest && tdeeResults && (
        <Card className="bg-purple-50 border-2 border-purple-300">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-purple-900 mb-2">🧪 TDEE Calculator Test Results</h3>
            <p className="text-sm text-purple-700">Testing all tdeeCalc.js functions with your current profile</p>
          </div>

          {/* Parsed Values */}
          <div className="mb-6 p-4 bg-white rounded-lg border border-purple-200">
            <h4 className="font-semibold text-gray-900 mb-3">📊 Parsed Input Values</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Height:</span>
                <span className="ml-2 font-mono font-semibold">{tdeeResults.noWorkouts.parsed.heightCm} cm</span>
                <div className="text-xs text-gray-500">from: "{profile.height}"</div>
              </div>
              <div>
                <span className="text-gray-600">Weight:</span>
                <span className="ml-2 font-mono font-semibold">{tdeeResults.noWorkouts.parsed.weightKg.toFixed(1)} kg</span>
                <div className="text-xs text-gray-500">from: "{profile.weight}"</div>
              </div>
              <div>
                <span className="text-gray-600">Age:</span>
                <span className="ml-2 font-mono font-semibold">{tdeeResults.noWorkouts.parsed.age}</span>
              </div>
              <div>
                <span className="text-gray-600">Gender:</span>
                <span className="ml-2 font-mono font-semibold">{tdeeResults.noWorkouts.parsed.gender}</span>
              </div>
              <div>
                <span className="text-gray-600">Goal:</span>
                <span className="ml-2 font-mono font-semibold">{tdeeResults.noWorkouts.parsed.goal}</span>
              </div>
              <div>
                <span className="text-gray-600">Activity:</span>
                <span className="ml-2 font-mono font-semibold">{tdeeResults.noWorkouts.parsed.activityMultiplier}x</span>
              </div>
            </div>
          </div>

          {/* Rest Day (No Workouts) */}
          <div className="mb-6 p-4 bg-white rounded-lg border border-purple-200">
            <h4 className="font-semibold text-gray-900 mb-3">😴 Rest Day (No Workouts)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-xs text-gray-600 mb-1">BMR</div>
                <div className="text-2xl font-bold text-blue-600">{tdeeResults.noWorkouts.bmr}</div>
                <div className="text-xs text-gray-500">cal/day</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-xs text-gray-600 mb-1">TDEE</div>
                <div className="text-2xl font-bold text-green-600">{tdeeResults.noWorkouts.tdee}</div>
                <div className="text-xs text-gray-500">cal/day</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded">
                <div className="text-xs text-gray-600 mb-1">Adjusted TDEE</div>
                <div className="text-2xl font-bold text-orange-600">{tdeeResults.noWorkouts.adjustedTdee}</div>
                <div className="text-xs text-gray-500">for goal</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded">
                <div className="text-xs text-gray-600 mb-1">Goal Multiplier</div>
                <div className="text-2xl font-bold text-purple-600">{tdeeResults.noWorkouts.goalMultiplier}x</div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm font-semibold text-gray-700 mb-2">Daily Macros:</div>
              <div className="flex gap-4 text-sm">
                <span><strong>Protein:</strong> {tdeeResults.noWorkouts.dailyMacros.protein}g</span>
                <span><strong>Carbs:</strong> {tdeeResults.noWorkouts.dailyMacros.carbs}g</span>
                <span><strong>Fat:</strong> {tdeeResults.noWorkouts.dailyMacros.fat}g</span>
              </div>
            </div>
          </div>

          {/* Training Day (With Workouts) */}
          <div className="mb-6 p-4 bg-white rounded-lg border border-purple-200">
            <h4 className="font-semibold text-gray-900 mb-3">🏃 Training Day (Sample: 10k Run, High Intensity, AM)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-xs text-gray-600 mb-1">BMR</div>
                <div className="text-2xl font-bold text-blue-600">{tdeeResults.withWorkouts.bmr}</div>
                <div className="text-xs text-gray-500">cal/day</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-xs text-gray-600 mb-1">TDEE</div>
                <div className="text-2xl font-bold text-green-600">{tdeeResults.withWorkouts.tdee}</div>
                <div className="text-xs text-gray-500">+{tdeeResults.withWorkouts.parsed.trainingMultiplier}x training</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded">
                <div className="text-xs text-gray-600 mb-1">Adjusted TDEE</div>
                <div className="text-2xl font-bold text-orange-600">{tdeeResults.withWorkouts.adjustedTdee}</div>
                <div className="text-xs text-gray-500">for goal</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded">
                <div className="text-xs text-gray-600 mb-1">Difference</div>
                <div className="text-2xl font-bold text-red-600">+{tdeeResults.withWorkouts.adjustedTdee - tdeeResults.noWorkouts.adjustedTdee}</div>
                <div className="text-xs text-gray-500">vs rest day</div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded mb-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">Daily Macros:</div>
              <div className="flex gap-4 text-sm">
                <span><strong>Protein:</strong> {tdeeResults.withWorkouts.dailyMacros.protein}g</span>
                <span><strong>Carbs:</strong> {tdeeResults.withWorkouts.dailyMacros.carbs}g</span>
                <span><strong>Fat:</strong> {tdeeResults.withWorkouts.dailyMacros.fat}g</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-sm font-semibold text-gray-700 mb-2">Meal Budgets (AM workout):</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                {Object.entries(tdeeResults.withWorkouts.mealBudgets).map(([meal, macros]) => (
                  <div key={meal} className="p-2 bg-white rounded border">
                    <div className="font-semibold text-gray-800 mb-1 capitalize">{meal}</div>
                    <div className="text-gray-600">
                      <div>P: {macros.protein}g</div>
                      <div>C: {macros.carbs}g</div>
                      <div>F: {macros.fat}g</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs text-purple-600 italic">
            ⚠️ This test panel is for local development only. Remove before deploying to production.
          </div>
        </Card>
      )}
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
