import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Users, LayoutDashboard, User, Settings, LogOut } from 'lucide-react';

export const ProLayout = ({ children, userName, onSignOut }) => {
  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = [
    { label: 'Dashboard', href: '/pro/dashboard', icon: LayoutDashboard },
    { label: 'Clients', href: '/pro/clients', icon: Users },
    { label: 'Profile', href: '/pro/profile', icon: User },
  ];

  const handleSignOutClick = async () => {
    console.log('ProLayout: logout button clicked');
    try {
      if (onSignOut) {
        await onSignOut(); // actually clear Supabase + context
      } else {
        console.warn('ProLayout: onSignOut prop is missing');
      }
    } catch (e) {
      console.warn('ProLayout: error during onSignOut', e);
    } finally {
      console.log('ProLayout: redirecting to /pro/login after signOut');
      router.replace('/pro/login'); // which immediately pushes to /login?role=nutritionist
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/pro/dashboard">
              <div className="flex items-center gap-2 cursor-pointer">
                <img src="/alimenta_logo.png" alt="Alimenta" className="h-8" />
                <span className="text-sm font-medium text-gray-500">Pro</span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentPath === item.href ||
                  currentPath.startsWith(item.href + '/');
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-orange-50 text-primary font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700 hidden sm:block">
                {userName || 'Nutritionist'}
              </span>
              <Link href="/pro/settings">
                <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </Link>
              <button
                onClick={handleSignOutClick}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPath === item.href ||
                currentPath.startsWith(item.href + '/');
              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                      isActive ? 'text-primary' : 'text-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
