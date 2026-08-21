import React from 'react';
import { FinalCta, MarketingShell, PhoneFrame } from './MarketingShell';
import { RevealOnScroll } from './RevealOnScroll';
import { cn } from '@/src/lib/utils';

const STEPS = [
  {
    number: '1',
    title: "Tell us this week's training",
    description:
      "Log workouts, intensity, and when you train so fuel matches the load. Morning long runs and evening lifts don't get the same plate.",
    screen: '/mobile-screenshots/training.png',
    screenAlt: 'Training day in the app',
  },
  {
    number: '2',
    title: "Set what you'll actually eat",
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

const METHODOLOGY = [
  {
    title: 'Calorie & macro calculations',
    content:
      'Your Basal Metabolic Rate (BMR) is estimated using the Mifflin-St Jeor equation, one of the most widely validated predictive equations for resting energy expenditure. Total Daily Energy Expenditure (TDEE) is calculated by applying standard physical activity level (PAL) multipliers to your BMR, then adjusting for training-day intensity and your goal (a modest deficit for fat loss, surplus for muscle gain, or maintenance). Protein targets are set by body weight (1.6–1.8 g/kg depending on goal), fat is fixed at 25% of adjusted calories, and carbohydrates fill the remainder.',
    citations: [
      'Mifflin MD, St Jeor ST, Hill LA, et al. "A new predictive equation for resting energy expenditure in healthy individuals." Am J Clin Nutr. 1990;51(2):241–247.',
      'McArdle WD, Katch FI, Katch VL. Exercise Physiology: Nutrition, Energy, and Human Performance. 7th ed. Lippincott Williams & Wilkins; 2010.',
      'Jäger R, Kerksick CM, Campbell BI, et al. "International Society of Sports Nutrition Position Stand: diets and body composition." J Int Soc Sports Nutr. 2017;14:16.',
    ],
  },
  {
    title: 'AI meal generation',
    content:
      'Meal plans are generated using large language models (currently OpenAI), prompted with your profile, calorie and macro targets, dietary restrictions, food preferences, and training schedule. Every plan is generated fresh — meals are not pulled from a fixed database. Your past meal ratings are stored and a retrieval layer exists to inform future suggestions as the system evolves.',
    citations: [],
  },
  {
    title: 'Nutrition estimates on meals',
    content:
      'Calorie and macronutrient values shown on AI-generated meals are estimates. During generation, the AI assigns each ingredient a type (protein, carbohydrate, vegetable, or fat) and a gram weight. Macros are then estimated using type-level nutritional densities derived from USDA FoodData Central reference data, and portions may be scaled to fit your calorie and macro targets. These are approximations — actual values depend on specific brands, preparation methods, and portion sizes.',
    citations: [
      'U.S. Department of Agriculture, Agricultural Research Service. FoodData Central. fdc.nal.usda.gov.',
    ],
  },
  {
    title: 'Logged meal estimates',
    content:
      'When you log a custom meal and request a macro estimate, your meal description is sent to our estimation service — a set of meal-type machine learning models trained on USDA-derived food data that predict calories, protein, carbohydrates, and fat from text. This is a separate system from the density-based estimates used on AI-generated meals.',
    citations: [
      'U.S. Department of Agriculture, Agricultural Research Service. FoodData Central. fdc.nal.usda.gov.',
    ],
  },
];

export const HowItWorksPage = () => (
  <MarketingShell>
    {/* Hero */}
    <section className="px-4 pb-6 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <RevealOnScroll className="mx-auto max-w-3xl text-center" y={28}>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          How it works
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          From empty week to a plan you can cook, in three steps.
        </p>
      </RevealOnScroll>
    </section>

    {/* Steps */}
    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-16 sm:space-y-24">
        {STEPS.map((step, index) => (
          <div
            key={step.number}
            className="grid items-center gap-10 md:grid-cols-2 md:gap-14"
          >
            <RevealOnScroll
              className={cn(index % 2 === 1 ? 'md:order-2' : undefined)}
              y={36}
              delayMs={40}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {step.number}
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {step.title}
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-gray-600">
                {step.description}
              </p>
            </RevealOnScroll>
            <RevealOnScroll
              className={cn(
                'flex justify-center',
                index % 2 === 1 ? 'md:order-1' : undefined
              )}
              y={48}
              delayMs={120}
            >
              <PhoneFrame src={step.screen} alt={step.screenAlt} size="md" />
            </RevealOnScroll>
          </div>
        ))}
      </div>
    </section>

    {/* Methodology & citations */}
    <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <RevealOnScroll y={28}>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Our methodology
          </h2>
          <p className="mt-4 text-center text-lg text-gray-600">
            Transparency into how Alimenta calculates your nutrition targets and
            generates meal plans.
          </p>
        </RevealOnScroll>

        <div className="mt-12 space-y-12">
          {METHODOLOGY.map((section) => (
            <RevealOnScroll key={section.title} y={24} delayMs={40}>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {section.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-gray-600">
                  {section.content}
                </p>
                {section.citations.length > 0 && (
                  <ul className="mt-4 space-y-1.5 border-l-2 border-gray-300 pl-4">
                    {section.citations.map((cite, i) => (
                      <li
                        key={i}
                        className="text-sm leading-relaxed text-gray-500"
                      >
                        {cite}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll y={20} delayMs={80}>
          <div className="mt-12 rounded-lg border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm leading-relaxed text-amber-800">
              <strong>Important:</strong> Alimenta is not a medical device and
              does not provide medical advice. All nutrition values are
              estimates. Individual needs vary based on genetics, health
              conditions, medications, and other factors not captured by
              predictive equations. Consult a qualified healthcare professional
              or registered dietitian before making significant dietary changes.
            </p>
          </div>
        </RevealOnScroll>
      </div>
    </section>

    <RevealOnScroll y={32}>
      <FinalCta headline="Your week of training. Your meals." />
    </RevealOnScroll>
  </MarketingShell>
);

export default HowItWorksPage;