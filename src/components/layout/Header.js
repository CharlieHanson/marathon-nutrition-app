import React, { useEffect, useState } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';
import { readDashboardCache, writeDashboardCache } from '@/src/utils/dashboardCache';

function resolveDisplayName(userName, user, isGuest) {
  const name = (userName || '').trim();
  if (name) return name;
  if (isGuest) return 'Guest';
  const emailLocal = user?.email?.split('@')[0];
  return emailLocal || 'Guest';
}

function resolveInitials(userName, user, isGuest) {
  const source = (userName || '').trim() || (isGuest ? 'G' : user?.email || 'G');
  return source
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export const Header = ({
  user,
  userName,
  isGuest,
  onSignOut,
  onDisableGuestMode,
  onMenuOpen,
  onProfileClick,
}) => {
  const userId = user?.id;
  const [cachedName, setCachedName] = useState(() => {
    if (!userId || isGuest) return null;
    return readDashboardCache(userId)?.name || null;
  });

  // Re-hydrate when user id changes (auth settled after first paint)
  useEffect(() => {
    if (!userId || isGuest) {
      setCachedName(null);
      return;
    }
    const fromStore = readDashboardCache(userId)?.name;
    if (fromStore) setCachedName(fromStore);
  }, [userId, isGuest]);

  // Prefer live prop; persist when profile name arrives
  useEffect(() => {
    const name = (userName || '').trim();
    if (!userId || isGuest || !name) return;
    setCachedName(name);
    writeDashboardCache(userId, { name });
  }, [userId, isGuest, userName]);

  const effectiveName = (userName || '').trim() || cachedName || '';
  const displayName = resolveDisplayName(effectiveName, user, isGuest);
  const initials = resolveInitials(effectiveName, user, isGuest);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMenuOpen}
          className="lg:hidden -ml-1"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <span className="lg:hidden brand-wordmark text-xl" aria-label="Alimenta">
          <span className="text-primary">Al</span>
          <span className="text-gray-800">imenta</span>
        </span>
      </div>

      {/* Fixed-width cluster so name/email length changes don't shove avatar / sign-out */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onProfileClick}
          className="flex items-center gap-2 sm:gap-3 rounded-xl outline-none transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Open profile"
          title="Profile"
        >
          <div className="hidden sm:flex flex-col items-end justify-center leading-tight mr-0 w-[9.5rem] min-w-[9.5rem] text-left">
            <span className="w-full text-sm font-semibold text-foreground truncate text-right group-hover:text-primary">
              {displayName}
            </span>
            {isGuest ? (
              <span className="w-full text-[11px] font-medium text-muted-foreground truncate text-right">
                Guest mode
              </span>
            ) : user?.email ? (
              <span className="w-full text-[11px] font-medium text-muted-foreground truncate text-right">
                {user.email}
              </span>
            ) : (
              <span className="w-full text-[11px] font-medium text-muted-foreground truncate text-right invisible">
                —
              </span>
            )}
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
          onClick={isGuest ? onDisableGuestMode : onSignOut}
          className="shrink-0 h-9 w-9 text-muted-foreground"
          title={isGuest ? 'Exit Guest Mode' : 'Sign out'}
          aria-label={isGuest ? 'Exit Guest Mode' : 'Sign out'}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};
