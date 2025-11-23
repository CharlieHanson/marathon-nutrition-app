// src/views/pro/ProSettingsPage.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';

export const ProSettingsPage = ({ user }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');

  // Keep email field in sync if user changes
  useEffect(() => {
    setEmail(user?.email ?? '');
  }, [user?.email]);

  // Change password (logged-in users)
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('❌ Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setMessage('❌ Password must be at least 6 characters');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setMessage('✅ Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  // Send reset email (for users who forgot)
  const handleForgotPassword = async () => {
    try {
      const redirectTo = `${window.location.origin}/pro/update-password`;
      const targetEmail = email || user?.email;

      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, { redirectTo });
      if (error) throw error;

      setMessage('✅ Password reset email sent! Check your inbox.');
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account security and preferences</p>
      </div>

      {/* Change Password */}
      <Card>
        <h3 className="text-xl font-semibold mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Confirm new password"
            />
          </div>

          <Button onClick={handleChangePassword}>Update Password</Button>
        </div>
      </Card>

      {/* Reset via Email */}
      <Card>
        <h3 className="text-xl font-semibold mb-4">Reset via Email</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="your@email.com"
            />
          </div>

          <Button onClick={handleForgotPassword} variant="secondary">
            Send Reset Link
          </Button>
        </div>
      </Card>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
};