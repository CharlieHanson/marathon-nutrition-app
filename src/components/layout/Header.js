import React from 'react';

export const Header = ({ user, isGuest, onSignOut, onDisableGuestMode }) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-2">
            <img src="/alimenta_logo.png" alt="Logo" className="h-8 mx-auto mb-4" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Welcome, {user?.email ?? 'Guest'}!
            </span>
            <button
              onClick={isGuest ? onDisableGuestMode : onSignOut}
              className="text-gray-500 hover:text-gray-700"
            >
              {isGuest ? 'Exit Guest Mode' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};