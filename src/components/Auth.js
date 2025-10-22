// src/components/Auth.js
import React, { useState } from 'react';
import { Utensils, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

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
      // No navigation needed; App will re-render based on user/isGuest
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  const handleGuest = () => {
    enableGuestMode(); // flips context state; App will render main UI
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <Utensils className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Nutrition Training Coach</h1>
          <p className="text-gray-600 mt-2">Personalized nutrition for any training goal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            <User className="w-4 h-4" />
            {pending ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-indigo-600 hover:text-indigo-700"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>

            <button
              type="button"
              onClick={handleGuest}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors mt-2"
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
