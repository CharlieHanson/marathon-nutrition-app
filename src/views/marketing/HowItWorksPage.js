import React from 'react';
import Link from 'next/link';
import { Button } from '@/src/components/shared/Button';
import { FinalCta, MarketingShell, PhoneFrame } from './MarketingShell';

const STEPS = [
  {
    number: '1',
    title: 'Tell us this week’s training',
    description:
      'Log workouts, intensity, and when you train so fuel matches the load—morning long runs and evening lifts don’t get the same plate.',
    screen: '/mobile-screenshots/training.png',
    screenAlt: 'Training day in the app',
  },
  {
    number: '2',
    title: 'Set what you’ll actually eat',
    description:
      'Foods you love, foods you skip, and any restrictions that never get ignored. Preferences stick across every plan.',
    screen: '/mobile-screenshots/preferences.png',
    screenAlt: 'Food preferences in the app',
  },
  {
    number: '3',
    title: 'Get the week, rate what worked',
    description:
      'Your plan arrives with macros on every meal. Score what you liked so the next week is better.',
    screen: '/mobile-screenshots/meals.png',
    screenAlt: 'Daily meal plan in the app',
  },
];

export const HowItWorksPage = () => (
  <MarketingShell>
    <section className="px-4 pb-6 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          How it works
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          From empty week to a plan you can cook—in three steps.
        </p>
      </div>
    </section>

    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-16 sm:space-y-24">
        {STEPS.map((step, index) => (
          <div
            key={step.number}
            className="grid items-center gap-10 md:grid-cols-2 md:gap-14"
          >
            <div className={index % 2 === 1 ? 'md:order-2' : undefined}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {step.number}
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {step.title}
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-gray-600">
                {step.description}
              </p>
            </div>
            <div
              className={
                index % 2 === 1 ? 'md:order-1 flex justify-center' : 'flex justify-center'
              }
            >
              <PhoneFrame src={step.screen} alt={step.screenAlt} size="md" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Link href="/login">
          <Button variant="primary" size="lg">
            Get started
          </Button>
        </Link>
      </div>
    </section>

    <FinalCta headline="Your week of training. Your meals." />
  </MarketingShell>
);

export default HowItWorksPage;
