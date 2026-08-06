import React, { useState } from 'react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { Select } from '../components/shared/Select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Lock, User, Target, FileText, AlertCircle, Calculator } from 'lucide-react';
import { parseHeightCm, computeNutritionTargets } from '../../shared/lib/tdeeCalc.js';

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

  // Check if string has unit markers even without numbers (e.g., " m")
  const hasMetricMarker = /\s*(m|meters?|cm)\s*$/i.test(s);

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

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {description ? <p className="text-sm text-gray-600">{description}</p> : null}
      </div>
    </div>
  );
}

export const ProfilePage = ({ profile, onUpdate, isSaving, isGuest }) => {
  const [showSaved, setShowSaved] = useState(false);
  const [wasSaving, setWasSaving] = useState(false);
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

  React.useEffect(() => {
    if (isSaving) {
      setWasSaving(true);
      setShowSaved(false);
      return undefined;
    }
    if (wasSaving) {
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2000);
      setWasSaving(false);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isSaving, wasSaving]);

  const setHeightMetersAndSync = (meters) => {
    setHeightMeters(meters);
    onUpdate('height', meters ? `${meters} m` : '');
  };

  const setHeightFeetAndSync = (feet) => {
    setHeightFeet(feet);
    onUpdate('height', feet || heightInches ? `${feet || '0'} ft ${heightInches || '0'} in` : '');
  };

  const setHeightInchesAndSync = (inches) => {
    setHeightInches(inches);
    onUpdate('height', heightFeet || inches ? `${heightFeet || '0'} ft ${inches || '0'} in` : '');
  };

  const setWeightValueAndSync = (value) => {
    setWeightValue(value);
    onUpdate('weight', value ? `${value} ${weightUnit}` : '');
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
    <div className="space-y-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900">Profile</h2>

      {/* Personal Information */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionHeader
            icon={User}
            title="Personal Information"
            description="Tell us about yourself so we can personalize your nutrition plan."
          />
          {!isGuest ? (
            <div className="text-sm text-gray-500 pt-1">
              {isSaving ? (
                <span>Saving…</span>
              ) : showSaved ? (
                <span className="text-green-700">Saved</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Name"
              type="text"
              placeholder="name"
              value={profile.name}
              onChange={(e) => onUpdate('name', e.target.value)}
              disabled={isGuest}
            />

            <Input
              label="Age"
              type="number"
              placeholder="e.g., 25"
              value={profile.age}
              onChange={(e) => onUpdate('age', e.target.value)}
              helperText="Used to calculate optimal calorie needs"
              disabled={isGuest}
            />

            <Select
              label="Gender"
              value={profile.gender}
              onChange={(e) => onUpdate('gender', e.target.value)}
              options={GENDER_OPTIONS}
              placeholder="Select gender"
              disabled={isGuest}
            />

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
                      onChange={(e) => setHeightMetersAndSync(e.target.value)}
                      disabled={isGuest}
                      className={`w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary border-cream-300 bg-cream-200 ${
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
                      onChange={(e) => setHeightFeetAndSync(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      disabled={isGuest}
                      className={`w-16 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary border-cream-300 bg-cream-200 ${
                        isGuest ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    />
                    <span className="text-sm text-gray-600">ft</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={heightInches}
                      onChange={(e) => setHeightInchesAndSync(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))}
                      disabled={isGuest}
                      className={`w-16 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary border-cream-300 bg-cream-200 ${
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
                  onChange={(e) => setWeightValueAndSync(e.target.value)}
                  disabled={isGuest}
                  className={`flex-1 min-w-0 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                    isGuest ? 'bg-gray-100 cursor-not-allowed' : 'bg-cream-200'
                  } border-cream-300`}
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

            <Select
              label="Weight Goal"
              value={profile.goal}
              onChange={(e) => onUpdate('goal', e.target.value)}
              options={GOAL_OPTIONS}
              placeholder="Select goal"
              disabled={isGuest}
            />

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
        </Card>
      </section>

      {/* Training & Goals */}
      <section className="space-y-4">
        <SectionHeader
          icon={Target}
          title="Training & Goals"
          description="Describe your primary training goal or objective."
        />

        <Card>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Training Objective
          </label>
          <textarea
            placeholder="e.g., Training for first marathon in 6 months, improve 5K time, build endurance for trail running..."
            value={profile.objective}
            onChange={(e) => onUpdate('objective', e.target.value)}
            disabled={isGuest}
            className={`w-full px-4 py-3 border border-cream-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
              isGuest ? 'bg-gray-100 cursor-not-allowed' : 'bg-cream-200 hover:border-primary/50'
            }`}
            rows="3"
          />
        </Card>
      </section>

      {/* Dietary Preferences */}
      <section className="space-y-4">
        <SectionHeader
          icon={FileText}
          title="Dietary Preferences"
          description="Any foods you must avoid due to allergies, intolerances, or dietary choices."
        />

        <Card>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dietary Restrictions
          </label>
          <textarea
            placeholder="e.g., vegetarian, gluten-free, nut allergies, lactose intolerant..."
            value={profile.dietaryRestrictions}
            onChange={(e) => onUpdate('dietaryRestrictions', e.target.value)}
            disabled={isGuest}
            className={`w-full px-4 py-3 border border-cream-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
              isGuest ? 'bg-gray-100 cursor-not-allowed' : 'bg-cream-200 hover:border-primary/50'
            }`}
            rows="3"
          />
        </Card>
      </section>

      {!isGuest ? (
        <div>
          <Button onClick={handleTestTdee} icon={Calculator} size="lg">
            Calculate my Macros
          </Button>
        </div>
      ) : (
        <div className="w-full p-5 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg flex items-start gap-4 shadow-sm">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <Lock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-amber-900 mb-1">Guest Mode</p>
            <p className="text-sm text-amber-700">
              You&apos;re browsing in guest mode. Create an account or sign in to save your profile and access all features.
            </p>
          </div>
        </div>
      )}

      <Dialog
        open={showTdeeTest && Boolean(tdeeResults)}
        onOpenChange={(open) => {
          setShowTdeeTest(open);
          if (!open) setTdeeResults(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <DialogTitle>Your Daily Nutrition Targets</DialogTitle>
            <DialogDescription>Based on your profile and goals</DialogDescription>
          </DialogHeader>

          {tdeeResults ? (
            <div className="px-6 py-5 overflow-y-auto space-y-5">
              {/* Rest Day */}
              <div className="p-4 bg-cream-50 rounded-card border border-cream-300 shadow-soft">
                <h4 className="font-semibold text-gray-900 mb-3">Rest days</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-primary-50 rounded">
                    <div className="text-xs text-gray-600 mb-1">Base metabolism (BMR)</div>
                    <div className="text-2xl font-bold text-primary-600">{tdeeResults.noWorkouts.bmr}</div>
                    <div className="text-xs text-gray-500">cal/day</div>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded">
                    <div className="text-xs text-gray-600 mb-1">Daily burn (TDEE)</div>
                    <div className="text-2xl font-bold text-primary">{tdeeResults.noWorkouts.tdee}</div>
                    <div className="text-xs text-gray-500">cal/day</div>
                  </div>
                  <div className="text-center p-3 bg-primary-50 rounded">
                    <div className="text-xs text-gray-600 mb-1">Target calories</div>
                    <div className="text-2xl font-bold text-primary-600">{tdeeResults.noWorkouts.adjustedTdee}</div>
                    <div className="text-xs text-gray-500">cal/day (for your goal)</div>
                  </div>
                </div>
                <div className="p-3 bg-cream-200 rounded">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Daily macros</div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span><strong>Protein:</strong> {tdeeResults.noWorkouts.dailyMacros.protein}g</span>
                    <span><strong>Carbs:</strong> {tdeeResults.noWorkouts.dailyMacros.carbs}g</span>
                    <span><strong>Fat:</strong> {tdeeResults.noWorkouts.dailyMacros.fat}g</span>
                  </div>
                </div>
              </div>

              {/* Training Day */}
              <div className="p-4 bg-cream-50 rounded-card border border-cream-300 shadow-soft">
                <h4 className="font-semibold text-gray-900 mb-3">Training days (example: 10k run)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-primary-50 rounded">
                    <div className="text-xs text-gray-600 mb-1">Base metabolism (BMR)</div>
                    <div className="text-2xl font-bold text-primary-600">{tdeeResults.withWorkouts.bmr}</div>
                    <div className="text-xs text-gray-500">cal/day</div>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded">
                    <div className="text-xs text-gray-600 mb-1">Daily burn (TDEE)</div>
                    <div className="text-2xl font-bold text-primary">{tdeeResults.withWorkouts.tdee}</div>
                    <div className="text-xs text-gray-500">cal/day (includes workout)</div>
                  </div>
                  <div className="text-center p-3 bg-primary-50 rounded">
                    <div className="text-xs text-gray-600 mb-1">Target calories</div>
                    <div className="text-2xl font-bold text-primary-600">{tdeeResults.withWorkouts.adjustedTdee}</div>
                    <div className="text-xs text-gray-500">cal/day (for your goal)</div>
                  </div>
                </div>
                <div className="p-3 bg-cream-200 rounded mb-3">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Daily macros</div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span><strong>Protein:</strong> {tdeeResults.withWorkouts.dailyMacros.protein}g</span>
                    <span><strong>Carbs:</strong> {tdeeResults.withWorkouts.dailyMacros.carbs}g</span>
                    <span><strong>Fat:</strong> {tdeeResults.withWorkouts.dailyMacros.fat}g</span>
                  </div>
                </div>
                <div className="p-3 bg-primary-50 rounded">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Per-meal targets (morning workout)</div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    {Object.entries(tdeeResults.withWorkouts.mealBudgets).map(([meal, macros]) => (
                      <div key={meal} className="p-2 bg-cream-50 rounded border border-cream-300">
                        <div className="font-semibold text-gray-800 mb-1 capitalize">{meal}</div>
                        <div className="text-gray-600">
                          <div>Protein: {macros.protein}g</div>
                          <div>Carbs: {macros.carbs}g</div>
                          <div>Fat: {macros.fat}g</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

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
    <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 shadow-md">
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
            <div className="mb-4 bg-cream-300 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-primary to-primary-600 h-full transition-all duration-500 rounded-full"
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
                        className="text-xs bg-white/80 text-gray-700 px-3 py-1.5 rounded-full border border-primary-200 font-medium"
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
          <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
            {completionPercentage}%
          </div>
        </div>
      </div>
    </Card>
  );
};
