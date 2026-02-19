// src/components/onboarding/ProfileStep.js
import React, { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Select } from '../shared/Select';
import { Card } from '../shared/Card';
import { parseHeightCm } from '../../../shared/lib/tdeeCalc.js';

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

const HEIGHT_UNITS = [
  { value: 'm', label: 'm' },
  { value: 'ft', label: 'ft' },
];

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

function parseHeightForDisplay(raw) {
  const emptyFt = { unit: 'ft', feet: '', inches: '' };
  const emptyM = { unit: 'm', meters: '', feet: '', inches: '' };

  if (!raw || typeof raw !== 'string') return emptyFt;
  const s = raw.trim().toLowerCase();

  const hasMetricMarker = /\s*(m|meters?|cm)\s*$/i.test(s);
  const hasImperialMarker = /(?:'|'|'|′|ft|feet|foot)|(?:"|"|"|″|in|inches)|['"″]/i.test(s);

  const cm = parseHeightCm(raw);

  if (cm == null && hasMetricMarker) return emptyM;
  if (cm == null) return emptyFt;

  const isMetric = /^\d+\.?\d*\s*(m|meters?|cm)\s*$/i.test(s);
  const isImperial = /\d+\.?\d*\s*(?:'|'|'|′|ft|feet|foot)|(\d+\.?\d*)\s*(in|inches)|['"″]/i.test(s);
  const plainNum = parseFloat(s);
  const looksLikeMetric = !isNaN(plainNum) && plainNum > 100;

  let unit = 'ft';
  if (isMetric || (looksLikeMetric && !isImperial)) unit = 'm';
  else if (isImperial) unit = 'ft';

  if (unit === 'm') {
    let meters = '';
    const mMatch = s.match(/^(\d+\.?\d*)\s*(m|meters?)$/);
    if (mMatch) {
      meters = mMatch[1];
    } else {
      meters = String((cm / 100).toFixed(2));
    }
    return { unit: 'm', meters, feet: '', inches: '' };
  }
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round((totalInches % 12) * 10) / 10;
  return { unit: 'ft', feet: String(feet), inches: String(inches), meters: '' };
}

export const ProfileStep = ({ profile, onUpdate, onNext, onBack, isSaving }) => {
  const [heightUnit, setHeightUnit] = useState(() => parseHeightForDisplay(profile.height).unit);
  const [heightMeters, setHeightMeters] = useState(() => parseHeightForDisplay(profile.height).meters);
  const [heightFeet, setHeightFeet] = useState(() => parseHeightForDisplay(profile.height).feet);
  const [heightInches, setHeightInches] = useState(() => parseHeightForDisplay(profile.height).inches);
  const [weightValue, setWeightValue] = useState(() => parseWeightForDisplay(profile.weight).value);
  const [weightUnit, setWeightUnit] = useState(() => parseWeightForDisplay(profile.weight).unit);

  useEffect(() => {
    const parsed = parseHeightForDisplay(profile.height);
    setHeightUnit(parsed.unit);
    setHeightMeters(parsed.meters);
    setHeightFeet(parsed.feet);
    setHeightInches(parsed.inches);
  }, [profile.height]);

  useEffect(() => {
    const parsed = parseWeightForDisplay(profile.weight);
    setWeightValue(parsed.value);
    setWeightUnit(parsed.unit);
  }, [profile.weight]);

  const buildHeightString = () => {
    if (heightUnit === 'm') {
      return heightMeters ? `${heightMeters} m` : '';
    }
    return heightFeet || heightInches ? `${heightFeet || '0'} ft ${heightInches || '0'} in` : '';
  };

  const buildWeightString = () => (weightValue ? `${weightValue} ${weightUnit}` : '');

  const updateHeightInProfile = () => {
    onUpdate('height', buildHeightString());
  };

  const updateWeightInProfile = () => {
    onUpdate('weight', buildWeightString());
  };

  const handleNext = () => {
    updateHeightInProfile();
    updateWeightInProfile();
    const heightStr = buildHeightString();
    const weightStr = buildWeightString();
    onNext({ ...profile, height: heightStr, weight: weightStr });
  };

  const isValid = profile.name && profile.age && buildHeightString() && buildWeightString() && profile.goal;

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
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm text-gray-600">ft</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))}
                      onBlur={updateHeightInProfile}
                      className="w-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Select
                  options={WEIGHT_UNITS}
                  value={weightUnit}
                  onChange={(e) => {
                    setWeightUnit(e.target.value);
                    onUpdate('weight', weightValue ? `${weightValue} ${e.target.value}` : '');
                  }}
                  className="w-20 flex-shrink-0"
                />
              </div>
            </div>
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
            onClick={handleNext}
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