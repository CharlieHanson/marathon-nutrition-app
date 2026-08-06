import React, { useState, useEffect, useMemo } from 'react';
import {
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
import { Button } from '@/src/components/shared/Button';
import { Input } from '@/src/components/shared/Input';
import { Select } from '@/src/components/shared/Select';
import { Label } from '@/src/components/ui/label';
import { TrainingPlanSkeleton } from '../components/shared/LoadingSkeleton';


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

function formatWeekOfLabel(weekStarting) {
  if (!weekStarting) return '';
  const d = new Date(`${weekStarting}T00:00:00`);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const getWorkoutIcon = (type) => {
  const iconProps = { className: 'w-5 h-5 text-gray-700' };
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

function DayWorkoutsEditor({
  date,
  workouts,
  onUpdateDay,
  showDayLabel = false,
  dayLabel = '',
}) {
  const selectedWorkouts = workouts.length ? workouts : [{ ...DEFAULT_WORKOUT }];

  const commitWorkouts = (next) => {
    onUpdateDay(date, next);
  };

  const addWorkout = () => {
    if (selectedWorkouts.length >= MAX_WORKOUTS) return;
    commitWorkouts([...selectedWorkouts, { ...DEFAULT_WORKOUT }]);
  };

  const removeWorkout = (index) => {
    const next = [...selectedWorkouts];
    next.splice(index, 1);
    commitWorkouts(next.length ? next : [{ ...DEFAULT_WORKOUT }]);
  };

  const updateWorkout = (index, field, value) => {
    const next = selectedWorkouts.map((w, i) =>
      i === index ? { ...w, [field]: value } : w
    );
    commitWorkouts(next);
  };

  return (
    <div className={showDayLabel ? 'space-y-4' : 'space-y-4'}>
      {showDayLabel ? (
        <h3 className="text-xl font-bold text-gray-900 capitalize">{dayLabel}</h3>
      ) : null}

      {selectedWorkouts.map((workout, index) => (
        <div
          key={index}
          className="flex gap-4 p-4 bg-cream-50 border border-cream-300 rounded-card shadow-soft"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 min-w-0">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1.5">Workout</label>
              <div className="flex items-center gap-2">
                {workout.type ? getWorkoutIcon(workout.type) : null}
                <select
                  value={workout.type || ''}
                  onChange={(e) => updateWorkout(index, 'type', e.target.value)}
                  className="flex-1 text-base px-3 py-2 border border-cream-300 rounded-md bg-cream-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary h-11"
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
              <Label className="text-sm text-muted-foreground mb-1.5">Distance/Duration</Label>
              <Input
                type="text"
                placeholder="e.g. 5k, 30 min"
                value={workout.distance || ''}
                onChange={(e) => updateWorkout(index, 'distance', e.target.value)}
                className="h-11 text-base bg-cream-200"
              />
            </div>
            <div className="flex flex-col">
              <Select
                label="Intensity"
                value={workout.intensity || 'Medium'}
                onChange={(e) => updateWorkout(index, 'intensity', e.target.value)}
                options={INTENSITY_LEVELS.map((level) => ({ value: level, label: level }))}
                placeholder="Intensity"
                className="[&_button]:h-11 [&_button]:text-base [&_button]:bg-cream-200 [&_label]:text-sm [&_label]:text-muted-foreground [&_label]:mb-1.5"
              />
            </div>
            <div className="flex flex-col">
              <Select
                label="Workout Time"
                value={workout.timing || undefined}
                onChange={(e) => updateWorkout(index, 'timing', e.target.value)}
                options={[
                  { value: 'Morning', label: 'Morning' },
                  { value: 'Afternoon', label: 'Afternoon' },
                  { value: 'Evening', label: 'Evening' },
                ]}
                placeholder="—"
                className="[&_button]:h-11 [&_button]:text-base [&_button]:bg-cream-200 [&_label]:text-sm [&_label]:text-muted-foreground [&_label]:mb-1.5"
              />
            </div>
          </div>
          {selectedWorkouts.length > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeWorkout(index)}
              className="flex-shrink-0 text-red-600 hover:text-red-800 hover:bg-red-50 self-start"
              title="Remove workout"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          ) : null}
        </div>
      ))}

      {selectedWorkouts.length < MAX_WORKOUTS ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={addWorkout}
          className="w-full border-dashed border-cream-300 text-primary hover:bg-primary/5 text-base"
          icon={Plus}
        >
          {selectedWorkouts.length > 1 ? 'Add another workout' : 'Add workout'}
        </Button>
      ) : null}
    </div>
  );
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
  const [viewMode, setViewMode] = useState('day');

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

  if (isLoading) {
    return <TrainingPlanSkeleton />;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">Training Plan</h2>
        <p className="text-gray-600">
          Log your workouts so meals can match your training load.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 min-h-[28px]">
        <div className="flex flex-wrap items-center gap-3">
          {viewMode === 'day' ? (
            <div className="w-fit max-w-full rounded-lg border border-cream-300 bg-cream-paper px-1.5 py-1.5 shadow-soft">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={goToPreviousWeek}
                  className="p-1.5 rounded-md hover:bg-cream-200 text-gray-600 shrink-0"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {DAYS.map((day, index) => {
                    const isSelected = selectedDay === day;
                    const isToday = isCurrentWeek && day === todayDay;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDate(addDaysToDateString(weekStarting, index))}
                        className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-md min-w-[2.5rem] sm:min-w-[2.75rem] transition-colors ${
                          isSelected
                            ? 'bg-primary text-white'
                            : isToday
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-cream-200 text-gray-700'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wide leading-none">
                          {DAY_LABELS[index]}
                        </span>
                        <span className="text-sm font-semibold leading-tight mt-1">{weekDates[index]}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={goToNextWeek}
                  className="p-1.5 rounded-md hover:bg-cream-200 text-gray-600 shrink-0"
                  aria-label="Next week"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goToPreviousWeek}
                className="p-2.5 rounded-lg hover:bg-cream-200 text-gray-600"
                aria-label="Previous week"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 px-1">
                Week of {formatWeekOfLabel(weekStarting)}
              </h2>
              <button
                type="button"
                onClick={goToNextWeek}
                className="p-2.5 rounded-lg hover:bg-cream-200 text-gray-600"
                aria-label="Next week"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
          <div
            className="inline-flex rounded-xl border border-cream-300 bg-cream-100 p-1"
            role="group"
            aria-label="Training plan view"
          >
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 text-sm font-bold rounded-[10px] transition-colors ${
                viewMode === 'day'
                  ? 'bg-cream-paper text-primary shadow-soft'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 text-sm font-bold rounded-[10px] transition-colors ${
                viewMode === 'week'
                  ? 'bg-cream-paper text-primary shadow-soft'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Full week
            </button>
          </div>
        </div>
        <div className="text-sm font-semibold text-gray-500">
          {isSaving ? (
            <span>Saving…</span>
          ) : showSaved ? (
            <span className="text-green-700">Saved</span>
          ) : null}
        </div>
      </div>

      {viewMode === 'day' ? (
        <div className="warm-card p-6">
          <DayWorkoutsEditor
            date={selectedDate}
            workouts={getWorkoutsForDate(selectedDate)}
            onUpdateDay={updateDayWorkouts}
          />
        </div>
      ) : (
        <div className="space-y-5">
          {DAYS.map((day, index) => {
            const date = addDaysToDateString(weekStarting, index);
            return (
              <div key={day} className="warm-card p-6">
                <DayWorkoutsEditor
                  date={date}
                  workouts={getWorkoutsForDate(date)}
                  onUpdateDay={updateDayWorkouts}
                  showDayLabel
                  dayLabel={day}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
