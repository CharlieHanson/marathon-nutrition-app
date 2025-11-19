import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Briefcase, ArrowLeft, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { supabase } from '../supabaseClient';

const Auth = ({ presetRole }) => {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  
  // Forgot password modal
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetPending, setResetPending] = useState(false);

  const [role, setRole] = useState(presetRole || 'client');
  useEffect(() => {
    if (presetRole) return;
    const urlRole = router.query.role;
    if (urlRole === 'nutritionist' || router.pathname.startsWith('/pro')) {
      setRole('nutritionist');
    } else {
      setRole('client');
    }
  }, [router.query.role, router.pathname, presetRole]);

  const backHref =
    (presetRole === 'nutritionist') ||
    router.pathname.startsWith('/pro') ||
    router.query.role === 'nutritionist'
      ? '/pro'
      : '/';

  const { signIn, signUp, enableGuestMode } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPending(true);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your name');

        const metadata =
          role === 'nutritionist' && businessName.trim()
            ? { name, role, is_new_user: true, business_name: businessName }
            : { name, role, is_new_user: true };

        const { error } = await signUp(email, password, name, role, metadata);
        if (error) throw error;
        
        if (typeof window !== 'undefined') {
          window.alert('Account created! Please check your email to verify your account.');
        }

        const nextLogin = role === 'nutritionist' ? '/pro/login' : '/login';
        router.replace(`${nextLogin}?created=1`);
        return;
      }

      const { error } = await signIn(email, password);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user after sign in');

      const { data: profile, error: profErr } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profErr) throw profErr;

      const roleFromDB = profile?.role || 'client';
      router.replace(roleFromDB === 'nutritionist' ? '/pro/dashboard' : '/training');
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetMessage('');
    setResetPending(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      
      if (error) throw error;
      
      setResetMessage('✅ Password reset email sent! Check your inbox.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail('');
        setResetMessage('');
      }, 3000);
    } catch (err) {
      setResetMessage(`❌ ${err.message}`);
    } finally {
      setResetPending(false);
    }
  };

  const handleGuest = () => enableGuestMode();

  const isNutritionist = role === 'nutritionist';
  const heading = isNutritionist ? 'Nutritionist Portal' : 'Where nutrition meets performance';
  const submitText = isNutritionist
    ? (isSignUp ? 'Create Nutritionist Account' : 'Sign In')
    : (isSignUp ? 'Sign Up' : 'Sign In');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4 relative">
      {/* Back link */}
      <div className="absolute left-4 top-4">
        <Link href={backHref} className="inline-flex items-center gap-2 text-gray-600 hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/alimenta_logo.png" alt="Alimenta" className="h-14 mx-auto mb-4" />
          <p className="text-gray-600 mt-2">{heading}</p>
          {isNutritionist && (
            <p className="text-sm text-gray-500 mt-1">Manage your clients' nutrition plans</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                {isNutritionist ? 'Your Name' : 'Name'}
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={isNutritionist ? 'Jane Smith' : 'Enter your name'}
                required
              />
            </div>
          )}

          {isSignUp && isNutritionist && (
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                Business Name <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Smith Nutrition Consulting"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
              minLength="6"
              required
            />
            {!isSignUp && (
              <div className="text-right mt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:text-primary-700"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            {isNutritionist ? <Briefcase className="w-4 h-4" /> : <User className="w-4 h-4" />}
            {pending ? 'Please wait...' : submitText}
          </button>

          <div className="text-center text-sm space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setBusinessName('');
              }}
              className="text-primary hover:text-primary-700 block w-full"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>

            {!isNutritionist && (
              <button
                type="button"
                onClick={handleGuest}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Continue as Guest
              </button>
            )}

            <div className="pt-2 border-t border-gray-200">
              {isNutritionist ? (
                <Link href="/login" className="text-sm text-gray-600 hover:text-gray-800">
                  Are you an athlete? → Client sign in
                </Link>
              ) : (
                <Link href="/login?role=nutritionist" className="text-sm text-gray-600 hover:text-gray-800">
                  Are you a nutritionist? → Professional sign in
                </Link>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setResetMessage('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {resetMessage && (
                <div className={`p-3 rounded-md text-sm ${
                  resetMessage.includes('✅') 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}>
                  {resetMessage}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                    setResetMessage('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPending}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700 transition-colors disabled:bg-gray-400"
                >
                  {resetPending ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;