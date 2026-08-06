import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/shared/Button';
import { Input } from '@/src/components/shared/Input';
import { Select } from '@/src/components/shared/Select';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function parseSnack(mealString) {
  if (!mealString || typeof mealString !== 'string') {
    return { name: '', calories: '', protein: '', carbs: '', fat: '' };
  }
  const calMatch = mealString.match(/Cal:\s*(\d+)/i);
  const proteinMatch = mealString.match(/P:\s*(\d+)\s*g/i);
  const carbsMatch = mealString.match(/C:\s*(\d+)\s*g/i);
  const fatMatch = mealString.match(/F:\s*(\d+)\s*g/i);
  const nameMatch = mealString.match(
    /\s*\(\s*Cal:\s*\d+\s*,\s*P:\s*\d+g\s*,\s*C:\s*\d+g\s*,\s*F:\s*\d+g\s*\)\s*$/i
  );
  return {
    name: nameMatch
      ? mealString.slice(0, nameMatch.index).trim()
      : mealString.trim(),
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

  const dayOptions = DAYS.map((d) => ({
    value: d,
    label: d.charAt(0).toUpperCase() + d.slice(1),
  }));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b">
          <DialogTitle>
            {snacksUserLogged ? 'Edit Snack' : 'Log Snack'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <Select
            label="Day"
            options={dayOptions}
            value={day}
            onChange={(e) => setDay(e.target.value)}
            placeholder="Select day"
          />

          <Input
            label="Snack name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Greek yogurt"
          />

          <div className="grid grid-cols-4 gap-2">
            {[
              ['calories', 'Cal', calories, setCalories],
              ['protein', 'P', protein, setProtein],
              ['carbs', 'C', carbs, setCarbs],
              ['fat', 'F', fat, setFat],
            ].map(([key, label, value, setter]) => (
              <Input
                key={key}
                label={label}
                value={value}
                onChange={(e) => setter(e.target.value)}
                type="number"
                min="0"
                className="[&_input]:text-center"
              />
            ))}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex items-center justify-between gap-3 pt-2">
            {snacksUserLogged ? (
              <Button
                type="button"
                disabled={submitting}
                onClick={() => onDelete?.({ day })}
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Remove
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={submitting} variant="primary">
              {submitting ? 'Saving…' : snacksUserLogged ? 'Update Snack' : 'Log Snack'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
