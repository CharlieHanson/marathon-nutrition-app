// src/components/modals/AnalyticsModal.js
import React from 'react';
import {
  BarChart3,
  Dumbbell,
  Flame,
  Utensils,
  Droplets,
  X,
} from 'lucide-react';
import { macroColors } from '../../../shared/lib/macroColors';
import { calculateDayMacros } from '../../utils/mealHelpers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/shared/Button';
import { PageDecor } from '@/src/components/shared/PageDecor';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const calculateWeekStats = (mealPlan) => {
  const dayStats = [];
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let daysWithData = 0;

  DAYS.forEach((day) => {
    const dayMacros = calculateDayMacros(mealPlan?.[day]);
    dayStats.push({
      day: day.slice(0, 3).charAt(0).toUpperCase() + day.slice(1, 3),
      fullDay: day,
      ...dayMacros,
      hasData: dayMacros.calories > 0,
    });

    if (dayMacros.calories > 0) {
      totalCalories += dayMacros.calories;
      totalProtein += dayMacros.protein;
      totalCarbs += dayMacros.carbs;
      totalFat += dayMacros.fat;
      daysWithData++;
    }
  });

  return {
    dayStats,
    totals: {
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
    },
    averages: {
      calories: daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0,
      protein: daysWithData > 0 ? Math.round(totalProtein / daysWithData) : 0,
      carbs: daysWithData > 0 ? Math.round(totalCarbs / daysWithData) : 0,
      fat: daysWithData > 0 ? Math.round(totalFat / daysWithData) : 0,
    },
    daysWithData,
  };
};

const getTrainingInsight = (trainingPlan, dayStats) => {
  if (!trainingPlan) return null;

  const highIntensityDays = [];
  const restDays = [];

  DAYS.forEach((day) => {
    const dayData = trainingPlan[day];
    const dayMacros = dayStats.find((d) => d.fullDay === day);

    if (!dayMacros?.hasData) return;

    const workouts = dayData?.workouts || [];
    if (workouts.length === 0) {
      restDays.push(dayMacros.calories);
      return;
    }

    let hasHighIntensity = false;
    let hasRest = false;

    workouts.forEach((workout) => {
      const intensity = workout?.intensity || 'Medium';
      if (intensity === 'High') {
        hasHighIntensity = true;
      } else if (intensity === 'Recovery' || workout?.type?.toLowerCase() === 'rest') {
        hasRest = true;
      }
    });

    if (hasHighIntensity) {
      highIntensityDays.push(dayMacros.calories);
    } else if (hasRest) {
      restDays.push(dayMacros.calories);
    }
  });

  const avgHigh =
    highIntensityDays.length > 0
      ? Math.round(highIntensityDays.reduce((a, b) => a + b, 0) / highIntensityDays.length)
      : null;
  const avgRest =
    restDays.length > 0
      ? Math.round(restDays.reduce((a, b) => a + b, 0) / restDays.length)
      : null;

  return {
    avgHigh,
    avgRest,
    highCount: highIntensityDays.length,
    restCount: restDays.length,
  };
};

const SectionLabel = ({ children }) => (
  <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.9px] text-muted-foreground">
    {children}
  </p>
);

const SoftCard = ({ children, className = '' }) => (
  <div
    className={`rounded-[18px] border border-cream-300 bg-cream-paper p-4 shadow-soft ${className}`}
  >
    {children}
  </div>
);

const RowCard = ({ children }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-cream-300 bg-cream-50 px-3 py-2.5">
    {children}
  </div>
);

export const AnalyticsModal = ({
  isOpen,
  onClose,
  mealPlan,
  userProfile: _userProfile,
  trainingPlan,
}) => {
  const { dayStats, totals, averages, daysWithData } = calculateWeekStats(mealPlan);
  const trainingInsight = getTrainingInsight(trainingPlan, dayStats);

  const macroDistribution = [
    {
      name: 'Protein',
      value: averages.protein * 4,
      grams: averages.protein,
      color: macroColors.protein,
    },
    {
      name: 'Carbs',
      value: averages.carbs * 4,
      grams: averages.carbs,
      color: macroColors.carbs,
    },
    {
      name: 'Fat',
      value: averages.fat * 9,
      grams: averages.fat,
      color: macroColors.fat,
    },
  ];

  const totalMacroCalories = macroDistribution.reduce((sum, m) => sum + m.value, 0);
  const maxCalories = Math.max(...dayStats.map((d) => d.calories), 1);

  const averageTiles = [
    {
      key: 'calories',
      icon: Flame,
      value: String(averages.calories),
      label: 'calories',
      color: macroColors.calories,
    },
    {
      key: 'protein',
      icon: Dumbbell,
      value: `${averages.protein}g`,
      label: 'protein',
      color: macroColors.protein,
    },
    {
      key: 'carbs',
      icon: Utensils,
      value: `${averages.carbs}g`,
      label: 'carbs',
      color: macroColors.carbs,
    },
    {
      key: 'fat',
      icon: Droplets,
      value: `${averages.fat}g`,
      label: 'fat',
      color: macroColors.fat,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showClose={false}
        className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 bg-cream border-cream-300 sm:rounded-2xl"
      >
        <PageDecor className="opacity-70" />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="flex items-start gap-3 px-5 pb-4 pt-5">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <BarChart3 className="h-[18px] w-[18px] text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.9px] text-muted-foreground">
                Analytics
              </p>
              <DialogTitle className="text-xl font-bold leading-snug text-gray-900">
                Weekly Analytics
              </DialogTitle>
              <DialogDescription className="sr-only">
                Daily averages, macro distribution, and training sync for this week
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-gray-700 hover:bg-cream-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-5">
            {daysWithData === 0 ? (
              <div className="flex flex-col items-center px-4 py-12 text-center">
                <BarChart3 className="h-12 w-12 text-cream-300" strokeWidth={1.5} />
                <p className="mt-3 text-base font-bold text-muted-foreground">No meal data yet</p>
                <p className="mt-1 text-sm text-muted-foreground/80">
                  Generate or log some meals to see analytics
                </p>
              </div>
            ) : (
              <>
                <SoftCard>
                  <SectionLabel>Daily Averages ({daysWithData} days)</SectionLabel>
                  <div className="grid grid-cols-2 gap-2.5">
                    {averageTiles.map((tile) => {
                      const Icon = tile.icon;
                      return (
                        <div
                          key={tile.key}
                          className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3"
                        >
                          <Icon className="h-5 w-5" style={{ color: tile.color }} strokeWidth={1.75} />
                          <p
                            className="text-xl font-black tabular-nums leading-none"
                            style={{ color: tile.color }}
                          >
                            {tile.value}
                          </p>
                          <p className="text-[11px] font-semibold text-muted-foreground">
                            {tile.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </SoftCard>

                <SoftCard>
                  <SectionLabel>Daily Calories</SectionLabel>
                  <div className="flex h-40 items-end justify-between gap-1 px-1 pt-2 sm:gap-1.5">
                    {dayStats.map((day) => {
                      const heightPct = Math.max((day.calories / maxCalories) * 100, 3);
                      return (
                        <div
                          key={day.fullDay}
                          className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                        >
                          <div className="flex w-full flex-1 items-end justify-center">
                            <div
                              className={`w-[70%] max-w-[2rem] rounded-md ${
                                day.hasData ? 'bg-primary' : 'bg-border'
                              }`}
                              style={{
                                height: `${heightPct}%`,
                                minHeight: 4,
                              }}
                              title={
                                day.hasData
                                  ? `${day.fullDay}: ${day.calories} cal`
                                  : `${day.fullDay}: no data`
                              }
                            />
                          </div>
                          <span className="text-[11px] font-bold uppercase text-muted-foreground">
                            {day.day}
                          </span>
                          <span className="text-[10px] font-semibold tabular-nums text-muted-foreground/80">
                            {day.hasData ? day.calories : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </SoftCard>

                <SoftCard>
                  <SectionLabel>Macro Distribution</SectionLabel>
                  <div className="space-y-2.5">
                    {macroDistribution.map((macro) => {
                      const percentage =
                        totalMacroCalories > 0
                          ? Math.round((macro.value / totalMacroCalories) * 100)
                          : 0;
                      return (
                        <RowCard key={macro.name}>
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span
                              className="h-4 w-4 shrink-0 rounded-full"
                              style={{ backgroundColor: macro.color }}
                            />
                            <span className="text-sm font-bold text-gray-900">{macro.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-sm font-extrabold tabular-nums text-gray-900">
                              {macro.grams}g
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground">
                              ({percentage}%)
                            </span>
                          </div>
                        </RowCard>
                      );
                    })}
                  </div>
                  <p className="mt-2.5 text-[11px] italic text-muted-foreground/80">
                    Based on calories: Protein &amp; Carbs = 4 cal/g, Fat = 9 cal/g
                  </p>
                </SoftCard>

                {trainingInsight && (trainingInsight.avgHigh || trainingInsight.avgRest) ? (
                  <SoftCard>
                    <div className="mb-3 flex items-center gap-2">
                      <Dumbbell className="h-[18px] w-[18px] text-primary" strokeWidth={1.75} />
                      <p className="text-sm font-bold text-gray-900">Training &amp; Nutrition Sync</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {trainingInsight.avgHigh ? (
                        <div>
                          <p className="mb-1 text-xs font-semibold text-muted-foreground">
                            High intensity days
                          </p>
                          <p className="text-lg font-black tabular-nums text-gray-900">
                            {trainingInsight.avgHigh} cal
                          </p>
                          <p className="text-[11px] text-muted-foreground/80">
                            {trainingInsight.highCount} day(s)
                          </p>
                        </div>
                      ) : null}
                      {trainingInsight.avgRest ? (
                        <div>
                          <p className="mb-1 text-xs font-semibold text-muted-foreground">
                            Rest days
                          </p>
                          <p className="text-lg font-black tabular-nums text-gray-900">
                            {trainingInsight.avgRest} cal
                          </p>
                          <p className="text-[11px] text-muted-foreground/80">
                            {trainingInsight.restCount} day(s)
                          </p>
                        </div>
                      ) : null}
                    </div>
                    {trainingInsight.avgHigh && trainingInsight.avgRest ? (
                      <p className="mt-3 text-[11px] font-semibold text-muted-foreground">
                        {trainingInsight.avgHigh > trainingInsight.avgRest
                          ? '✓ Good! Eating more on training days.'
                          : '⚠️ Consider eating more on high intensity days.'}
                      </p>
                    ) : null}
                  </SoftCard>
                ) : null}

                <SoftCard>
                  <SectionLabel>Week Totals</SectionLabel>
                  <div className="space-y-2.5">
                    {[
                      {
                        label: 'Total Calories',
                        value: `${totals.calories.toLocaleString()} cal`,
                      },
                      { label: 'Total Protein', value: `${totals.protein}g` },
                      { label: 'Total Carbs', value: `${totals.carbs}g` },
                      { label: 'Total Fat', value: `${totals.fat}g` },
                    ].map((row) => (
                      <RowCard key={row.label}>
                        <span className="text-sm font-semibold text-muted-foreground">
                          {row.label}
                        </span>
                        <span className="text-sm font-extrabold tabular-nums text-gray-900">
                          {row.value}
                        </span>
                      </RowCard>
                    ))}
                  </div>
                </SoftCard>
              </>
            )}
          </div>

          <div className="relative z-10 border-t border-cream-300 bg-cream-50/80 px-5 py-4">
            <Button onClick={onClose} variant="primary" className="w-full">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
