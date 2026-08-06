import React from 'react';
import { Skeleton } from '@/src/components/ui/skeleton';

export const MealCardSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-3 w-16" />
    <Skeleton className="h-16 w-full" />
    <div className="flex justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
);

export const DayCardSkeleton = () => (
  <div className="space-y-5">
    <div className="flex items-baseline justify-between gap-4">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-5 w-40" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-16 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Day strip + controls + day card — matches day view */
export const MealPlanSkeleton = () => (
  <div className="space-y-8 max-w-5xl mx-auto">
    <div className="space-y-2">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <div className="flex w-fit max-w-full items-center gap-0.5 rounded-lg border border-border bg-card px-1.5 py-1.5 shadow-soft">
        <Skeleton className="h-6 w-6 rounded-md shrink-0" />
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-9 w-9 sm:w-10 rounded-md" />
        ))}
        <Skeleton className="h-6 w-6 rounded-md shrink-0" />
      </div>
      <Skeleton className="h-9 w-36 rounded-xl" />
    </div>

    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-9 w-24 rounded-xl" />
      <Skeleton className="h-9 w-28 rounded-xl" />
      <Skeleton className="h-9 w-24 rounded-xl" />
    </div>

    <div className="rounded-card border border-border bg-card p-6 shadow-soft">
      <DayCardSkeleton />
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="mx-auto space-y-4 max-w-3xl">
    <div className="mb-1 space-y-2">
      <Skeleton className="h-9 w-56 max-w-full" />
      <Skeleton className="h-5 w-48" />
    </div>

    <div className="flex items-center gap-3.5 rounded-2xl bg-muted/80 px-4 py-4 sm:px-[18px]">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56 max-w-full" />
      </div>
    </div>

    <div className="rounded-card border border-border bg-card overflow-hidden">
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <Skeleton className="h-36 w-36 rounded-full shrink-0" />
          <div className="w-full sm:flex-1 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 pb-4 sm:px-5 sm:pb-5">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
        ))}
      </div>
    </div>

    <Skeleton className="h-[76px] w-full rounded-2xl" />
  </div>
);

export const TrainingPlanSkeleton = () => (
  <div className="space-y-8 max-w-5xl mx-auto">
    <div className="space-y-2">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex w-fit max-w-full items-center gap-0.5 rounded-lg border border-border bg-card px-1.5 py-1.5 shadow-soft">
          <Skeleton className="h-6 w-6 rounded-md shrink-0" />
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-9 w-9 sm:w-10 rounded-md" />
          ))}
          <Skeleton className="h-6 w-6 rounded-md shrink-0" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>

    <div className="rounded-card border border-border bg-card p-6 space-y-4 shadow-soft">
      <div className="flex gap-4 p-4 rounded-card border border-border bg-muted/40">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-11 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  </div>
);

export const PreferencesSkeleton = () => (
  <div className="space-y-8 max-w-5xl mx-auto">
    <div className="space-y-2">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-full max-w-md" />
    </div>

    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-cream-50 border border-cream-300 rounded-card shadow-soft overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          {i === 1 ? (
            <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => (
                <Skeleton key={j} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="space-y-8 max-w-5xl mx-auto">
    <Skeleton className="h-8 w-28" />
    {[1, 2, 3].map((section) => (
      <div key={section} className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </div>
        <div className="rounded-card border border-border bg-card p-5 sm:p-6">
          {section === 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-11 w-full rounded-[13px]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);
