import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Save, FolderOpen, X } from 'lucide-react';

const WORKOUT_TYPES = [
  'Rest',
  'Distance Run',
  'Speed or Agility Training',
  'Bike Ride',
  'Walk/Hike',
  'Swim',
  'Strength Training',
  'Sport Practice',
];

// ✅ Fixed day order
const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

// ✅ Intensity options (stored as strings)
const INTENSITY_LEVELS = ['High', 'Medium', 'Low', 'Recovery'];

// ✅ Default workout with Medium intensity
const DEFAULT_WORKOUT = {
  type: '',
  distance: '',
  intensity: 'Medium',
  notes: '',
};

export const TrainingPlanPage = ({
  trainingPlan,
  currentPlanName,
  savedPlans,
  onUpdate,
  onSave,
  onLoadPlan,
  onDeletePlan,
  onCreateNew,
  onLoadSavedPlans,
  isSaving,
  isLoading,
}) => {
  const [planName, setPlanName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    setPlanName(currentPlanName || '');
  }, [currentPlanName]);

  const handleSave = async () => {
    const nameToUse = planName.trim() || 'Untitled Plan';
    const { error } = await onSave(nameToUse);

    if (!error) {
      setShowSaveModal(false);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
    } else {
      alert('Failed to save training plan');
    }
  };

  const handleLoadClick = async () => {
    await onLoadSavedPlans();
    setShowLoadModal(true);
  };

  const handleLoadPlan = async (planId) => {
    const { error } = await onLoadPlan(planId);
    if (!error) {
      setShowLoadModal(false);
    } else {
      alert('Failed to load training plan');
    }
  };

  const handleDelete = async (planId, planName) => {
    // Use window.confirm to avoid the no-restricted-globals lint error
    const shouldDelete =
      typeof window !== 'undefined' &&
      window.confirm(`Delete "${planName}"? This cannot be undone.`);

    if (!shouldDelete) return;

    const { error } = await onDeletePlan(planId);
    if (error) {
      // You can keep this, or later replace it with a prettier toast
      window.alert('Failed to delete training plan');
    }
  };

  const addWorkout = (day) => {
    const existing = trainingPlan[day]?.workouts || [];
    onUpdate(day, 'workouts', [
      ...existing,
      { ...DEFAULT_WORKOUT }, // ✅ Medium by default
    ]);
  };

  const removeWorkout = (day, index) => {
    const workouts = [...(trainingPlan[day]?.workouts || [])];
    workouts.splice(index, 1);
    onUpdate(day, 'workouts', workouts.length ? workouts : [{ ...DEFAULT_WORKOUT }]);
  };

  const updateWorkout = (day, index, field, value) => {
    const workouts = [...(trainingPlan[day]?.workouts || [{ ...DEFAULT_WORKOUT }])];
    workouts[index] = { ...workouts[index], [field]: value };
    onUpdate(day, 'workouts', workouts);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-gray-500">Loading training plan…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {currentPlanName || 'New Training Plan'}
            </h2>
            {currentPlanName && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <Plus className="w-4 h-4" />
              New Plan
            </button>

            <button
              onClick={handleLoadClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              <FolderOpen className="w-4 h-4" />
              Load Previous
            </button>

            <button
              onClick={() => setShowSaveModal(true)}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Plan'}
            </button>

            {showConfirmation && (
              <div className="px-4 py-2 bg-green-50 border border-green-500 rounded-md text-green-700 flex items-center gap-2">
                <span className="text-lg">✓</span>
                <span className="font-medium">Saved!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Training schedule */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h3>

        <div className="space-y-6">
          {DAYS.map((day) => {
            const dayData = trainingPlan[day] || { workouts: [{ ...DEFAULT_WORKOUT }] };
            const workouts = dayData.workouts?.length
              ? dayData.workouts
              : [{ ...DEFAULT_WORKOUT }];

            return (
              <div key={day} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900 capitalize flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {day}
                  </h4>
                  <button
                    onClick={() => addWorkout(day)}
                    className="text-sm text-primary hover:text-primary-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Workout
                  </button>
                </div>

                <div className="space-y-3">
                  {workouts.map((workout, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded"
                    >
                      {/* Workout type */}
                      <select
                        value={workout.type || ''}
                        onChange={(e) => updateWorkout(day, index, 'type', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select workout</option>
                        {WORKOUT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>

                      {/* Distance/Duration */}
                      <input
                        type="text"
                        placeholder="Distance/Duration"
                        value={workout.distance || ''}
                        onChange={(e) => updateWorkout(day, index, 'distance', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />

                      {/* Intensity dropdown */}
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1">Intensity</label>
                        <select
                          value={workout.intensity || 'Medium'}
                          onChange={(e) => updateWorkout(day, index, 'intensity', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {INTENSITY_LEVELS.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Remove button */}
                      {index > 0 && (
                        <button
                          onClick={() => removeWorkout(day, index)}
                          className="text-red-600 hover:text-red-800 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Save Training Plan</h3>
              <button onClick={() => setShowSaveModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Enter plan name (e.g., Marathon Prep Week 1)"
              className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Load Training Plan</h3>
              <button onClick={() => setShowLoadModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {savedPlans.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No saved training plans yet. Create and save one to see it here!
              </p>
            ) : (
              <div className="space-y-2">
                {savedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{plan.name}</h4>
                        {plan.is_active && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Created {new Date(plan.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {!plan.is_active && (
                        <button
                          onClick={() => handleLoadPlan(plan.id)}
                          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700"
                        >
                          Load
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(plan.id, plan.name)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
