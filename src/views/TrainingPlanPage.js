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

function ordinalSuffix(n) {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

function formatSelectedDateLabel(localDate) {
  if (!localDate) return '';
  const d = new Date(`${localDate}T00:00:00`);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const day = d.getDate();
  return `${weekday}, ${month} ${day}${ordinalSuffix(day)}`;
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
    <div className={showDayLabel ? 'space-y-3' : 'space-y-3'}>
      {showDayLabel ? (
        <h3 className="text-lg font-bold text-gray-900 capitalize">{dayLabel}</h3>
      ) : null}

      {selectedWorkouts.map((workout, index) => (
        <div
          key={index}
          className="flex gap-3 p-3 bg-cream-50 border border-cream-300 rounded-card shadow-soft"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-w-0">
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">Workout</label>
              <div className="flex items-center gap-2">
                {workout.type ? getWorkoutIcon(workout.type) : null}
                <select
                  value={workout.type || ''}
                  onChange={(e) => updateWorkout(index, 'type', e.target.value)}
                  className="flex-1 text-sm px-3 py-1.5 border border-cream-300 rounded-md bg-cream-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary h-9"
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
              <Label className="text-xs text-muted-foreground mb-1">Distance/Duration</Label>
              <Input
                type="text"
                placeholder="e.g. 5k, 30 min"
                value={workout.distance || ''}
                onChange={(e) => updateWorkout(index, 'distance', e.target.value)}
                className="h-9 text-sm bg-cream-200"
              />
            </div>
            <div className="flex flex-col">
              <Select
                label="Intensity"
                value={workout.intensity || 'Medium'}
                onChange={(e) => updateWorkout(index, 'intensity', e.target.value)}
                options={INTENSITY_LEVELS.map((level) => ({ value: level, label: level }))}
                placeholder="Intensity"
                className="[&_button]:h-9 [&_button]:text-sm [&_button]:bg-cream-200 [&_label]:text-xs [&_label]:text-muted-foreground [&_label]:mb-1"
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
                className="[&_button]:h-9 [&_button]:text-sm [&_button]:bg-cream-200 [&_label]:text-xs [&_label]:text-muted-foreground [&_label]:mb-1"
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
              <Trash2 className="w-4 h-4" />
            </Button>
          ) : null}
        </div>
      ))}

      {selectedWorkouts.length < MAX_WORKOUTS ? (
        <Button
          type="button"
          variant="outline"
          onClick={addWorkout}
          className="w-full border-dashed border-cream-300 text-primary hover:bg-primary/5"
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
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 min-h-[28px]">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              {viewMode === 'day'
                ? formatSelectedDateLabel(selectedDate)
                : `Week of ${formatWeekOfLabel(weekStarting)}`}
            </h2>
            <div
              className="inline-flex rounded-xl border border-cream-300 bg-cream-100 p-0.5"
              role="group"
              aria-label="Training plan view"
            >
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 text-xs font-bold rounded-[10px] transition-colors ${
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
                className={`px-3 py-1.5 text-xs font-bold rounded-[10px] transition-colors ${
                  viewMode === 'week'
                    ? 'bg-cream-paper text-primary shadow-soft'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Full week
              </button>
            </div>
            {viewMode === 'week' ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goToPreviousWeek}
                  className="p-2 rounded-lg hover:bg-cream-200 text-gray-600"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={goToNextWeek}
                  className="p-2 rounded-lg hover:bg-cream-200 text-gray-600"
                  aria-label="Next week"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ) : null}
          </div>
          <div className="text-xs font-semibold text-gray-500">
            {isSaving ? (
              <span>Saving…</span>
            ) : showSaved ? (
              <span className="text-green-700">Saved</span>
            ) : null}
          </div>
        </div>

        {viewMode === 'day' ? (
          <div className="w-fit max-w-full mx-auto rounded-xl border border-cream-300 bg-cream-paper px-1.5 py-1.5 shadow-soft">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goToPreviousWeek}
                className="p-2 rounded-lg hover:bg-cream-200 text-gray-600 shrink-0"
                aria-label="Previous week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 sm:gap-1.5">
                {DAYS.map((day, index) => {
                  const isSelected = selectedDay === day;
                  const isToday = isCurrentWeek && day === todayDay;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDate(addDaysToDateString(weekStarting, index))}
                      className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg min-w-[2.75rem] sm:min-w-[3rem] transition-colors ${
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
                className="p-2 rounded-lg hover:bg-cream-200 text-gray-600 shrink-0"
                aria-label="Next week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {viewMode === 'day' ? (
        <div className="warm-card p-4">
          <DayWorkoutsEditor
            date={selectedDate}
            workouts={getWorkoutsForDate(selectedDate)}
            onUpdateDay={updateDayWorkouts}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS.map((day, index) => {
            const date = addDaysToDateString(weekStarting, index);
            return (
              <div key={day} className="warm-card p-4">
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
