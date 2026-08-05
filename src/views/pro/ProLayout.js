import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Users,
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/src/components/ui/sheet';
import { cn } from '@/src/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/pro/dashboard', icon: LayoutDashboard },
  { label: 'Clients', href: '/pro/clients', icon: Users },
  { label: 'Profile', href: '/pro/profile', icon: User },
];

function isActivePath(currentPath, href) {
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function initialsFromName(name) {
  return (name || 'N')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function ProNavList({ currentPath, onNavigate }) {
  return (
    <nav className="flex flex-1 flex-col min-h-0 px-3 py-4">
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActivePath(currentPath, href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => onNavigate?.()}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-cream-200 hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'w-[18px] h-[18px] shrink-0',
                    active ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}
                />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="mt-2 pt-2 border-t border-border">
          <Link
            href="/pro/settings"
            onClick={() => onNavigate?.()}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
              isActivePath(currentPath, '/pro/settings')
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-cream-200 hover:text-foreground'
            )}
          >
            <Settings
              className={cn(
                'w-[18px] h-[18px] shrink-0',
                isActivePath(currentPath, '/pro/settings')
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground'
              )}
            />
            Settings
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export const ProLayout = ({ children, userName, userEmail, onSignOut }) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [currentPath]);

  const displayName = (userName || '').trim() || 'Nutritionist';
  const initials = initialsFromName(displayName);

  const handleSignOutClick = async () => {
    try {
      if (onSignOut) {
        await onSignOut();
      }
    } catch (e) {
      console.warn('ProLayout: error during onSignOut', e);
    } finally {
      router.replace('/pro/login');
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="relative z-10 flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:w-60 xl:w-64 shrink-0 flex-col bg-card shadow-soft sticky top-0 h-screen self-start overflow-hidden">
          <div className="flex h-14 shrink-0 items-center gap-2 px-5 border-b border-border bg-card/90 backdrop-blur-md">
            <Link
              href="/pro/dashboard"
              className="flex items-center gap-2 min-w-0"
              aria-label="Alimenta Pro home"
            >
              <span className="brand-wordmark text-2xl">
                <span className="text-primary">Al</span>
                <span className="text-gray-800">imenta</span>
              </span>
              <Badge className="shrink-0 text-[11px] font-semibold bg-primary-50 text-primary hover:bg-primary-50 border-0 px-1.5 py-0">
                Pro
              </Badge>
            </Link>
          </div>
          <div className="flex flex-1 min-h-0 flex-col border-r border-border">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ProNavList currentPath={currentPath} />
            </div>
          </div>
        </aside>

        {/* Mobile drawer */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="flex w-72 flex-col p-0 bg-card border-r border-border lg:hidden">
            <SheetHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b border-border space-y-0 text-left shrink-0">
              <SheetTitle className="brand-wordmark text-2xl font-normal">
                <span className="text-primary">Al</span>
                <span className="text-gray-800">imenta</span>
              </SheetTitle>
              <Badge className="text-[11px] font-semibold bg-primary-50 text-primary hover:bg-primary-50 border-0 px-1.5 py-0">
                Pro
              </Badge>
            </SheetHeader>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ProNavList
                currentPath={currentPath}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col min-h-screen">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-md sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden -ml-1"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <Link
                href="/pro/dashboard"
                className="lg:hidden flex items-center gap-1.5 brand-wordmark text-xl"
                aria-label="Alimenta Pro"
              >
                <span>
                  <span className="text-primary">Al</span>
                  <span className="text-gray-800">imenta</span>
                </span>
                <Badge className="text-[10px] font-semibold bg-primary-50 text-primary hover:bg-primary-50 border-0 px-1.5 py-0">
                  Pro
                </Badge>
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => router.push('/pro/profile')}
                className="flex items-center gap-2 sm:gap-3 rounded-xl outline-none transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Open profile"
                title="Profile"
              >
                <div className="hidden sm:flex flex-col items-end justify-center leading-tight w-[9.5rem] min-w-[9.5rem]">
                  <span className="w-full text-sm font-semibold text-foreground truncate text-right">
                    {displayName}
                  </span>
                  <span className="w-full text-[11px] font-medium text-muted-foreground truncate text-right">
                    {userEmail || 'Pro workspace'}
                  </span>
                </div>
                <Avatar className="h-9 w-9 shrink-0 border border-primary-100">
                  <AvatarFallback className="bg-primary-50 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleSignOutClick}
                className="shrink-0 h-9 w-9 text-muted-foreground"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
