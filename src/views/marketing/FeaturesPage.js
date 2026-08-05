import React from 'react';
import { Activity, Heart, ShoppingCart, Sparkles, BarChart3, Utensils } from 'lucide-react';
import { FinalCta, MarketingShell } from './MarketingShell';

const FEATURES = [
  {
    icon: Activity,
    title: 'Training-synced nutrition',
    body: 'Intensity drives fuel. Your plan shifts when the week does—hard sessions get the right support, recovery days stay light.',
  },
  {
    icon: Heart,
    title: 'Preferences that stick',
    body: 'Likes, dislikes, allergies, and cuisine tastes. Set them once so every plan respects what you’ll actually eat.',
  },
  {
    icon: Sparkles,
    title: 'Plans that learn',
    body: 'Rate meals and next week improves. The more you cook and score, the sharper the suggestions get.',
  },
  {
    icon: Utensils,
    title: 'Macros on every meal',
    body: 'Calories, protein, carbs, and fat on each plate—not buried in a PDF. Stay on track without spreadsheet math.',
  },
  {
    icon: ShoppingCart,
    title: 'Grocery lists from the week',
    body: 'Turn a full plan into a shoppable list so you spend less time hunting recipes and more time training.',
  },
  {
    icon: BarChart3,
    title: 'Analytics at a glance',
    body: 'See how the week balances out. Spot over/under patterns and adjust without starting from scratch.',
  },
];

export const FeaturesPage = () => (
  <MarketingShell>
    <section className="px-4 pb-6 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Features
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Everything you need to eat for the week you&apos;re actually training—not a generic calendar of chicken and rice.
        </p>
      </div>
    </section>

    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="rounded-card border border-border/80 bg-card p-6 shadow-soft sm:p-7"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-mint text-primary">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{feature.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
                {feature.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>

    <FinalCta headline="Ready to put it to work?" />
  </MarketingShell>
);

export default FeaturesPage;
