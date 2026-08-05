import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/shared/Button';
import { Card } from '../components/shared/Card';
import { PageDecor } from '../components/shared/PageDecor';

export const UpdatePasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // On mount, just check if we have a valid session
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error) {
        console.error('getSession error:', error);
        setMessage('❌ There was a problem validating this link. Please request a new reset email.');
        return;
      }

      if (!data?.session) {
        setMessage('❌ This link is invalid or has expired. Please request a new password reset email.');
      } else {
        // Optional: show a friendly message, or leave blank if you prefer
        setMessage('Enter your new password above.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage('❌ Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setMessage('❌ Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setMessage('✅ Password updated successfully! Redirecting…');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      console.error('updateUser error:', err);
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-cream flex items-center justify-center p-4 overflow-hidden">
      <PageDecor />
      <div className="relative z-10 w-full max-w-md">
      <Card className="w-full">
        <div className="text-center mb-6">
          <span className="brand-wordmark block text-3xl mb-4" aria-label="Alimenta">
            <span className="text-primary">Al</span>
            <span className="text-gray-800">imenta</span>
          </span>
          <h2 className="text-2xl text-gray-900">Update Password</h2>
          <p className="text-gray-600 mt-2">Enter your new password</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="warm-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="warm-input"
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>

        {message && (
          <div
            className={`mt-4 p-4 rounded-xl text-center ${
              message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message}
          </div>
        )}
      </Card>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;
