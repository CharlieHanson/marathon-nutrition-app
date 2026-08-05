import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@/src/components/shared/Button';
import { cn } from '@/src/lib/utils';

export function BrandWordmark({ className = 'text-3xl' }) {
  return (
    <span className={cn('brand-wordmark', className)} aria-label="Alimenta">
      <span className="text-primary">Al</span>
      <span className="text-gray-800">imenta</span>
    </span>
  );
}

const NAV_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
];

export function MarketingNav() {
  const router = useRouter();

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-cream-300/60 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <BrandWordmark className="text-2xl sm:text-3xl" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const active = router.pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  active ? 'text-primary' : 'text-gray-600'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-primary hover:bg-mint">
              Sign in
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="primary" size="sm">
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-cream-300 bg-cream-200 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <Link href="/">
          <BrandWordmark className="text-2xl opacity-90" />
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
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
          © {new Date().getFullYear()} Alimenta
        </p>
      </div>
    </footer>
  );
}

export function MarketingShell({ children }) {
  return (
    <div className="min-h-screen bg-cream text-foreground">
      <MarketingNav />
      <main className="pt-16">{children}</main>
      <MarketingFooter />
    </div>
  );
}

export function PhoneFrame({ src, alt, className = '', size = 'md' }) {
  const sizes = {
    sm: 'w-[140px] h-[288px] rounded-[1.5rem] p-1.5',
    md: 'w-[200px] h-[410px] sm:w-[220px] sm:h-[452px] rounded-[2rem] p-2',
    lg: 'w-[210px] h-[430px] sm:w-[230px] sm:h-[472px] rounded-[2.1rem] p-2.5',
  };
  const screenRound = {
    sm: 'rounded-[1.2rem]',
    md: 'rounded-[1.6rem]',
    lg: 'rounded-[1.7rem]',
  };

  return (
    <div
      className={cn(
        'relative mx-auto bg-gray-900 shadow-card',
        sizes[size],
        className
      )}
    >
      <div
        className={cn(
          'relative h-full w-full overflow-hidden bg-cream',
          screenRound[size]
        )}
      >
        <div className="absolute top-0 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-b-xl bg-gray-900 sm:h-6 sm:w-24" />
        <img src={src} alt={alt} className="h-full w-full object-cover object-top" />
      </div>
    </div>
  );
}

export function FinalCta({
  headline = 'Ready for a week that matches your training?',
}) {
  return (
    <section className="bg-primary px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {headline}
        </h2>
        <div className="mt-8">
          <Link href="/login">
            <Button
              variant="primary"
              size="lg"
              className="bg-cream text-primary hover:bg-white hover:text-primary"
            >
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
