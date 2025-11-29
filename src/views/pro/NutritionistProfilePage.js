// src/views/pro/NutritionistProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Save, Copy, Check, User, Briefcase, Globe, MapPin } from 'lucide-react';

export const NutritionistProfile = ({ currentUser }) => {
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

  console.log('NutritionistProfile render', {
    loading,
    saving,
    hasUser: !!currentUser,
    userId: currentUser?.id,
    profile,
  });

  const loadProfile = useCallback(async () => {
    console.log('NutritionistProfile: loadProfile START');
    setLoading(true);

    try {
      if (!currentUser) {
        console.warn('NutritionistProfile: no currentUser, clearing profile');
        setProfile({
          name: '',
          business_name: '',
          website: '',
          location: '',
          invite_code: '',
        });
        return;
      }

      const userId = currentUser.id;
      console.log(
        'NutritionistProfile: fetching via /api/pro/profile for',
        userId
      );

      const res = await fetch(
        `/api/pro/profile?userId=${encodeURIComponent(userId)}`
      );

      if (!res.ok) {
        console.error(
          'NutritionistProfile: API /pro/profile not ok',
          res.status
        );
        return;
      }

      const json = await res.json();
      console.log('NutritionistProfile: API response', json);

      if (json.profile) {
        setProfile({
          name: json.profile.name || '',
          business_name: json.profile.business_name || '',
          website: json.profile.website || '',
          location: json.profile.location || '',
          invite_code: json.profile.invite_code || '',
        });
      }
    } catch (error) {
      console.error('NutritionistProfile: UNCAUGHT error loading profile', error);
    } finally {
      console.log('NutritionistProfile: loadProfile FINISH');
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    console.log(
      'NutritionistProfile useEffect: calling loadProfile with user',
      currentUser?.id
    );
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!currentUser) {
      console.error('NutritionistProfile: handleSave called with no currentUser');
      return;
    }

    setSaving(true);
    try {
      const userId = currentUser.id;
      console.log('NutritionistProfile: handleSave for user', userId, 'profile:', profile);

      const res = await fetch('/api/pro/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          name: profile.name,
          business_name: profile.business_name,
          website: profile.website,
          location: profile.location,
        }),
      });

      if (!res.ok) {
        console.error(
          'NutritionistProfile: PUT /api/pro/profile not ok',
          res.status
        );
        alert('Failed to save profile. Please try again.');
        return;
      }

      const json = await res.json();
      console.log('NutritionistProfile: save response', json);

      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 3000);
    } catch (error) {
      console.error('NutritionistProfile: UNCAUGHT error saving profile', error);
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
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    console.log('NutritionistProfile: showing "Loading profile..."');
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
            <h3 className="font-semibold text-gray-900 mb-2">
              How clients connect:
            </h3>
            <ol className="text-sm text-gray-700 space-y-2 ml-4 list-decimal">
              <li>Click "Copy Code" above</li>
              <li>Send the code to your client (via email, text, etc.)</li>
              <li>
                Client enters code in their Account Settings → "Connect to
                Nutritionist"
              </li>
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
            <Button onClick={handleSave} disabled={saving} icon={Save}>
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
