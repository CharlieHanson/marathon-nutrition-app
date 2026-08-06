import React from 'react';
import { ChevronRight, Check, Droplet } from 'lucide-react';

const TONE_BADGE_CLASSES = {
  positive: 'bg-primary-50 text-primary',
  attention: 'bg-secondary-50 text-secondary-700',
  neutral: 'bg-cream-200 text-gray-600',
};

const RING_SIZE = 56;
const RING_STROKE = 6;

/** Small progress ring for the day's overall fuel balance; dashed "--" when unknown. */
function BalanceRing({ position }) {
  const known = position != null;
  const r = (RING_SIZE - RING_STROKE) / 2;
  const c = 2 * Math.PI * r;
  const pct = known ? Math.min(100, Math.max(0, position)) / 100 : 0;

  return (
    <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={r}
          fill="none"
          strokeWidth={RING_STROKE}
          className="text-cream-300"
          stroke="currentColor"
        />
        {known ? (
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={r}
            fill="none"
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            className="text-primary"
            stroke="currentColor"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
          />
        ) : (
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={r}
            fill="none"
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray="3 6"
            className="text-cream-400"
            stroke="currentColor"
          />
        )}
      </svg>
      {!known ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-400">--</span>
        </div>
      ) : null}
    </div>
  );
}

function TimelineStop({ stop }) {
  return (
    <div className="flex w-1/3 flex-col items-center px-1 text-center">
      {stop.isNow ? (
        <span className="motion-safe:animate-pulse mb-1 -mt-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground">
          Now
        </span>
      ) : (
        <span className="mb-1 -mt-1 h-[15px]" aria-hidden="true" />
      )}
      <span
        className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 text-base ${
          stop.isNow
            ? 'border-primary bg-primary-50'
            : stop.isDone
              ? 'border-primary-200 bg-primary-50/60'
              : 'border-cream-300 bg-cream-paper'
        }`}
      >
        {stop.isDone && !stop.isNow ? (
          <Check className="h-4 w-4 text-primary" strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <span aria-hidden="true">{stop.icon}</span>
        )}
      </span>
      <span className="mt-2 text-xs font-bold text-gray-800">{stop.title}</span>
      <span className="mt-0.5 text-[10.5px] font-medium leading-tight text-gray-400">{stop.sub}</span>
    </div>
  );
}

/**
 * Dashboard module that interprets today's nutrition alongside today's
 * training to surface a fueling/recovery insight. Framed around supporting
 * performance and recovery — never "calories earned" or net-calorie math.
 *
 * `timeline` (see fuelRecoveryTimeline.js) is null whenever there's no
 * meaningful workout logged today (rest day, no data, guest) — in that case
 * the fueling-window / hydration / tip sections are omitted entirely rather
 * than shown empty, and the hero copy above already explains why.
 */
export const FuelRecoveryCard = ({
  status,
  tone = 'neutral',
  title,
  description,
  balancePosition = null,
  recommendation = null,
  hasNutritionData = false,
  hasTrainingData = false,
  timeline = null,
  onOpen,
}) => {
  const badgeClasses = TONE_BADGE_CLASSES[tone] || TONE_BADGE_CLASSES.neutral;

  const heroLabel = [
    `Fuel and recovery: ${status}`,
    title,
    recommendation ? `Suggested next step: ${recommendation}` : null,
    'Open details',
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <div
      className="warm-card p-4 sm:p-5"
      data-has-nutrition-data={hasNutritionData}
      data-has-training-data={hasTrainingData}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="text-[12px] font-bold tracking-widest text-gray-500 uppercase">
          Fuel &amp; Recovery
        </span>
        <span
          className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badgeClasses}`}
        >
          {status}
        </span>
      </div>

      <button
        type="button"
        onClick={onOpen}
        aria-label={heroLabel}
        className="-mx-1 mt-3 flex w-full items-center gap-4 rounded-xl px-1 py-1 text-left transition-colors hover:bg-cream-50/60 active:bg-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
      >
        <BalanceRing position={balancePosition} />
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold leading-snug text-gray-900 sm:text-lg">{title}</p>
          {description ? (
            <p className="mt-1 text-sm font-medium text-gray-600">{description}</p>
          ) : null}
        </div>
        <ChevronRight className="h-[18px] w-[18px] shrink-0 text-gray-400" aria-hidden="true" />
      </button>

      {timeline ? (
        <>
          <div className="mt-5">
            <p className="flex flex-wrap items-baseline gap-x-1.5 text-xs font-bold text-gray-700">
              Today&apos;s fueling window
              <span className="font-medium normal-case tracking-normal text-gray-400">
                · {timeline.workoutLabel}
                {timeline.intensity ? `, ${timeline.intensity} intensity` : ''}
              </span>
            </p>
            <div className="relative mt-6">
              <div
                className="absolute left-[16.5%] right-[16.5%] top-[18px] h-[3px] rounded-full bg-gradient-to-r from-secondary-300 via-primary-200 to-primary opacity-50"
                aria-hidden="true"
              />
              <div className="relative flex justify-between">
                {timeline.stops.map((stop) => (
                  <TimelineStop key={stop.key} stop={stop} />
                ))}
              </div>
            </div>
          </div>

          {timeline.hydration ? (
            <div className="mt-5 rounded-xl border border-border bg-cream-100 px-4 py-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-700">Hydration</span>
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {timeline.hydration.bumpLabel}
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Droplet key={i} className="h-4 w-4 text-primary-200" />
                ))}
              </div>
              <p className="mt-2 text-xs font-medium text-gray-500">
                ~{timeline.hydration.amount} mL suggested around today&apos;s{' '}
                {timeline.workoutLabel.toLowerCase()}
              </p>
            </div>
          ) : null}

          {timeline.tip ? (
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-secondary-50 px-4 py-3.5">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream-paper text-sm"
                aria-hidden="true"
              >
                💡
              </span>
              <p className="text-xs font-medium leading-relaxed text-gray-700">{timeline.tip}</p>
            </div>
          ) : null}
        </>
      ) : null}

      {recommendation ? (
        <button
          type="button"
          onClick={onOpen}
          className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          {recommendation}
        </button>
      ) : null}
    </div>
  );
};
