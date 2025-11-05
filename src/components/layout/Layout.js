import React from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';

export const Layout = ({ 
  user, 
  isGuest, 
  onSignOut, 
  onDisableGuestMode,
  currentView,
  onViewChange,
  children 
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user}
        isGuest={isGuest}
        onSignOut={onSignOut}
        onDisableGuestMode={onDisableGuestMode}
      />
      
      <Navigation 
        currentView={currentView}
        onViewChange={onViewChange}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};