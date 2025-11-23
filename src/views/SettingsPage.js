// src/views/SettingsPage.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/shared/Button';
import { Card } from '../components/shared/Card';
import { Input } from '../components/shared/Input';
import { NutritionistModal } from '../components/modals/NutritionistModal';
import { Users, CheckCircle, AlertCircle } from 'lucide-react';

function SettingsPage({ user }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');

  // Nutritionist connection state
  const [inviteCode, setInviteCode] = useState('');
  const [connectedNutritionist, setConnectedNutritionist] = useState(null);
  const [loadingConnection, setLoadingConnection] = useState(true);
  const [connectingCode, setConnectingCode] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [showNutritionistModal, setShowNutritionistModal] = useState(false);

  // Keep email field in sync if user changes
  useEffect(() => {
    setEmail(user?.email ?? '');
  }, [user?.email]);

  // Load nutritionist connection on mount
  useEffect(() => {
    if (user) {
      loadNutritionistConnection();
    }
  }, [user]);

  const loadNutritionistConnection = async () => {
    try {
      // Check if user has a nutritionist connection
      const { data: connection, error: connError } = await supabase
        .from('client_nutritionist')
        .select('nutritionist_id')
        .eq('client_user_id', user.id)
        .maybeSingle();

      if (connError) throw connError;

      if (connection) {
        // Fetch nutritionist details using nutritionist_id (which is nutritionists.id)
        const { data: nutritionist, error: nutError } = await supabase
          .from('nutritionists')
          .select('id, name, business_name, website, location, user_id')
          .eq('id', connection.nutritionist_id)
          .single();

        if (nutError) throw nutError;

        setConnectedNutritionist(nutritionist);
      }
    } catch (error) {
      console.error('Error loading nutritionist connection:', error);
    } finally {
      setLoadingConnection(false);
    }
  };

  const handleConnectCode = async () => {
    if (!inviteCode.trim()) {
      setConnectionMessage('❌ Please enter an invite code');
      return;
    }

    if (inviteCode.length !== 8) {
      setConnectionMessage('❌ Invite code must be 8 characters');
      return;
    }

    setConnectingCode(true);
    setConnectionMessage('');

    try {
      // Find nutritionist by invite code - get both id and user_id
      const { data: nutritionist, error: nutError } = await supabase
        .from('nutritionists')
        .select('id, user_id, name, business_name, website, location')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

      if (nutError || !nutritionist) {
        setConnectionMessage('❌ Invalid invite code. Please check and try again.');
        setConnectingCode(false);
        return;
      }

      // Check if already connected
      const { data: existing } = await supabase
        .from('client_nutritionist')
        .select('id')
        .eq('client_user_id', user.id)
        .maybeSingle();

      if (existing) {
        setConnectionMessage('❌ You are already connected to a nutritionist. Disconnect first to connect to a new one.');
        setConnectingCode(false);
        return;
      }

      // Create connection using nutritionists.id (not user_id)
      const { error: insertError } = await supabase
        .from('client_nutritionist')
        .insert({
          client_user_id: user.id,
          nutritionist_id: nutritionist.id,  // Use nutritionists.id, not user_id
        });

      if (insertError) throw insertError;

      setConnectionMessage(`✅ Successfully connected to ${nutritionist.name || 'your nutritionist'}!`);
      setInviteCode('');
      setConnectedNutritionist(nutritionist);
      
      // Clear success message after 3 seconds
      setTimeout(() => setConnectionMessage(''), 3000);
    } catch (error) {
      console.error('Error connecting to nutritionist:', error);
      setConnectionMessage('❌ Failed to connect. Please try again.');
    } finally {
      setConnectingCode(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('client_nutritionist')
        .delete()
        .eq('client_user_id', user.id);

      if (error) throw error;

      setConnectedNutritionist(null);
      setConnectionMessage('✅ Successfully disconnected from nutritionist');
      setTimeout(() => setConnectionMessage(''), 3000);
    } catch (error) {
      console.error('Error disconnecting:', error);
      throw error;
    }
  };

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
      const redirectTo = `${window.location.origin}/update-password`;
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
      <h2 className="text-3xl font-bold">Account Settings</h2>

      {/* Nutritionist Connection */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-semibold">Nutritionist Connection</h3>
        </div>

        {loadingConnection ? (
          <p className="text-gray-600">Loading...</p>
        ) : connectedNutritionist ? (
          // Connected state
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-green-900">
                  Connected to: {connectedNutritionist.name || 'Your Nutritionist'}
                </p>
                {connectedNutritionist.business_name && (
                  <p className="text-sm text-green-700 mt-1">
                    {connectedNutritionist.business_name}
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={() => setShowNutritionistModal(true)}
              variant="outline"
            >
              View Nutritionist Details
            </Button>
          </div>
        ) : (
          // Not connected state
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-900 font-medium">Not connected to a nutritionist</p>
                <p className="text-xs text-blue-700 mt-1">
                  Enter an invite code from your nutritionist to connect and receive personalized macro guidance.
                </p>
              </div>
            </div>

            <div>
              <Input
                label="Invite Code"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter 8-character code"
                maxLength={8}
                helperText="Ask your nutritionist for their invite code"
              />
            </div>

            <Button
              onClick={handleConnectCode}
              disabled={connectingCode || inviteCode.length !== 8}
            >
              {connectingCode ? 'Connecting...' : 'Connect to Nutritionist'}
            </Button>
          </div>
        )}

        {connectionMessage && (
          <div
            className={`mt-4 p-3 rounded-lg ${
              connectionMessage.includes('✅')
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {connectionMessage}
          </div>
        )}
      </Card>

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
              className="w-full px-4 py-2 border rounded-lg"
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

      {/* Nutritionist Modal */}
      <NutritionistModal
        isOpen={showNutritionistModal}
        onClose={() => setShowNutritionistModal(false)}
        nutritionist={connectedNutritionist}
        onDisconnect={handleDisconnect}
      />
    </div>
  );
}

export default SettingsPage;
export { SettingsPage };