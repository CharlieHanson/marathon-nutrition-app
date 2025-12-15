import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Save,
  FolderOpen,
  X,
  Waves,
  Bike,
  Dumbbell,
  Footprints,
  Zap,
} from 'lucide-react';

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

  const handleDelete = async (planId, planNameToDelete) => {
    const shouldDelete =
      typeof window !== 'undefined' &&
      window.confirm(`Delete "${planNameToDelete}"? This cannot be undone.`);

    if (!shouldDelete) return;

    const { error } = await onDeletePlan(planId);
    if (error) {
      window.alert('Failed to delete training plan');
    }
  };

  const addWorkout = (day) => {
    const existing = trainingPlan[day]?.workouts || [];
    onUpdate(day, 'workouts', [...existing, { ...DEFAULT_WORKOUT }]);
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

  // ---- UI helpers ----
  const getWorkoutIcon = (type) => {
    const iconProps = { className: 'w-4 h-4 text-gray-700' };
    switch (type) {
      case 'Swim':
        return <Waves {...iconProps} />;
      case 'Bike Ride':
        return <Bike {...iconProps} />;
      case 'Strength Training':
        return <Dumbbell {...iconProps} />;
      case 'Distance Run':
      case 'Walk/Hike':
        return <Footprints {...iconProps} />;
      case 'Speed or Agility Training':
        return <Zap {...iconProps} />;
      default:
        return null;
    }
  };

  const intensityAccent = (intensity) => {
    switch (intensity) {
      case 'High':
        return 'border-l-red-500';
      case 'Medium':
        return 'border-l-orange-500';
      case 'Low':
        return 'border-l-blue-500';
      case 'Recovery':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-200';
    }
  };

  const isWorkoutPlanned = (w) =>
    (w.type && String(w.type).trim()) ||
    (w.distance && String(w.distance).trim()) ||
    (w.notes && String(w.notes).trim());

  // Simple stats
  const stats = (() => {
    let plannedWorkouts = 0;
    let highCount = 0;
    let recoveryCount = 0;

    DAYS.forEach((day) => {
      const workouts = trainingPlan?.[day]?.workouts?.length
        ? trainingPlan[day].workouts
        : [{ ...DEFAULT_WORKOUT }];

      workouts.forEach((w) => {
        if (isWorkoutPlanned(w)) plannedWorkouts += 1;
        if (w.intensity === 'High') highCount += 1;
        if (w.intensity === 'Recovery' && isWorkoutPlanned(w)) recoveryCount += 1;
      });
    });

    return { plannedWorkouts, highCount, recoveryCount };
  })();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-gray-500">Loading training plan…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4">
      {/* Header with action buttons */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 truncate">
              {currentPlanName || 'New Training Plan'}
            </h2>
            {currentPlanName && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full border border-green-200">
                Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-200 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Plan
            </button>

            <button
              onClick={handleLoadClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 shadow-sm transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              Load Previous
            </button>

            <button
              onClick={() => setShowSaveModal(true)}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Plan'}
            </button>

            {showConfirmation && (
              <div className="px-4 py-2 bg-green-50 border border-green-500 rounded-lg text-green-700 flex items-center gap-2 shadow-sm">
                <span className="text-lg">✓</span>
                <span className="font-medium">Saved!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Training schedule */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
            <p className="text-sm text-gray-500">Plan workouts for each day</p>
          </div>

          {/* KPI chips */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700">
              Planned: <span className="font-semibold">{stats.plannedWorkouts}</span>
            </span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700">
              High intensity: <span className="font-semibold">{stats.highCount}</span>
            </span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700">
              Recovery: <span className="font-semibold">{stats.recoveryCount}</span>
            </span>
          </div>
        </div>

        {/* Detailed per-day panels ONLY (top week-at-a-glance boxes removed) */}
        <div className="space-y-6">
          {DAYS.map((day) => {
            const dayData = trainingPlan[day] || { workouts: [{ ...DEFAULT_WORKOUT }] };
            const workouts = dayData.workouts?.length ? dayData.workouts : [{ ...DEFAULT_WORKOUT }];

            const plannedCount = workouts.filter((w) => isWorkoutPlanned(w)).length;

            const dayIcons = Array.from(
              new Set(
                workouts
                  .map((w) => w.type)
                  .filter((t) => t && t.trim() && t !== 'Rest')
              )
            ).slice(0, 4);

            return (
              <div
                key={day}
                className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-gray-900 capitalize flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      {day}
                    </h4>

                    {plannedCount > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                        {plannedCount} workout{plannedCount === 1 ? '' : 's'}
                      </span>
                    )}

                    {dayIcons.length > 0 && (
                      <div className="flex items-center gap-1">
                        {dayIcons.map((t) => (
                          <span
                            key={t}
                            className="p-1 rounded-md bg-white border border-gray-200"
                            title={t}
                          >
                            {getWorkoutIcon(t)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => addWorkout(day)}
                    className="text-sm px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Workout
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  {workouts.map((workout, index) => (
                    <div
                      key={index}
                      className={`grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm border-l-4 ${intensityAccent(
                        workout.intensity
                      )}`}
                    >
                      {/* Workout type */}
                      <select
                        value={workout.type || ''}
                        onChange={(e) => updateWorkout(day, index, 'type', e.target.value)}
                        className="md:col-span-4 text-sm px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary"
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
                        className="md:col-span-4 text-sm px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      />

                      {/* Intensity */}
                      <div className="md:col-span-3 flex flex-col">
                        <label className="text-xs text-gray-600 mb-1">Intensity</label>
                        <select
                          value={workout.intensity || 'Medium'}
                          onChange={(e) => updateWorkout(day, index, 'intensity', e.target.value)}
                          className="text-sm px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {INTENSITY_LEVELS.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Remove */}
                      {index > 0 && (
                        <button
                          onClick={() => removeWorkout(day, index)}
                          className="md:col-span-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md flex items-center justify-center transition-colors"
                          title="Remove workout"
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
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl ring-1 ring-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Save Training Plan</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Enter plan name (e.g., Marathon Prep Week 1)"
              className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
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
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-xl ring-1 ring-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Load Training Plan</h3>
              <button
                onClick={() => setShowLoadModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
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
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{plan.name}</h4>
                        {plan.is_active && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full border border-green-200">
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
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          Load
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(plan.id, plan.name)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
