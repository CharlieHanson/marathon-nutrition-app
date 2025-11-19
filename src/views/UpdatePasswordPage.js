import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/shared/Button';
import { Card } from '../components/shared/Card';

import { getBaseUrl } from '../lib/baseUrl';

await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${getBaseUrl()}/update-password`,
});


export const UpdatePasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let unsub;

    (async () => {
      // Newer flow: ?code=... in query
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(`❌ Link invalid or expired: ${error.message}`);
        } else {
          setMessage('✅ Email verified! Enter your new password below.');
        }
      }

      // Legacy/hash flow: #access_token=... triggers this event
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setMessage('✅ Email verified! Enter your new password below.');
        }
      });
      unsub = sub.subscription?.unsubscribe;
    })();

    return () => { unsub?.(); };
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
      setTimeout(() => { window.location.href = '/'; }, 1500);
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="text-center mb-6">
          <img src="/alimenta_logo.png" alt="Alimenta" className="h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Update Password</h2>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded-lg text-center ${
            message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}
      </Card>
    </div>
  );
};

export default UpdatePasswordPage;
