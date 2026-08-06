import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';

export const Layout = ({
  user,
  userName,
  isGuest,
  onSignOut,
  onDisableGuestMode,
  currentView,
  onViewChange,
  children,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [currentView]);

  return (
    <div className="relative min-h-screen bg-background">
      <div className="relative z-10 flex min-h-screen">
        {/* Desktop sidebar — fixed height; vertical divider starts below top bar */}
        <aside className="hidden lg:flex lg:w-60 xl:w-64 shrink-0 flex-col bg-card shadow-soft sticky top-0 h-screen self-start overflow-hidden">
          <div className="flex h-16 shrink-0 items-center px-5 border-b border-border bg-card/90 backdrop-blur-md">
            <button
              type="button"
              onClick={() => onViewChange('dashboard')}
              className="brand-wordmark text-3xl text-left"
              aria-label="Alimenta home"
            >
              <span className="text-primary">Al</span>
              <span className="text-gray-800">imenta</span>
            </button>
          </div>
          <div className="flex flex-1 min-h-0 flex-col border-r border-border">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <Navigation currentView={currentView} onViewChange={onViewChange} />
            </div>
          </div>
        </aside>

        {/* Mobile drawer */}
        <Navigation
          variant="mobile-drawer"
          currentView={currentView}
          onViewChange={onViewChange}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col min-h-screen">
          <Header
            user={user}
            userName={userName}
            isGuest={isGuest}
            onSignOut={onSignOut}
            onDisableGuestMode={onDisableGuestMode}
            onMenuOpen={() => setMobileNavOpen(true)}
            onProfileClick={() => onViewChange('profile')}
          />

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
