import React from 'react';
import { Settings, LogOut } from 'lucide-react';

export const Header = ({ user, userName, isGuest, onSignOut, onDisableGuestMode, onViewChange }) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold tracking-tight" aria-label="Alimenta">
              <span className="text-primary">Al</span>
              <span className="text-gray-800">imenta</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Welcome, {userName ?? user?.email ?? 'Guest'}!
            </span>
            
            {/* Settings Button - only show for logged-in users */}
            {!isGuest && (
              <button
                onClick={() => onViewChange('settings')}
                className="p-2 text-gray-600 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            
            <button
              onClick={isGuest ? onDisableGuestMode : onSignOut}
              className="text-gray-500 hover:text-gray-700"
            >
              {isGuest ? 'Exit Guest Mode' : <LogOut className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};