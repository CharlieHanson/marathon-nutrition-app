import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Check,
  Clock,
  Shield,
  Users,
} from 'lucide-react';
import { Button } from '@/src/components/shared/Button';
import { cn } from '@/src/lib/utils';
import { RevealOnScroll } from '../marketing/RevealOnScroll';
import { WaitlistModal } from '@/src/components/modals/WaitlistModal';

const OUTCOMES = [
  'Macro bounds your clients can’t break',
  'Compliance without spreadsheets',
  'Invite codes that onboard in minutes',
];

const FEATURES = [
  {
    icon: Users,
    title: 'Client dashboard',
    body: 'See every client in one place—who’s active, who needs a check-in, and who’s on track.',
  },
  {
    icon: Shield,
    title: 'Macro boundaries',
    body: 'Set calories and macros per client. AI plans stay inside your guardrails on every meal.',
  },
  {
    icon: BarChart3,
    title: 'Compliance & ratings',
    body: 'Follow weekly adherence, meal scores, and notes so you adjust guidance—not rebuild plans.',
  },
  {
    icon: Clock,
    title: 'Hours back every week',
    body: 'Clients log training and generate plans within your parameters. You review and refine.',
  },
];

const STEPS = [
  {
    number: '1',
    title: 'Get your invite code',
    description:
      'Join Pro and share a simple 8-character code with clients by email, text, or your site.',
  },
  {
    number: '2',
    title: 'Set their boundaries',
    description:
      'When a client connects, define macro ranges and notes. Guidance shows up when they generate plans.',
  },
  {
    number: '3',
    title: 'Monitor and adjust',
    description:
      'Track compliance, view ratings, leave feedback, and update bounds as training evolves.',
  },
];

const WHY_PRO = [
  {
    title: 'Persistent client history',
    body: 'Plans and ratings stick across weeks—not lost when a chat ends.',
  },
  {
    title: 'Hard macro enforcement',
    body: 'Min/max bounds on calories and macros, not soft suggestions.',
  },
  {
    title: 'Automatic compliance views',
    body: 'Dashboards instead of hand-built spreadsheets.',
  },
  {
    title: 'Invite-code onboarding',
    body: 'Clients connect with an 8-character code, not back-and-forth threads.',
  },
];

function BrandPro({ className = 'text-2xl sm:text-3xl' }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="brand-wordmark" aria-label="Alimenta Pro">
        <span className="text-primary">Al</span>
        <span className="text-gray-800">imenta</span>
      </span>
      <span className="rounded-full bg-primary/12 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-primary">
        Pro
      </span>
    </div>
  );
}

function WaitlistButton({ size = 'lg', className = '', light = false, onClick }) {
  return (
    <Button
      type="button"
      variant="primary"
      size={size}
      icon={ArrowRight}
      className={cn(
        light ? 'bg-cream text-primary hover:bg-white hover:text-primary' : '',
        className
      )}
      onClick={onClick}
    >
      Join waitlist
    </Button>
  );
}

export const ProLandingPage = () => {
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream text-foreground">
      <nav className="fixed top-0 z-50 w-full border-b border-cream-300/60 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/pro" className="shrink-0">
            <BrandPro />
          </Link>
          <WaitlistButton size="sm" onClick={() => setWaitlistOpen(true)} />
        </div>
      </nav>

      <main className="pt-16">
        <section className="relative overflow-hidden px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-animated-hero"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-16 top-0 h-[70%] w-[55%] rounded-full bg-primary/15 blur-3xl animate-blob"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-20 bottom-0 h-[55%] w-[50%] rounded-full bg-peach/70 blur-3xl animate-blob animation-delay-2000"
            aria-hidden="true"
          />

          <RevealOnScroll
            className="relative z-10 mx-auto max-w-3xl text-center"
            y={32}
          >
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
              For sports nutritionists & dietitians
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Client nutrition plans with your professional guardrails.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
              Replace spreadsheets with AI meal planning inside macro bounds you
              set—then track compliance as athletes cook.
            </p>
            <div className="mt-8 flex justify-center">
              <WaitlistButton size="lg" onClick={() => setWaitlistOpen(true)} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Pro is in early access. Join the waitlist—we&apos;ll reach out when seats open.
            </p>
          </RevealOnScroll>
        </section>

        <section className="border-y border-cream-300/70 bg-cream-50/80 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl flex-col items-start justify-center gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-10 sm:gap-y-3">
            {OUTCOMES.map((text, i) => (
              <RevealOnScroll key={text} delayMs={i * 80} y={20}>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                  <span className="text-sm font-medium text-gray-700 sm:text-[15px]">
                    {text}
                  </span>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <RevealOnScroll className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Built for clinical control
              </h2>
              <p className="mt-3 text-lg text-gray-600">
                AI flexibility with structure your practice can stand behind.
              </p>
            </RevealOnScroll>

            <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {FEATURES.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <RevealOnScroll key={feature.title} delayMs={i * 80} y={32}>
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-mint text-primary">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
                      {feature.body}
                    </p>
                  </RevealOnScroll>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="bg-gradient-to-b from-mint/25 to-cream px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <RevealOnScroll className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How it works
              </h2>
              <p className="mt-3 text-lg text-gray-600">
                From invite code to client dashboard in three steps.
              </p>
            </RevealOnScroll>

            <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
              {STEPS.map((step, i) => (
                <RevealOnScroll key={step.number} delayMs={i * 90} y={36}>
                  <div className="rounded-card border border-border/80 bg-card p-6 shadow-soft sm:p-7">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <RevealOnScroll className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Why not a generic chatbot?
              </h2>
              <p className="mt-3 text-lg text-gray-600">
                Generic GPTs lose history and ignore hard macro rules. Pro keeps professional control.
              </p>
            </RevealOnScroll>

            <ul className="mt-12 space-y-4">
              {WHY_PRO.map((item, i) => (
                <RevealOnScroll key={item.title} delayMs={i * 70} y={24} asElement="li">
                  <div className="flex gap-4 rounded-card border border-border/80 bg-card px-5 py-4 shadow-soft">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </ul>
          </div>
        </section>

        <RevealOnScroll y={32}>
          <section className="bg-primary px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to scale your practice?
              </h2>
              <p className="mt-3 text-lg text-primary-100">
                Join the waitlist for Alimenta Pro. We&apos;ll notify you when access opens.
              </p>
              <div className="mt-8 flex justify-center">
                <WaitlistButton size="lg" light onClick={() => setWaitlistOpen(true)} />
              </div>
              <p className="mt-6 text-sm text-primary-100">
                Questions? Email us at alimentanutrition@gmail.com
              </p>
            </div>
          </section>
        </RevealOnScroll>
      </main>

      <WaitlistModal
        isOpen={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        userType="nutritionist"
        title="Join the Pro waitlist"
        description="Tell us about your practice. We’ll reach out when Pro access opens."
      />

      <footer className="border-t border-cream-300 bg-cream-200 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <BrandPro className="text-2xl opacity-90" />
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              href="/"
              className="text-sm text-gray-600 transition-colors hover:text-primary"
            >
              For athletes
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-gray-600 transition-colors hover:text-primary"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-600 transition-colors hover:text-primary"
            >
              Terms
            </Link>
            <Link
              href="/support"
              className="text-sm text-gray-600 transition-colors hover:text-primary"
            >
              Support
            </Link>
          </div>
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Alimenta Pro
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ProLandingPage;
