// src/views/pro/NutritionistProfile.js
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Save, Copy, Check, User, Briefcase, Globe, MapPin } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export const NutritionistProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    business_name: '',
    website: '',
    location: '',
    invite_code: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Load nutritionist profile
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('nutritionists')
        .select('name, business_name, website, location, invite_code')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          name: data.name || '',
          business_name: data.business_name || '',
          website: data.website || '',
          location: data.location || '',
          invite_code: data.invite_code || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('nutritionists')
        .update({
          name: profile.name,
          business_name: profile.business_name,
          website: profile.website,
          location: profile.location,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(profile.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy code');
    }
  };

  const handleUpdate = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
        <p className="text-gray-600 mt-2">
          Manage your professional information and client invite code
        </p>
      </div>

      {/* Invite Code Card */}
      <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-primary-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your Client Invite Code
          </h2>
          <p className="text-gray-600 mb-6">
            Share this code with clients to connect them to your nutritionist account
          </p>
          
          {/* Large Invite Code Display */}
          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <div className="font-mono text-4xl font-bold text-primary tracking-wider mb-4">
              {profile.invite_code || 'LOADING...'}
            </div>
            
            <Button 
              onClick={handleCopyCode}
              className="mx-auto"
              icon={copiedCode ? Check : Copy}
            >
              {copiedCode ? 'Copied!' : 'Copy Code'}
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-white/50 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">How clients connect:</h3>
            <ol className="text-sm text-gray-700 space-y-2 ml-4 list-decimal">
              <li>Click "Copy Code" above</li>
              <li>Send the code to your client (via email, text, etc.)</li>
              <li>Client enters code in their Account Settings → "Connect to Nutritionist"</li>
              <li>You'll see them appear in your Clients list</li>
            </ol>
          </div>
        </div>
      </Card>

      {/* Professional Information Card */}
      <Card
        title="Professional Information"
        subtitle="This information is visible to your clients"
      >
        <div className="space-y-4">
          <Input
            label="Your Name"
            type="text"
            placeholder="e.g., Dr. Jane Smith"
            value={profile.name}
            onChange={(e) => handleUpdate('name', e.target.value)}
            icon={User}
          />

          <Input
            label="Business Name"
            type="text"
            placeholder="e.g., Smith Nutrition Consulting"
            value={profile.business_name}
            onChange={(e) => handleUpdate('business_name', e.target.value)}
            helperText="Optional - your practice or business name"
            icon={Briefcase}
          />

          <Input
            label="Website"
            type="url"
            placeholder="e.g., https://yourwebsite.com"
            value={profile.website}
            onChange={(e) => handleUpdate('website', e.target.value)}
            helperText="Optional - your professional website"
            icon={Globe}
          />

          <Input
            label="Location"
            type="text"
            placeholder="e.g., San Francisco, CA"
            value={profile.location}
            onChange={(e) => handleUpdate('location', e.target.value)}
            helperText="Optional - your city or region"
            icon={MapPin}
          />

          <div className="flex items-center gap-4 pt-2">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              icon={Save}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>

            {showSaveConfirmation && (
              <div className="px-4 py-2 bg-green-50 border border-green-500 rounded-md text-green-700 flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4" />
                <span className="font-medium">Profile saved!</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};