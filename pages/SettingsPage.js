// SettingsPage.js
import { useState } from 'react';
import { supabase } from '../src/supabaseClient';
import { Button } from '../src/components/shared/Button';
import { Card } from '../src/components/shared/Card';

export const SettingsPage = ({ user }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  // Change password (logged in users)
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
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage('✅ Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // Send reset email (for users who forgot)
  const handleForgotPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email || user.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setMessage('✅ Password reset email sent! Check your inbox.');
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">Account Settings</h2>

      {/* Change Password (logged in) */}
      <Card>
        <h3 className="text-xl font-semibold mb-4">Change Password</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Confirm new password"
            />
          </div>

          <Button onClick={handleChangePassword}>
            Update Password
          </Button>
        </div>
      </Card>

      {/* Or Send Reset Email */}
      <Card>
        <h3 className="text-xl font-semibold mb-4">Reset via Email</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email || user.email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="your@email.com"
            />
          </div>

          <Button onClick={handleForgotPassword} variant="secondary">
            Send Reset Link
          </Button>
        </div>
      </Card>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};