import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Waves,
  Bike,
  Dumbbell,
  Footprints,
  Zap,
} from 'lucide-react';
import { DAYS, addDaysToDateString, getMondayOfCurrentWeek } from '../hooks/useWorkoutLog';

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

const INTENSITY_LEVELS = ['High', 'Medium', 'Low', 'Recovery'];
const MAX_WORKOUTS = 5;

const DEFAULT_WORKOUT = {
  type: '',
  distance: '',
  intensity: 'Medium',
  notes: '',
  timing: '',
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function weekdayFromLocalDate(localDate) {
  const d = new Date(`${localDate}T00:00:00`);
  const js = d.getDay();
  return DAYS[js === 0 ? 6 : js - 1];
}

function getWeekDateNumbers(weekStarting) {
  if (!weekStarting) return DAYS.map(() => 0);
  return DAYS.map((_, i) => {
    const d = new Date(`${weekStarting}T00:00:00`);
    d.setDate(d.getDate() + i);
    return d.getDate();
  });
}

export const TrainingPlanPage = ({
  selectedDate,
  weekStarting,
  getWorkoutsForDate,
  updateDayWorkouts,
  setSelectedDate,
  goToPreviousWeek,
  goToNextWeek,
  isSaving,
  isLoading,
  error,
  onClearError,
}) => {
  const [showSaved, setShowSaved] = useState(false);
  const [wasSaving, setWasSaving] = useState(false);

  const selectedDay = useMemo(() => weekdayFromLocalDate(selectedDate), [selectedDate]);
  const weekDates = useMemo(() => getWeekDateNumbers(weekStarting), [weekStarting]);
  const isCurrentWeek = weekStarting === getMondayOfCurrentWeek();
  const todayDay = weekdayFromLocalDate(
    (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })()
  );

  const rawWorkouts = getWorkoutsForDate(selectedDate);
  const selectedWorkouts = rawWorkouts.length ? rawWorkouts : [{ ...DEFAULT_WORKOUT }];

  useEffect(() => {
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

  useEffect(() => {
    setShowSaved(false);
    setWasSaving(false);
  }, [selectedDate]);

  useEffect(() => {
    if (!error) return;
    window.alert(error);
    onClearError?.();
  }, [error, onClearError]);

  const commitWorkouts = (workouts) => {
    updateDayWorkouts(selectedDate, workouts);
  };

  const addWorkout = () => {
    if (selectedWorkouts.length >= MAX_WORKOUTS) return;
    commitWorkouts([...selectedWorkouts, { ...DEFAULT_WORKOUT }]);
  };

  const removeWorkout = (index) => {
    const workouts = [...selectedWorkouts];
    workouts.splice(index, 1);
    commitWorkouts(workouts.length ? workouts : [{ ...DEFAULT_WORKOUT }]);
  };

  const updateWorkout = (index, field, value) => {
    const workouts = selectedWorkouts.map((w, i) =>
      i === index ? { ...w, [field]: value } : w
    );
    commitWorkouts(workouts);
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-gray-500">Loading workouts…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto px-4">
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-4">
        <div className="flex items-center justify-between gap-2 mb-4">
          <button
            type="button"
            onClick={goToPreviousWeek}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-1 justify-center gap-1 sm:gap-2">
            {DAYS.map((day, index) => {
              const isSelected = selectedDay === day;
              const isToday = isCurrentWeek && day === todayDay;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDate(addDaysToDateString(weekStarting, index))}
                  className={`flex flex-col items-center px-2 py-2 rounded-xl min-w-[44px] transition-colors ${
                    isSelected
                      ? 'bg-primary text-white'
                      : isToday
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wide">
                    {DAY_LABELS[index]}
                  </span>
                  <span className="text-sm font-semibold">{weekDates[index]}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={goToNextWeek}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between min-h-[28px]">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 capitalize">
            <Calendar className="w-4 h-4 text-gray-600" />
            {selectedDay}
          </h2>
          <div className="text-xs font-semibold text-gray-500">
            {isSaving ? (
              <span>Saving…</span>
            ) : showSaved ? (
              <span className="text-green-700">Saved</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-4 space-y-3">
        {selectedWorkouts.map((workout, index) => (
          <div
            key={index}
            className="flex gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-w-0">
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Workout</label>
                <div className="flex items-center gap-2">
                  {workout.type ? getWorkoutIcon(workout.type) : null}
                  <select
                    value={workout.type || ''}
                    onChange={(e) => updateWorkout(index, 'type', e.target.value)}
                    className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary h-9"
                  >
                    <option value="">Select workout</option>
                    {WORKOUT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Distance/Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 5k, 30 min"
                  value={workout.distance || ''}
                  onChange={(e) => updateWorkout(index, 'distance', e.target.value)}
                  className="text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary h-9"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Intensity</label>
                <select
                  value={workout.intensity || 'Medium'}
                  onChange={(e) => updateWorkout(index, 'intensity', e.target.value)}
                  className="text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary h-9"
                >
                  {INTENSITY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Workout Time</label>
                <select
                  value={workout.timing ?? ''}
                  onChange={(e) => updateWorkout(index, 'timing', e.target.value)}
                  className="text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary h-9"
                >
                  <option value="">—</option>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>
            </div>
            {selectedWorkouts.length > 1 ? (
              <button
                type="button"
                onClick={() => removeWorkout(index)}
                className="flex-shrink-0 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md flex items-center justify-center p-2 transition-colors self-start"
                title="Remove workout"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        ))}

        {selectedWorkouts.length < MAX_WORKOUTS ? (
          <button
            type="button"
            onClick={addWorkout}
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-dashed border-gray-300 text-primary hover:bg-primary/5 flex items-center justify-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {selectedWorkouts.length > 1 ? 'Add another workout' : 'Add workout'}
          </button>
        ) : null}
      </div>
    </div>
  );
};
