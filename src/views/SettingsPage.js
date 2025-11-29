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
  const [email, setEmail] = useState(user?.email ?? '');

  // Inline messages
  const [passwordMessage, setPasswordMessage] = useState('');
  const [resetMessage, setResetMessage] = useState('');

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

  // Load nutritionist connection on mount / user change
  useEffect(() => {
    if (user) {
      loadNutritionistConnection();
    }
  }, [user]);

  const loadNutritionistConnection = async () => {
    try {
      const { data: connection, error: connError } = await supabase
        .from('client_nutritionist')
        .select('nutritionist_id')
        .eq('client_user_id', user.id)
        .maybeSingle();

      if (connError) throw connError;

      if (connection) {
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

      const { data: existing } = await supabase
        .from('client_nutritionist')
        .select('id')
        .eq('client_user_id', user.id)
        .maybeSingle();

      if (existing) {
        setConnectionMessage(
          '❌ You are already connected to a nutritionist. Disconnect first to connect to a new one.'
        );
        setConnectingCode(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('client_nutritionist')
        .insert({
          client_user_id: user.id,
          nutritionist_id: nutritionist.id,
        });

      if (insertError) throw insertError;

      setConnectionMessage(
        `✅ Successfully connected to ${nutritionist.name || 'your nutritionist'}!`
      );
      setInviteCode('');
      setConnectedNutritionist(nutritionist);

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
      setConnectionMessage('❌ Failed to disconnect. Please try again.');
    }
  };

  // Change password (logged-in users)
  const handleChangePassword = async () => {
    setPasswordMessage('');

    if (newPassword !== confirmPassword) {
      setPasswordMessage('❌ Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage('❌ Password must be at least 6 characters');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordMessage('✅ Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => setPasswordMessage(''), 4000);
    } catch (err) {
      console.error('updateUser error:', err);
      setPasswordMessage(`❌ Error: ${err.message}`);
      setTimeout(() => setPasswordMessage(''), 5000);
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

            <Button onClick={() => setShowNutritionistModal(true)} variant="outline">
              View Nutritionist Details
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-900 font-medium">
                  Not connected to a nutritionist
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Enter an invite code from your nutritionist to connect and receive personalized
                  macro guidance.
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

          <div className="flex flex-col gap-2">
            <Button onClick={handleChangePassword}>Update Password</Button>

            {passwordMessage && (
              <div
                className={`mt-1 p-3 rounded-lg text-sm ${
                  passwordMessage.includes('✅')
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {passwordMessage}
              </div>
            )}
          </div>
        </div>
      </Card>

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
