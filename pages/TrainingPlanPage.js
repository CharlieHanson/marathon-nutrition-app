import React from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';

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

export const TrainingPlanPage = ({ trainingPlan, onUpdate }) => {
  const addWorkout = (day) => {
    onUpdate(day, 'workouts', [
      ...(trainingPlan[day].workouts || []),
      { type: '', distance: '', intensity: 5, notes: '' }
    ]);
  };

  const removeWorkout = (day, index) => {
    const workouts = [...trainingPlan[day].workouts];
    workouts.splice(index, 1);
    onUpdate(day, 'workouts', workouts);
  };

  const updateWorkout = (day, index, field, value) => {
    const workouts = [...trainingPlan[day].workouts];
    workouts[index][field] = value;
    onUpdate(day, 'workouts', workouts);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Weekly Training Schedule
        </h2>
        
        <div className="space-y-6">
          {Object.keys(trainingPlan).map((day) => (
            <div key={day} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900 capitalize flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {day}
                </h3>
                <button
                  onClick={() => addWorkout(day)}
                  className="text-sm text-primary hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Workout
                </button>
              </div>

              {/* Multiple workouts per day */}
              <div className="space-y-3">
                {(trainingPlan[day].workouts || [{ type: '', distance: '', intensity: 5, notes: '' }]).map((workout, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded">
                    <select
                      value={workout.type}
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

                    <input
                      type="text"
                      placeholder="Distance/Duration"
                      value={workout.distance}
                      onChange={(e) => updateWorkout(day, index, 'distance', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />

                    {/* Intensity Slider - NEW */}
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600 mb-1">
                        Intensity: {workout.intensity}/10
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={workout.intensity}
                        onChange={(e) => updateWorkout(day, index, 'intensity', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

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
          ))}
        </div>
      </div>
    </div>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default TrainingPlanPage;