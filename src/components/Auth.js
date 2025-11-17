// src/components/Auth.js
import React, { useState } from 'react';
import { User, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const Auth = ({ onBack }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  // Forgot Password
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const { signIn, signUp, enableGuestMode } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPending(true);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your name');
        const { error } = await signUp(email, password, name);
        if (error) throw error;
        alert('Account created! Please check your email to verify your account.');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetMessage('Sending email...');

    try {
      const redirectUrl = `${window.location.origin}/update-password`;

      const { data, error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      // Debug logs (optional)
      console.log('Reset email result:', { data, error });

      if (error) throw error;

      setResetMessage('✅ Password reset email sent! Check your inbox (and spam folder).');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetMessage('');
        setResetEmail('');
      }, 5000);
    } catch (err) {
      console.error('Reset email error:', err);
      setResetMessage(`❌ Error: ${err.message}`);
    }
  };

  const handleGuest = () => {
    enableGuestMode();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <div className="text-center mb-6">
          <img src="/alimenta_logo.png" alt="Logo" className="h-14 mx-auto mb-4" />
          <p className="text-gray-600 mt-2">Where nutrition meets performance</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your name"
                required
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
              placeholder="Enter your email"
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
              placeholder="Enter your password"
              minLength="6"
              required
            />
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
            <User className="w-4 h-4" />
            {pending ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>

          {/* Forgot Password (only on Sign In) */}
          {!isSignUp && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(!showForgotPassword)}
                className="text-sm text-primary hover:text-orange-600 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          {showForgotPassword && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Reset Password</h3>
              <div className="space-y-3">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (resetEmail) handleForgotPassword(e);
                  }}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400"
                  disabled={!resetEmail}
                >
                  Send Reset Link
                </button>
                {resetMessage && (
                  <p className={`text-sm ${resetMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                    {resetMessage}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="text-center text-sm space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setShowForgotPassword(false);
                setResetMessage('');
              }}
              className="text-primary hover:text-primary-700 block w-full"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>

            <button
              type="button"
              onClick={enableGuestMode}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;