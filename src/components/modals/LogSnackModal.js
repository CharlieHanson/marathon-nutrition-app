// src/components/modals/LogSnackModal.js
import React, { useEffect, useState } from 'react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function parseSnack(mealString) {
  if (!mealString || typeof mealString !== 'string') {
    return { name: '', calories: '', protein: '', carbs: '', fat: '' };
  }
  const calMatch = mealString.match(/Cal:\s*(\d+)/i);
  const proteinMatch = mealString.match(/P:\s*(\d+)\s*g/i);
  const carbsMatch = mealString.match(/C:\s*(\d+)\s*g/i);
  const fatMatch = mealString.match(/F:\s*(\d+)\s*g/i);
  const nameMatch = mealString.match(/^(.+?)\s*\(/);
  return {
    name: nameMatch ? nameMatch[1].trim() : mealString.trim(),
    calories: calMatch ? calMatch[1] : '',
    protein: proteinMatch ? proteinMatch[1] : '',
    carbs: carbsMatch ? carbsMatch[1] : '',
    fat: fatMatch ? fatMatch[1] : '',
  };
}

export function LogSnackModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  defaultDay = 'monday',
  existingSnack = '',
  snacksUserLogged = false,
  submitting = false,
}) {
  const [day, setDay] = useState(defaultDay);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setDay(defaultDay);
    setError('');
    if (snacksUserLogged && existingSnack) {
      const parsed = parseSnack(existingSnack);
      setName(parsed.name);
      setCalories(parsed.calories);
      setProtein(parsed.protein);
      setCarbs(parsed.carbs);
      setFat(parsed.fat);
    } else {
      setName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
    }
  }, [isOpen, defaultDay, existingSnack, snacksUserLogged]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Snack name is required');
      return;
    }
    const macros = {
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
    };
    if (!Number.isFinite(macros.calories) || macros.calories < 1) {
      setError('Calories must be at least 1');
      return;
    }
    for (const key of ['protein', 'carbs', 'fat']) {
      if (!Number.isFinite(macros[key]) || macros[key] < 0) {
        setError(`${key} must be a non-negative number`);
        return;
      }
    }
    setError('');
    onSubmit({ day, name: trimmed, ...macros });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {snacksUserLogged ? 'Edit Snack' : 'Log Snack'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-600">Day</label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-600">Snack name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="e.g. Greek yogurt"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              ['calories', 'Cal', calories, setCalories],
              ['protein', 'P', protein, setProtein],
              ['carbs', 'C', carbs, setCarbs],
              ['fat', 'F', fat, setFat],
            ].map(([key, label, value, setter]) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-semibold text-gray-500">{label}</label>
                <input
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  type="number"
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-2 py-2 text-center"
                />
              </div>
            ))}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex items-center justify-between gap-3 pt-2">
            {snacksUserLogged ? (
              <button
                type="button"
                disabled={submitting}
                onClick={() => onDelete?.({ day })}
                className="text-sm font-semibold text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : snacksUserLogged ? 'Update Snack' : 'Log Snack'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
