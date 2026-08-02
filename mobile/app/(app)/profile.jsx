import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { useTheme } from '../../context/ThemeContext';
import { useHeaderSlotActions } from '../../context/HeaderSlotContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import PreferencesScreen from './preferences';
import { parseHeightCm, computeNutritionTargets } from '../../../shared/lib/tdeeCalc.js';
import { AestheticCard } from '../../components/ui/AestheticSheet';

const { width } = Dimensions.get('window');

const GOAL_OPTIONS = [
  { value: 'lose', label: 'Lose weight' },
  { value: 'maintain', label: 'Maintain weight' },
  { value: 'gain', label: 'Gain weight' },
];

const ACTIVITY_LEVEL_OPTIONS = [
  { value: 'low', label: 'Low (desk job, minimal activity)' },
  { value: 'moderate', label: 'Moderate (some walking, active lifestyle)' },
  { value: 'high', label: 'High (active job, lots of movement)' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other / Prefer not to say' },
];

const WEIGHT_UNITS = [
  { value: 'lbs', label: 'lbs' },
  { value: 'kg', label: 'kg' },
];

const HEIGHT_UNITS = [
  { value: 'm', label: 'm' },
  { value: 'ft', label: 'ft / in' },
];

const AGE_OPTIONS = Array.from({ length: 150 - 13 + 1 }, (_, i) => {
  const age = String(13 + i);
  return { value: age, label: age };
});

function parseWeightForDisplay(raw) {
  if (!raw || typeof raw !== 'string') return { value: '', unit: 'lbs' };
  const s = raw.trim().toLowerCase();
  const kgMatch = s.match(/^(\d+\.?\d*)\s*(kg|kgs|kilos?)$/);
  if (kgMatch) return { value: kgMatch[1], unit: 'kg' };
  const lbMatch = s.match(/^(\d+\.?\d*)\s*(lbs?|pounds?)$/);
  if (lbMatch) return { value: lbMatch[1], unit: 'lbs' };
  const numMatch = s.match(/^(\d+\.?\d*)/);
  if (numMatch) return { value: numMatch[1], unit: 'lbs' };
  return { value: '', unit: 'lbs' };
}

function parseHeightForDisplay(raw) {
  const emptyFt = { unit: 'ft', feet: '', inches: '' };
  const emptyM = { unit: 'm', meters: '', feet: '', inches: '' };

  if (!raw || typeof raw !== 'string') return emptyFt;
  const s = raw.trim().toLowerCase();

  const hasMetricMarker = /\s*(m|meters?|cm)\s*$/i.test(s);
  const hasImperialMarker = /(?:'|'|'|′|ft|feet|foot)|(?:"|"|"|″|in|inches)|['"″]/i.test(s);

  const cm = parseHeightCm(raw);

  if (cm == null && hasMetricMarker) return emptyM;
  if (cm == null) return emptyFt;

  const isMetric = /^\d+\.?\d*\s*(m|meters?|cm)\s*$/i.test(s);
  const isImperial = /\d+\.?\d*\s*(?:'|'|'|′|ft|feet|foot)|(\d+\.?\d*)\s*(in|inches)|['"″]/i.test(s);
  const plainNum = parseFloat(s);
  const looksLikeMetric = !isNaN(plainNum) && plainNum > 100;

  let unit = 'ft';
  if (isMetric || (looksLikeMetric && !isImperial)) unit = 'm';
  else if (isImperial) unit = 'ft';

  if (unit === 'm') {
    let meters = '';
    const mMatch = s.match(/^(\d+\.?\d*)\s*(m|meters?)$/);
    if (mMatch) {
      meters = mMatch[1];
    } else {
      meters = String((cm / 100).toFixed(2));
    }
    return { unit: 'm', meters, feet: '', inches: '' };
  }
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round((totalInches % 12) * 10) / 10;
  return { unit: 'ft', feet: String(feet), inches: String(inches), meters: '' };
}

export default function ProfileScreen() {
  const { user, isGuest } = useAuth();
  const { isConnected } = useNetwork();
  const { colors, isDarkMode } = useTheme();
  const { setHeaderSlot, clearHeaderSlot } = useHeaderSlotActions();
  const profileHook = useUserProfile(user, isGuest);
  const styles = useMemo(() => getStyles(colors, isDarkMode), [colors, isDarkMode]);
  const params = useLocalSearchParams();

  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showMacrosModal, setShowMacrosModal] = useState(false);
  const [tdeeResults, setTdeeResults] = useState(null);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showAgePicker, setShowAgePicker] = useState(false);
  const [showWeightUnitPicker, setShowWeightUnitPicker] = useState(false);
  const [showHeightUnitPicker, setShowHeightUnitPicker] = useState(false);
  const [activeTab, setActiveTab] = useState(
    params.tab === 'preferences' ? 'preferences' : 'profile'
  );

  useEffect(() => {
    if (params.tab === 'preferences') setActiveTab('preferences');
    else if (params.tab === 'profile') setActiveTab('profile');
  }, [params.tab]);

  const [heightUnit, setHeightUnit] = useState(() => parseHeightForDisplay(profileHook.profile.height).unit);
  const [heightMeters, setHeightMeters] = useState(() => parseHeightForDisplay(profileHook.profile.height).meters);
  const [heightFeet, setHeightFeet] = useState(() => parseHeightForDisplay(profileHook.profile.height).feet);
  const [heightInches, setHeightInches] = useState(() => parseHeightForDisplay(profileHook.profile.height).inches);

  const [weightValue, setWeightValue] = useState(() => parseWeightForDisplay(profileHook.profile.weight).value);
  const [weightUnit, setWeightUnit] = useState(() => parseWeightForDisplay(profileHook.profile.weight).unit);

  React.useEffect(() => {
    const parsed = parseHeightForDisplay(profileHook.profile.height);
    setHeightUnit(parsed.unit);
    setHeightMeters(parsed.meters);
    setHeightFeet(parsed.feet);
    setHeightInches(parsed.inches);
  }, [profileHook.profile.height]);

  React.useEffect(() => {
    const parsed = parseWeightForDisplay(profileHook.profile.weight);
    setWeightValue(parsed.value);
    setWeightUnit(parsed.unit);
  }, [profileHook.profile.weight]);

  const updateHeightInProfile = () => {
    if (heightUnit === 'm') {
      profileHook.updateProfile('height', heightMeters ? `${heightMeters} m` : '');
    } else {
      profileHook.updateProfile('height', heightFeet || heightInches ? `${heightFeet || '0'} ft ${heightInches || '0'} in` : '');
    }
  };

  const updateWeightInProfile = () => {
    profileHook.updateProfile('weight', weightValue ? `${weightValue} ${weightUnit}` : '');
  };

  useFocusEffect(
    useCallback(() => {
      if (profileHook.loadingProfile) {
        setHeaderSlot(null, 'profile');
        return () => clearHeaderSlot('profile');
      }

      setHeaderSlot(
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
            onPress={() => setActiveTab('profile')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'profile' }}
            accessibilityLabel="Profile"
          >
            <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
              Profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'preferences' && styles.tabActive]}
            onPress={() => setActiveTab('preferences')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'preferences' }}
            accessibilityLabel="Preferences"
          >
            <Text style={[styles.tabText, activeTab === 'preferences' && styles.tabTextActive]}>
              Preferences
            </Text>
          </TouchableOpacity>
        </View>,
        'profile'
      );

      return () => clearHeaderSlot('profile');
    }, [
      activeTab,
      clearHeaderSlot,
      profileHook.loadingProfile,
      setHeaderSlot,
      styles,
    ])
  );

  const handleSave = async () => {
    if (isConnected === false) {
      Alert.alert('No Connection', 'Please check your internet connection and try again.');
      return;
    }
    updateHeightInProfile();
    updateWeightInProfile();

    const { error } = await profileHook.saveProfile();
    if (!error) {
      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 3000);
    } else {
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    }
  };

  const handleCalculateMacros = () => {
    updateHeightInProfile();
    updateWeightInProfile();
    try {
      const p = profileHook.profile;
      const noWorkouts = computeNutritionTargets({
        userProfile: {
          height: p.height,
          weight: p.weight,
          age: p.age,
          gender: p.gender,
          goal: p.goal,
          activity_level: p.activityLevel,
        },
        todayWorkouts: [],
        workoutTiming: null,
      });
      const withWorkouts = computeNutritionTargets({
        userProfile: {
          height: p.height,
          weight: p.weight,
          age: p.age,
          gender: p.gender,
          goal: p.goal,
          activity_level: p.activityLevel,
        },
        todayWorkouts: [{ type: 'Distance Run', intensity: 8, distance: '10k' }],
        workoutTiming: 'am',
      });
      setTdeeResults({ noWorkouts, withWorkouts });
      setShowMacrosModal(true);
    } catch (error) {
      Alert.alert('Error', `Could not calculate macros: ${error.message}`);
    }
  };

  if (profileHook.loadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Decorative background circles */}
      <View pointerEvents="none" style={styles.bgDecor}>
        <View style={[styles.bgCircle, styles.bgCircleMint]} />
        <View style={[styles.bgCircle, styles.bgCirclePeach]} />
      </View>

      <View style={styles.contentWrapper}>
        {activeTab === 'preferences' ? (
          <View style={styles.tabContent}>
            <PreferencesScreen />
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

            {profileHook.error &&
            !Object.values(profileHook.profile || {}).some(
              (v) => v != null && String(v).trim() !== ''
            ) ? (
              <View style={styles.fetchErrorBanner}>
                <Text style={styles.fetchErrorBannerText}>
                  Couldn't load your profile. Pull down to refresh.
                </Text>
              </View>
            ) : null}

            {/* Personal Information */}
            <AestheticCard>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="person-circle-outline" size={20} color="#3D7C65" />
                </View>
                <Text style={styles.sectionTitle}>Personal Information</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={[styles.input, isGuest && styles.inputDisabled]}
                  placeholder="Enter your name"
                  value={profileHook.profile.name || ''}
                  onChangeText={(text) => profileHook.updateProfile('name', text)}
                  editable={!isGuest}
                  placeholderTextColor={colors.placeholderColor}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Age</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, isGuest && styles.inputDisabled]}
                  onPress={() => !isGuest && setShowAgePicker(true)}
                  disabled={isGuest}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      !AGE_OPTIONS.some((o) => o.value === String(profileHook.profile.age || '').trim()) &&
                        styles.pickerButtonPlaceholder,
                    ]}
                  >
                    {AGE_OPTIONS.some((o) => o.value === String(profileHook.profile.age || '').trim())
                      ? String(profileHook.profile.age)
                      : 'Select age'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Gender</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, isGuest && styles.inputDisabled]}
                  onPress={() => !isGuest && setShowGenderPicker(true)}
                  disabled={isGuest}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      !profileHook.profile.gender && styles.pickerButtonPlaceholder,
                    ]}
                  >
                    {profileHook.profile.gender
                      ? GENDER_OPTIONS.find((opt) => opt.value === profileHook.profile.gender)?.label ||
                        profileHook.profile.gender
                      : 'Select gender'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Height</Text>
                {heightUnit === 'm' ? (
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.inputFlex, isGuest && styles.inputDisabled]}
                      placeholder="e.g., 1.73"
                      value={heightMeters}
                      onChangeText={setHeightMeters}
                      onBlur={updateHeightInProfile}
                      keyboardType="decimal-pad"
                      editable={!isGuest}
                      placeholderTextColor={colors.placeholderColor}
                    />
                    <TouchableOpacity
                      style={[styles.unitButton, isGuest && styles.inputDisabled]}
                      onPress={() => !isGuest && setShowHeightUnitPicker(true)}
                      disabled={isGuest}
                    >
                      <Text style={styles.unitButtonText}>
                        {heightUnit === 'm' ? 'm' : 'ft/in'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.inputSmall, isGuest && styles.inputDisabled]}
                      placeholder="0"
                      value={heightFeet}
                      onChangeText={(text) => setHeightFeet(text.replace(/\D/g, '').slice(0, 2))}
                      onBlur={updateHeightInProfile}
                      keyboardType="number-pad"
                      editable={!isGuest}
                      placeholderTextColor={colors.placeholderColor}
                    />
                    <Text style={styles.unitLabel}>ft</Text>
                    <TextInput
                      style={[styles.inputSmall, isGuest && styles.inputDisabled]}
                      placeholder="0"
                      value={heightInches}
                      onChangeText={(text) => setHeightInches(text.replace(/[^\d.]/g, '').slice(0, 5))}
                      onBlur={updateHeightInProfile}
                      keyboardType="decimal-pad"
                      editable={!isGuest}
                      placeholderTextColor={colors.placeholderColor}
                    />
                    <Text style={styles.unitLabel}>in</Text>
                    <TouchableOpacity
                      style={[styles.unitButton, isGuest && styles.inputDisabled]}
                      onPress={() => !isGuest && setShowHeightUnitPicker(true)}
                      disabled={isGuest}
                    >
                      <Text style={styles.unitButtonText}>
                        {heightUnit === 'm' ? 'm' : 'ft / in'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.inputFlex, isGuest && styles.inputDisabled]}
                    placeholder="e.g., 150 or 68"
                    value={weightValue}
                    onChangeText={setWeightValue}
                    onBlur={updateWeightInProfile}
                    keyboardType="decimal-pad"
                    editable={!isGuest}
                    placeholderTextColor={colors.placeholderColor}
                  />
                  <TouchableOpacity
                    style={[styles.unitButton, isGuest && styles.inputDisabled]}
                    onPress={() => !isGuest && setShowWeightUnitPicker(true)}
                    disabled={isGuest}
                  >
                    <Text style={styles.unitButtonText}>{weightUnit}</Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight Goal</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, isGuest && styles.inputDisabled]}
                  onPress={() => !isGuest && setShowGoalPicker(true)}
                  disabled={isGuest}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      !profileHook.profile.goal && styles.pickerButtonPlaceholder,
                    ]}
                  >
                    {profileHook.profile.goal
                      ? GOAL_OPTIONS.find((opt) => opt.value === profileHook.profile.goal)?.label ||
                        profileHook.profile.goal
                      : 'Select goal'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                <Text style={styles.inputLabel}>Activity Level (outside training)</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, isGuest && styles.inputDisabled]}
                  onPress={() => !isGuest && setShowActivityPicker(true)}
                  disabled={isGuest}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      !profileHook.profile.activityLevel && styles.pickerButtonPlaceholder,
                    ]}
                  >
                    {profileHook.profile.activityLevel
                      ? ACTIVITY_LEVEL_OPTIONS.find(
                          (opt) => opt.value === profileHook.profile.activityLevel
                        )?.label || profileHook.profile.activityLevel
                      : 'Select level'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
                <Text style={styles.inputHint}>Your daily activity excluding structured workouts</Text>
              </View>
            </AestheticCard>

            {/* Training & Goals */}
            <AestheticCard>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="target-outline" size={20} color="#3D7C65" />
                </View>
                <Text style={styles.sectionTitle}>Training & Goals</Text>
              </View>

              <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                <Text style={styles.inputLabel}>Training Objective</Text>
                <TextInput
                  style={[styles.textArea, isGuest && styles.inputDisabled]}
                  placeholder="e.g., Training for first marathon in 6 months, improve 5K time, build endurance for trail running..."
                  value={profileHook.profile.objective || ''}
                  onChangeText={(text) => profileHook.updateProfile('objective', text)}
                  editable={!isGuest}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor={colors.placeholderColor}
                />
                <Text style={styles.inputHint}>Describe your primary training goal or objective</Text>
              </View>
            </AestheticCard>

            {/* Dietary Preferences */}
            <AestheticCard>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="document-text-outline" size={20} color="#3D7C65" />
                </View>
                <Text style={styles.sectionTitle}>Dietary Preferences</Text>
              </View>

              <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                <Text style={styles.inputLabel}>Dietary Restrictions</Text>
                <TextInput
                  style={[styles.textArea, isGuest && styles.inputDisabled]}
                  placeholder="e.g., vegetarian, gluten-free, nut allergies, lactose intolerant..."
                  value={profileHook.profile.dietaryRestrictions || ''}
                  onChangeText={(text) => profileHook.updateProfile('dietaryRestrictions', text)}
                  editable={!isGuest}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor={colors.placeholderColor}
                />
                <Text style={styles.inputHint}>
                  Any foods you must avoid due to allergies, intolerances, or dietary choices
                </Text>
              </View>
            </AestheticCard>

            {/* Save Section */}
            <AestheticCard>
              {!isGuest ? (
                <>
                  <TouchableOpacity
                    style={[styles.saveButton, profileHook.isSaving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={profileHook.isSaving}
                  >
                    {profileHook.isSaving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                    )}
                    <Text style={styles.saveButtonText}>
                      {profileHook.isSaving ? 'Saving...' : 'Save Profile'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, { marginTop: 10 }]}
                    onPress={handleCalculateMacros}
                  >
                    <Ionicons name="calculator-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Calculate my Macros</Text>
                  </TouchableOpacity>

                  {showSaveConfirmation && (
                    <View style={styles.confirmationBadge}>
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                      <Text style={styles.confirmationText}>Profile saved successfully!</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.guestMessage}>
                  <View style={styles.guestIconContainer}>
                    <Ionicons name="lock-closed" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.guestTextContainer}>
                    <Text style={styles.guestTitle}>Guest Mode</Text>
                    <Text style={styles.guestText}>
                      You're browsing in guest mode. Create an account or sign in to save your profile
                      and access all features.
                    </Text>
                  </View>
                </View>
              )}
            </AestheticCard>

            {!isGuest && <ProfileCompletionCard profile={profileHook.profile} styles={styles} />}
          </ScrollView>
        )}
      </View>

      {/* Age Picker Modal */}
      <Modal visible={showAgePicker} transparent animationType="slide" onRequestClose={() => setShowAgePicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAgePicker(false)}>
          <Pressable style={styles.pickerModal} onPress={() => {}}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Age</Text>
              <TouchableOpacity onPress={() => setShowAgePicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerOptions}>
              {AGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pickerOption,
                    String(profileHook.profile.age) === option.value && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    profileHook.updateProfile('age', option.value);
                    setShowAgePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      String(profileHook.profile.age) === option.value && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {String(profileHook.profile.age) === option.value && (
                    <Ionicons name="checkmark" size={20} color="#3D7C65" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Goal Picker Modal */}
      <Modal visible={showGoalPicker} transparent animationType="slide" onRequestClose={() => setShowGoalPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowGoalPicker(false)}>
          <Pressable style={styles.pickerModal} onPress={() => {}}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Weight Goal</Text>
              <TouchableOpacity onPress={() => setShowGoalPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerOptions}>
              {GOAL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.pickerOption, profileHook.profile.goal === option.value && styles.pickerOptionSelected]}
                  onPress={() => { profileHook.updateProfile('goal', option.value); setShowGoalPicker(false); }}
                >
                  <Text style={[styles.pickerOptionText, profileHook.profile.goal === option.value && styles.pickerOptionTextSelected]}>
                    {option.label}
                  </Text>
                  {profileHook.profile.goal === option.value && <Ionicons name="checkmark" size={20} color="#3D7C65" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Activity Level Picker Modal */}
      <Modal visible={showActivityPicker} transparent animationType="slide" onRequestClose={() => setShowActivityPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowActivityPicker(false)}>
          <Pressable style={styles.pickerModal} onPress={() => {}}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Activity Level</Text>
              <TouchableOpacity onPress={() => setShowActivityPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerOptions}>
              {ACTIVITY_LEVEL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.pickerOption, profileHook.profile.activityLevel === option.value && styles.pickerOptionSelected]}
                  onPress={() => { profileHook.updateProfile('activityLevel', option.value); setShowActivityPicker(false); }}
                >
                  <Text style={[styles.pickerOptionText, profileHook.profile.activityLevel === option.value && styles.pickerOptionTextSelected]}>
                    {option.label}
                  </Text>
                  {profileHook.profile.activityLevel === option.value && <Ionicons name="checkmark" size={20} color="#3D7C65" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Gender Picker Modal */}
      <Modal visible={showGenderPicker} transparent animationType="slide" onRequestClose={() => setShowGenderPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowGenderPicker(false)}>
          <Pressable style={styles.pickerModal} onPress={() => {}}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Gender</Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerOptions}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.pickerOption, profileHook.profile.gender === option.value && styles.pickerOptionSelected]}
                  onPress={() => { profileHook.updateProfile('gender', option.value); setShowGenderPicker(false); }}
                >
                  <Text style={[styles.pickerOptionText, profileHook.profile.gender === option.value && styles.pickerOptionTextSelected]}>
                    {option.label}
                  </Text>
                  {profileHook.profile.gender === option.value && <Ionicons name="checkmark" size={20} color="#3D7C65" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Weight Unit Picker Modal */}
      <Modal visible={showWeightUnitPicker} transparent animationType="slide" onRequestClose={() => setShowWeightUnitPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowWeightUnitPicker(false)}>
          <Pressable style={styles.pickerModal} onPress={() => {}}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Weight Unit</Text>
              <TouchableOpacity onPress={() => setShowWeightUnitPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerOptions}>
              {WEIGHT_UNITS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.pickerOption, weightUnit === option.value && styles.pickerOptionSelected]}
                  onPress={() => {
                    setWeightUnit(option.value);
                    profileHook.updateProfile('weight', weightValue ? `${weightValue} ${option.value}` : '');
                    setShowWeightUnitPicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, weightUnit === option.value && styles.pickerOptionTextSelected]}>
                    {option.label}
                  </Text>
                  {weightUnit === option.value && <Ionicons name="checkmark" size={20} color="#3D7C65" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Height Unit Picker Modal */}
      <Modal visible={showHeightUnitPicker} transparent animationType="slide" onRequestClose={() => setShowHeightUnitPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowHeightUnitPicker(false)}>
          <Pressable style={styles.pickerModal} onPress={() => {}}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Height Unit</Text>
              <TouchableOpacity onPress={() => setShowHeightUnitPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerOptions}>
              {HEIGHT_UNITS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.pickerOption, heightUnit === option.value && styles.pickerOptionSelected]}
                  onPress={() => {
                    setHeightUnit(option.value);
                    if (option.value === 'm') {
                      const feet = parseFloat(heightFeet) || 0;
                      const inches = parseFloat(heightInches) || 0;
                      const totalInches = feet * 12 + inches;
                      const cm = totalInches * 2.54;
                      const meters = (cm / 100).toFixed(2);
                      setHeightMeters(meters);
                      profileHook.updateProfile('height', `${meters} m`);
                    } else {
                      const meters = parseFloat(heightMeters);
                      if (!isNaN(meters)) {
                        const cm = meters * 100;
                        const totalInches = cm / 2.54;
                        const feet = Math.floor(totalInches / 12);
                        const inches = Math.round((totalInches % 12) * 10) / 10;
                        setHeightFeet(String(feet));
                        setHeightInches(String(inches));
                        profileHook.updateProfile('height', `${feet} ft ${inches} in`);
                      } else {
                        setHeightFeet('');
                        setHeightInches('');
                        profileHook.updateProfile('height', '');
                      }
                    }
                    setShowHeightUnitPicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, heightUnit === option.value && styles.pickerOptionTextSelected]}>
                    {option.label}
                  </Text>
                  {heightUnit === option.value && <Ionicons name="checkmark" size={20} color="#3D7C65" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Calculate Macros Modal */}
      <Modal visible={showMacrosModal} transparent animationType="slide" onRequestClose={() => setShowMacrosModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlayPressable} onPress={() => setShowMacrosModal(false)} />
          <View style={styles.macrosModal}>
            <View style={styles.macrosModalInner}>
              <View style={styles.macrosModalHeader}>
                <Text style={styles.pickerModalTitle}>Your Daily Nutrition Targets</Text>
                <TouchableOpacity onPress={() => setShowMacrosModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.macrosModalSubtitle}>Based on your profile and goals</Text>
              {tdeeResults && (
                <ScrollView
                  style={styles.macrosModalScroll}
                  contentContainerStyle={styles.macrosModalScrollContent}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  bounces={true}
                  scrollEventThrottle={16}
                >
                  <View style={styles.macrosSection}>
                    <Text style={styles.macrosSectionTitle}>Rest days</Text>
                    <View style={styles.macrosStatsRow}>
                      <View style={styles.macrosStatCard}>
                        <Text style={styles.macrosStatLabel}>Base metabolism (BMR)</Text>
                        <Text style={[styles.macrosStatValue, { color: '#2563EB' }]}>{tdeeResults.noWorkouts.bmr}</Text>
                        <Text style={styles.macrosStatUnit}>cal/day</Text>
                      </View>
                      <View style={styles.macrosStatCard}>
                        <Text style={styles.macrosStatLabel}>Daily burn (TDEE)</Text>
                        <Text style={[styles.macrosStatValue, { color: '#16A34A' }]}>{tdeeResults.noWorkouts.tdee}</Text>
                        <Text style={styles.macrosStatUnit}>cal/day</Text>
                      </View>
                      <View style={styles.macrosStatCard}>
                        <Text style={styles.macrosStatLabel}>Target calories</Text>
                        <Text style={[styles.macrosStatValue, { color: '#EA580C' }]}>{tdeeResults.noWorkouts.adjustedTdee}</Text>
                        <Text style={styles.macrosStatUnit}>cal/day (for your goal)</Text>
                      </View>
                    </View>
                    <View style={styles.macrosDailyBox}>
                      <Text style={styles.macrosDailyTitle}>Daily macros</Text>
                      <Text style={styles.macrosDailyText}>
                        Protein: {tdeeResults.noWorkouts.dailyMacros.protein}g · Carbs: {tdeeResults.noWorkouts.dailyMacros.carbs}g · Fat: {tdeeResults.noWorkouts.dailyMacros.fat}g
                      </Text>
                    </View>
                  </View>

                  <View style={styles.macrosSection}>
                    <Text style={styles.macrosSectionTitle}>Training days (example: 10k run)</Text>
                    <View style={styles.macrosStatsRow}>
                      <View style={styles.macrosStatCard}>
                        <Text style={styles.macrosStatLabel}>Base metabolism (BMR)</Text>
                        <Text style={[styles.macrosStatValue, { color: '#2563EB' }]}>{tdeeResults.withWorkouts.bmr}</Text>
                        <Text style={styles.macrosStatUnit}>cal/day</Text>
                      </View>
                      <View style={styles.macrosStatCard}>
                        <Text style={styles.macrosStatLabel}>Daily burn (TDEE)</Text>
                        <Text style={[styles.macrosStatValue, { color: '#16A34A' }]}>{tdeeResults.withWorkouts.tdee}</Text>
                        <Text style={styles.macrosStatUnit}>cal/day (includes workout)</Text>
                      </View>
                      <View style={styles.macrosStatCard}>
                        <Text style={styles.macrosStatLabel}>Target calories</Text>
                        <Text style={[styles.macrosStatValue, { color: '#EA580C' }]}>{tdeeResults.withWorkouts.adjustedTdee}</Text>
                        <Text style={styles.macrosStatUnit}>cal/day (for your goal)</Text>
                      </View>
                    </View>
                    <View style={styles.macrosDailyBox}>
                      <Text style={styles.macrosDailyTitle}>Daily macros</Text>
                      <Text style={styles.macrosDailyText}>
                        Protein: {tdeeResults.withWorkouts.dailyMacros.protein}g · Carbs: {tdeeResults.withWorkouts.dailyMacros.carbs}g · Fat: {tdeeResults.withWorkouts.dailyMacros.fat}g
                      </Text>
                    </View>
                    <View style={styles.macrosMealBox}>
                      <Text style={styles.macrosMealTitle}>Per-meal targets (morning workout)</Text>
                      {Object.entries(tdeeResults.withWorkouts.mealBudgets).map(([meal, macros], idx, arr) => (
                        <View key={meal} style={[styles.macrosMealRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
                          <Text style={styles.macrosMealName}>{meal.charAt(0).toUpperCase() + meal.slice(1)}</Text>
                          <Text style={styles.macrosMealMacros}>
                            P: {macros.protein}g · C: {macros.carbs}g · F: {macros.fat}g
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ProfileCompletionCard = ({ profile, styles }) => {
  const requiredFields = ['name', 'age', 'height', 'weight', 'goal', 'activityLevel', 'objective'];
  const filledFields = requiredFields.filter(
    (field) => profile[field] && profile[field].toString().trim() !== ''
  );
  const completionPercentage = Math.round((filledFields.length / requiredFields.length) * 100);

  if (completionPercentage === 100) return null;

  return (
    <View style={styles.completionCard}>
      <View style={styles.completionHeader}>
        <View style={styles.completionIcon}>
          <Ionicons name="alert-circle-outline" size={24} color="#3D7C65" />
        </View>
        <View style={styles.completionTextContainer}>
          <Text style={styles.completionTitle}>Profile Completion</Text>
          <Text style={styles.completionSubtitle}>
            Complete your profile for more personalized meal plans
          </Text>
        </View>
        <View style={styles.completionPercentage}>
          <Text style={styles.completionPercentageText}>{completionPercentage}%</Text>
        </View>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${completionPercentage}%` }]} />
      </View>
      {completionPercentage < 100 && (
        <View style={styles.missingFieldsContainer}>
          <Text style={styles.missingFieldsLabel}>Missing fields:</Text>
          <View style={styles.missingFieldsTags}>
            {requiredFields
              .filter((field) => !profile[field] || profile[field].toString().trim() === '')
              .map((field) => (
                <View key={field} style={styles.missingFieldTag}>
                  <Text style={styles.missingFieldTagText}>
                    {field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      )}
    </View>
  );
};

const getStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // ── Background decoration ──
  bgDecor: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  bgCircleMint: {
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: isDarkMode ? 'rgba(224,236,222,0.07)' : '#E0ECDE',
    top: -width * 0.2,
    right: -width * 0.32,
  },
  bgCirclePeach: {
    width: width * 0.75,
    height: width * 0.75,
    backgroundColor: isDarkMode ? 'rgba(247,233,218,0.07)' : '#F7E9DA',
    top: width * 0.6,
    left: -width * 0.42,
  },
  // ── Tab bar — soft pill segmented control ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: isDarkMode ? colors.cardBackground : colors.inputBackground,
    borderRadius: 20,
    padding: 3,
    gap: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // ── Content wrapper — transparent, open bg ──
  contentWrapper: {
    flex: 1,
    zIndex: 1,
  },
  tabContent: {
    flex: 1,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 12,
  },
  fetchErrorBanner: {
    backgroundColor: colors.errorLight || '#FEF2F2',
    borderWidth: 1,
    borderColor: colors.errorBorder || '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fetchErrorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error || '#DC2626',
    lineHeight: 18,
  },
  // ── Section headers ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: isDarkMode ? 'rgba(61,124,101,0.2)' : 'rgba(61,124,101,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 19,
    color: colors.text,
    letterSpacing: -0.2,
  },
  // ── Inputs ──
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 7,
    letterSpacing: 0.1,
  },
  input: {
    paddingHorizontal: 13,
    paddingVertical: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    color: colors.text,
    minHeight: 46,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  textArea: {
    paddingHorizontal: 13,
    paddingVertical: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 5,
    fontWeight: '500',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 46,
  },
  pickerButtonText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  pickerButtonPlaceholder: {
    color: colors.placeholderColor,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputFlex: {
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    color: colors.text,
    minHeight: 46,
  },
  inputSmall: {
    width: 64,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    color: colors.text,
    minHeight: 46,
    textAlign: 'center',
  },
  unitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 46,
    minWidth: 80,
    gap: 4,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  unitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginHorizontal: 2,
  },
  // ── Save ──
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
    minHeight: 50,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0 : 0.2,
    shadowRadius: 6,
    elevation: isDarkMode ? 0 : 3,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  confirmationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.successLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success,
    gap: 8,
  },
  confirmationText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.successText,
  },
  guestMessage: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: colors.warningLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
    gap: 10,
  },
  guestIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestTextContainer: {
    flex: 1,
  },
  guestTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.warning,
    marginBottom: 2,
  },
  guestText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    fontWeight: '600',
  },
  // ── Profile completion card ──
  completionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0 : 0.05,
    shadowRadius: 6,
    elevation: isDarkMode ? 0 : 1,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  completionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDarkMode ? 'rgba(61,124,101,0.2)' : 'rgba(61,124,101,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionTextContainer: {
    flex: 1,
  },
  completionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 17,
    color: colors.text,
    marginBottom: 3,
  },
  completionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  completionPercentage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionPercentageText: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.primary,
  },
  progressBarContainer: {
    height: 7,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  missingFieldsContainer: {
    marginTop: 4,
  },
  missingFieldsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  missingFieldsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  missingFieldTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.inputBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  missingFieldTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  // ── Modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  modalOverlayPressable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  pickerModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    padding: 20,
  },
  macrosModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    overflow: 'hidden',
    zIndex: 1,
  },
  macrosModalInner: {
    flex: 1,
    flexDirection: 'column',
    pointerEvents: 'auto',
    padding: 18,
    paddingTop: 14,
  },
  macrosModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  macrosModalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    marginTop: 4,
  },
  macrosModalScroll: {
    flex: 1,
    minHeight: 0,
    flexShrink: 1,
  },
  macrosModalScrollContent: {
    paddingBottom: 32,
    flexGrow: 1,
  },
  macrosSection: {
    marginBottom: 20,
  },
  macrosSectionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 17,
    color: colors.text,
    marginBottom: 12,
  },
  macrosStatsRow: {
    gap: 10,
    marginBottom: 12,
  },
  macrosStatCard: {
    padding: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
  },
  macrosStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  macrosStatValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  macrosStatUnit: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  macrosDailyBox: {
    padding: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    marginBottom: 8,
  },
  macrosDailyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  macrosDailyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  macrosMealBox: {
    padding: 12,
    backgroundColor: isDarkMode ? colors.background : colors.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? colors.borderDark : colors.primaryBorder,
  },
  macrosMealTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  macrosMealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  macrosMealName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  macrosMealMacros: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerModalTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    color: colors.text,
  },
  pickerOptions: {
    maxHeight: 400,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 13,
    marginBottom: 6,
    backgroundColor: colors.inputBackground,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pickerOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  pickerOptionTextSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
});
