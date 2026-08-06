import React from 'react';
import {
  Activity,
  Heart,
  ShoppingCart,
  Utensils,
  ChefHat,
  BarChart3,
} from 'lucide-react';
import { BrowserFrame, FinalCta, MarketingShell } from './MarketingShell';
import { RevealOnScroll } from './RevealOnScroll';
import { cn } from '@/src/lib/utils';

/**
 * Web screenshot slots — drop files in public/web-screenshots/
 * with these filenames and the placeholders swap automatically.
 * width/height match each asset so the frame fits without cropping.
 */
const FEATURES = [
  {
    icon: Activity,
    title: 'Training-synced nutrition',
    body: 'Intensity drives fuel. Your plan shifts when the week does. Hard sessions get the right support, recovery days stay light.',
    screenshot: '/web-screenshots/training.png',
    fileHint: 'public/web-screenshots/training.png',
    width: 1618,
    height: 1084,
  },
  {
    icon: Heart,
    title: 'Preferences that stick',
    body: 'Likes, dislikes, allergies, and cuisine tastes. Set them once so every plan respects what you’ll actually eat.',
    screenshot: '/web-screenshots/preferences.png',
    fileHint: 'public/web-screenshots/preferences.png',
    width: 1690,
    height: 1098,
  },
  {
    icon: Utensils,
    title: 'Meals that learn',
    body: 'Calories, protein, carbs, and fat on each meal. Then rate what you cooked so next week’s plan gets sharper. Stay on track without spreadsheet math.',
    screenshot: '/web-screenshots/meals.png',
    fileHint: 'public/web-screenshots/meals.png',
    width: 1593,
    height: 1030,
  },
  {
    icon: ChefHat,
    title: 'Recipes from any meal',
    body: 'Open a meal and get a full recipe: servings, ingredients, steps, and timing so you can cook what the plan called for without hunting elsewhere.',
    screenshot: '/web-screenshots/recipe.png',
    fileHint: 'public/web-screenshots/recipe.png',
    width: 1668,
    height: 1255,
  },
  {
    icon: ShoppingCart,
    title: 'Grocery lists from the week',
    body: 'Turn a full plan into a shoppable list so you spend less time hunting recipes and more time training.',
    screenshot: '/web-screenshots/grocery.png',
    fileHint: 'public/web-screenshots/grocery.png',
    width: 1308,
    height: 1021,
  },
  {
    icon: BarChart3,
    title: 'Analytics at a glance',
    body: 'See how the week balances out. Spot over/under patterns and adjust without starting from scratch.',
    screenshot: '/web-screenshots/analytics.png',
    fileHint: 'public/web-screenshots/analytics.png',
    width: 1650,
    height: 1258,
  },
];

export const FeaturesPage = () => (
  <MarketingShell>
    <section className="px-4 pb-6 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <RevealOnScroll className="mx-auto max-w-3xl text-center" y={28}>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Features
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Everything you need to eat for the week you&apos;re actually training, not a
          generic calendar of chicken and rice.
        </p>
      </RevealOnScroll>
    </section>

    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-16 sm:space-y-20 lg:space-y-24">
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          const imageOnRight = index % 2 === 0;

          return (
            <div
              key={feature.title}
              className="grid items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-16"
            >
              <RevealOnScroll
                className={cn(imageOnRight ? 'md:order-1' : 'md:order-2')}
                y={36}
                delayMs={40}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-mint text-primary">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  {feature.title}
                </h2>
                <p className="mt-3 text-lg leading-relaxed text-gray-600">
                  {feature.body}
                </p>
              </RevealOnScroll>

              <RevealOnScroll
                className={cn(
                  'flex justify-center',
                  imageOnRight ? 'md:order-2' : 'md:order-1'
                )}
                y={48}
                delayMs={120}
              >
                <BrowserFrame
                  src={feature.screenshot}
                  alt={`${feature.title} web app`}
                  fileHint={feature.fileHint}
                  placeholderLabel={feature.title}
                  width={feature.width}
                  height={feature.height}
                  showChrome={false}
                  className="max-w-none"
                />
              </RevealOnScroll>
            </div>
          );
        })}
      </div>
    </section>

    <RevealOnScroll y={32}>
      <FinalCta headline="Ready to put it to work?" />
    </RevealOnScroll>
  </MarketingShell>
);

export default FeaturesPage;
