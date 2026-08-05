import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Minus } from 'lucide-react';
import { Button } from '@/src/components/shared/Button';
import { FinalCta, MarketingShell } from './MarketingShell';
import { WaitlistModal } from '@/src/components/modals/WaitlistModal';
import { cn } from '@/src/lib/utils';

/** Free = available now. Plus = planned / in development. */
const FEATURE_MATRIX = [
  {
    category: 'Planning',
    rows: [
      { name: 'Weekly AI meal plans', free: true, plus: true },
      { name: 'Training-aware macros', free: true, plus: true },
      { name: 'Food likes, dislikes & restrictions', free: true, plus: true },
      { name: 'Recipes & grocery lists', free: true, plus: true },
      { name: 'Meal ratings that improve next week', free: true, plus: true },
      { name: 'Meal analytics overview', free: true, plus: true },
      { name: 'Web app access', free: true, plus: true },
      { name: 'iOS app (when available)', free: true, plus: true },
    ],
  },
  {
    category: 'Limits & models',
    rows: [
      {
        name: 'Daily generation rate limits',
        free: 'Standard',
        plus: 'Higher / none',
        plusInDev: true,
      },
      {
        name: 'AI model tier',
        free: 'Standard',
        plus: 'Advanced models',
        plusInDev: true,
      },
    ],
  },
  {
    category: 'Additional Features',
    rows: [
      {
        name: 'Strava integration',
        free: false,
        plus: true,
        plusInDev: true,
      },
      {
        name: 'Assistant chatbot',
        free: false,
        plus: true,
        plusInDev: true,
      },
      {
        name: 'Early access to new features',
        free: false,
        plus: true,
        plusInDev: true,
      },
    ],
  },
];

function CellValue({ value, isPlus = false, inDev = false }) {
  if (value === true) {
    return (
      <span className="inline-flex flex-col items-center gap-1">
        <Check className="h-5 w-5 text-primary" strokeWidth={2.5} aria-label="Included" />
        {isPlus && inDev ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            In development
          </span>
        ) : null}
      </span>
    );
  }
  if (value === false) {
    return <Minus className="h-5 w-5 text-muted-foreground/40" aria-label="Not included" />;
  }
  return (
    <span className="inline-flex flex-col items-center gap-1 text-center">
      <span
        className={cn(
          'text-sm font-semibold',
          isPlus ? 'text-primary' : 'text-gray-700'
        )}
      >
        {value}
      </span>
      {isPlus && inDev ? (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          In development
        </span>
      ) : null}
    </span>
  );
}

export const PricingPage = () => {
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <MarketingShell>
      <section className="px-4 pb-6 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Pricing
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to plan the week is free today. Plus is in development—join the waitlist if you want more headroom and integrations later.
          </p>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-card border border-border bg-card p-6 shadow-soft sm:p-8">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">Free</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">$0</p>
            <p className="mt-1 text-sm text-muted-foreground">Available now</p>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
              Full meal planning for athletes—training input, preferences, weekly plans, recipes, grocery lists, and ratings.
            </p>
            <Link href="/login" className="mt-6 block">
              <Button variant="primary" size="lg" className="w-full">
                Get started free
              </Button>
            </Link>
          </div>

          <div className="rounded-card border-2 border-primary/30 bg-mint/30 p-6 shadow-soft sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold uppercase tracking-wider text-primary">Plus</p>
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                In development
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">TBD</p>
            <p className="mt-1 text-sm text-muted-foreground">Coming later</p>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
              Higher limits, stronger models, Strava, an assistant chatbot, and more—for athletes who want to go further once we ship it.
            </p>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="mt-6 w-full"
              onClick={() => setWaitlistOpen(true)}
            >
              Join the Plus waitlist
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-card border border-border bg-card shadow-soft">
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] border-b border-border bg-cream-50/80 px-3 py-3 sm:px-5">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground sm:text-sm">
              Feature
            </div>
            <div className="text-center text-xs font-bold uppercase tracking-wider text-gray-800 sm:text-sm">
              Free
            </div>
            <div className="text-center text-xs font-bold uppercase tracking-wider text-primary sm:text-sm">
              Plus
            </div>
          </div>

          {FEATURE_MATRIX.map((group) => (
            <div key={group.category}>
              <div className="border-b border-border bg-mint/20 px-3 py-2 sm:px-5">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  {group.category}
                </p>
              </div>
              {group.rows.map((row) => (
                <div
                  key={row.name}
                  className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] items-center border-b border-border/70 px-3 py-3 last:border-b-0 sm:px-5 sm:py-3.5"
                >
                  <div className="pr-2 text-sm font-medium text-gray-800">{row.name}</div>
                  <div className="flex justify-center">
                    <CellValue value={row.free} />
                  </div>
                  <div className="flex justify-center">
                    <CellValue
                      value={row.plus}
                      isPlus
                      inDev={row.plusInDev === true}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-4xl text-center text-sm text-muted-foreground">
          Plus features marked &ldquo;In development&rdquo; are not available yet. Joining the waitlist doesn&apos;t charge you or change Free access.
        </p>
      </section>

      <FinalCta headline="Start free. Level up later with Plus." />

      <WaitlistModal
        isOpen={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        userType="individual"
        title="Join the Plus waitlist"
        description="Leave your details and tell us what you’d use Plus for. We’ll email you when it’s ready."
      />
    </MarketingShell>
  );
};

export default PricingPage;
