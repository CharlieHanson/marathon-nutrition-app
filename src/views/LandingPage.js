import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/src/components/shared/Button';
import { cn } from '@/src/lib/utils';
import {
  FinalCta,
  MarketingShell,
  PhoneFrame,
} from './marketing/MarketingShell';
import { RevealOnScroll } from './marketing/RevealOnScroll';

const HERO_MOBILE = '/mobile-screenshots/dashboard.png';
const HERO_WEB = '/web-screenshots/dashboard.png';
const APP_STORE_URL = 'https://apps.apple.com/us/app/alimenta-nutrition/id6757525735';

const OUTCOMES = [
  'Plans that follow your training week',
  'Preferences you set once',
  'Macros on every meal',
];

const CAROUSEL_SLIDES = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Your daily nutrition overview at a glance',
    image: '/mobile-screenshots/dashboard.png',
  },
  {
    id: 'meals',
    title: 'Meal Plan',
    description: 'AI-generated meals tailored to your training',
    image: '/mobile-screenshots/meals.png',
  },
  {
    id: 'training',
    title: 'Training',
    description: 'Sync your workouts for optimized nutrition',
    image: '/mobile-screenshots/training.png',
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Customize dietary needs and restrictions',
    image: '/mobile-screenshots/preferences.png',
  },
];

function MobileAppCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return undefined;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section
      id="mobile"
      className="overflow-hidden bg-gradient-to-b from-mint/30 to-cream px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-mint px-4 py-2 transition-shadow hover:shadow-soft"
          >
            <Smartphone className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary">Now on iOS</span>
          </a>
          <h2 className="mb-4 text-4xl font-bold text-gray-900">Take Alimenta Anywhere</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            The same powerful AI nutrition planning, now in your pocket. Track meals, adjust
            training, and generate plans on the go.
          </p>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Download on the App Store
          </a>
        </div>

        <div className="relative mx-auto max-w-4xl">
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 z-10 -translate-x-4 -translate-y-1/2 rounded-full border border-cream-300 bg-white p-3 shadow-soft transition-shadow hover:shadow-card md:-translate-x-12"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-4 rounded-full border border-cream-300 bg-white p-3 shadow-soft transition-shadow hover:shadow-card md:translate-x-12"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>

          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="relative mx-auto h-[470px] w-[228px] rounded-[2.5rem] bg-gray-900 p-1 shadow-card sm:h-[490px] sm:w-[238px]">
                <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] bg-white">
                  <div className="absolute left-1/2 top-0 z-10 h-5 w-20 -translate-x-1/2 rounded-b-xl bg-gray-900" />

                  <div className="relative h-full w-full">
                    {CAROUSEL_SLIDES.map((slide, index) => (
                      <div
                        key={slide.id}
                        className={cn(
                          'absolute inset-0 transition-opacity duration-500',
                          index === currentSlide ? 'opacity-100' : 'opacity-0'
                        )}
                      >
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-mint/40 to-cream">
                          <img
                            src={slide.image}
                            alt={`${slide.title} screen`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                          <div
                            className="absolute inset-0 hidden flex-col items-center justify-center bg-gradient-to-b from-mint to-peach/50 p-8 text-center"
                            style={{ display: 'none' }}
                          >
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20">
                              <Smartphone className="h-8 w-8 text-primary" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">{slide.title}</p>
                            <p className="mt-1 text-xs text-gray-400">Screenshot coming soon</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute -inset-4 -z-10 rounded-[4rem] bg-gradient-to-r from-mint/40 to-peach/40 blur-2xl" />
            </div>
          </div>

          <div className="mt-8 text-center">
            <h3 className="mb-2 text-2xl font-bold text-gray-900">
              {CAROUSEL_SLIDES[currentSlide].title}
            </h3>
            <p className="text-gray-600">{CAROUSEL_SLIDES[currentSlide].description}</p>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            {CAROUSEL_SLIDES.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(index)}
                className={cn(
                  'transition-all duration-300',
                  index === currentSlide
                    ? 'h-3 w-8 rounded-full bg-primary'
                    : 'h-3 w-3 rounded-full bg-cream-300 hover:bg-primary/40'
                )}
                aria-label={`Go to ${slide.title}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export const LandingPage = () => {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-animated-hero"
          aria-hidden="true"
        />
        {/* Soft floating washes for extra depth while the base gradient moves */}
        <div
          className="pointer-events-none absolute -right-16 top-0 h-[70%] w-[55%] rounded-full bg-primary/15 blur-3xl animate-blob"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-20 bottom-0 h-[55%] w-[50%] rounded-full bg-peach/70 blur-3xl animate-blob animation-delay-2000"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <RevealOnScroll className="text-center lg:text-left" y={28}>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Fuel Your Training with{' '}
              <span className="text-primary">AI-Powered Nutrition</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600 lg:mx-0">
              Set your training, set what you&apos;ll eat, get a plan that follows both.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/login">
                <Button variant="primary" size="lg" icon={ArrowRight}>
                  Get started
                </Button>
              </Link>
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg">
                  View on App Store
                </Button>
              </a>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              <Link href="/features" className="font-medium text-primary hover:underline">
                Features
              </Link>
              <span className="mx-2 text-border">·</span>
              <Link href="/pricing" className="font-medium text-primary hover:underline">
                Pricing
              </Link>
            </p>
          </RevealOnScroll>

          <RevealOnScroll
            className="relative flex items-center justify-center"
            delayMs={120}
            y={48}
          >
            {/* Web left, phone right — phone overlaps the web screenshot */}
            <div className="relative mx-auto flex w-full max-w-[600px] items-end justify-center sm:max-w-[680px] lg:max-w-[720px]">
              <div className="relative z-10 min-w-0 flex-1 pb-6 sm:pb-10">
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                  <img
                    src={HERO_WEB}
                    alt="Alimenta web dashboard"
                    width={1963}
                    height={1114}
                    className="block h-auto w-full"
                  />
                </div>
              </div>
              <div className="relative z-20 shrink-0 translate-y-1 -ml-10 sm:-ml-14">
                <PhoneFrame
                  src={HERO_MOBILE}
                  alt="Alimenta mobile dashboard"
                  size="lg"
                />
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Outcomes strip */}
      <section className="border-y border-cream-300/70 bg-cream-50/80 px-4 py-8 sm:px-6 lg:px-8">
        <RevealOnScroll>
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
        </RevealOnScroll>
      </section>

      <RevealOnScroll y={42}>
        <MobileAppCarousel />
      </RevealOnScroll>

      <RevealOnScroll y={32}>
        <FinalCta />
      </RevealOnScroll>
    </MarketingShell>
  );
};

export default LandingPage;
