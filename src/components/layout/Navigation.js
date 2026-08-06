import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Utensils,
  Heart,
  User,
  Settings,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/src/components/ui/sheet';
import { cn } from '@/src/lib/utils';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'training', label: 'Training', icon: Calendar },
  { id: 'meals', label: 'Meals', icon: Utensils },
  { id: 'preferences', label: 'Preferences', icon: Heart },
  { id: 'profile', label: 'Profile', icon: User },
];

export const Navigation = ({
  currentView,
  onViewChange,
  variant = 'sidebar',
  mobileOpen = false,
  onMobileClose,
}) => {
  if (variant === 'mobile-drawer') {
    return (
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose?.()}>
        <SheetContent side="left" className="w-72 p-0 bg-card border-r border-border lg:hidden">
          <SheetHeader className="flex flex-row items-center justify-between px-5 py-4 border-b border-border space-y-0 text-left">
            <SheetTitle className="brand-wordmark text-2xl font-normal">
              <span className="text-primary">Al</span>
              <span className="text-gray-800">imenta</span>
            </SheetTitle>
          </SheetHeader>
          <div className="px-3 py-4">
            <NavList
              currentView={currentView}
              onViewChange={(id) => {
                onViewChange(id);
                onMobileClose?.();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <nav className="flex flex-1 flex-col min-h-0 px-3 py-4">
      <NavList currentView={currentView} onViewChange={onViewChange} />
    </nav>
  );
};

function NavList({ currentView, onViewChange }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const active = currentView === id;
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => onViewChange(id)}
              className={cn(
                'w-full flex items-center gap-3.5 rounded-xl px-4 py-3 text-base font-semibold transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-cream-200 hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0',
                  active ? 'text-primary-foreground' : 'text-muted-foreground'
                )}
              />
              {label}
            </button>
          </li>
        );
      })}
      <li className="mt-2 pt-2 border-t border-border">
        <button
          type="button"
          onClick={() => onViewChange('settings')}
          className={cn(
            'w-full flex items-center gap-3.5 rounded-xl px-4 py-3 text-base font-semibold transition-colors',
            currentView === 'settings'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-cream-200 hover:text-foreground'
          )}
        >
          <Settings
            className={cn(
              'w-5 h-5 shrink-0',
              currentView === 'settings' ? 'text-primary-foreground' : 'text-muted-foreground'
            )}
          />
          Settings
        </button>
      </li>
    </ul>
  );
}
