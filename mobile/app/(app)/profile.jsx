import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useUserProfile } from '../../hooks/useUserProfile';

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

export default function ProfileScreen() {
  const { user, isGuest } = useAuth();
  const { colors } = useTheme();
  const profileHook = useUserProfile(user, isGuest);

  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);

  const styles = getStyles(colors);

  const handleSave = async () => {
    const { error } = await profileHook.saveProfile();
    if (!error) {
      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 3000);
    } else {
      alert('Failed to save profile');
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="person-outline" size={24} color="#F6921D" />
          </View>
          <Text style={styles.title}>User Profile</Text>
          <Text style={styles.subtitle}>
            Tell us about yourself so we can personalize your nutrition plan. Press Save at the bottom to save your profile.
          </Text>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="person-circle-outline" size={20} color="#F6921D" />
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
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={[styles.input, isGuest && styles.inputDisabled]}
              placeholder="e.g., 25"
              value={profileHook.profile.age || ''}
              onChangeText={(text) => profileHook.updateProfile('age', text)}
              keyboardType="numeric"
              editable={!isGuest}
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.inputHint}>Used to calculate optimal calorie needs</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Height</Text>
            <TextInput
              style={[styles.input, isGuest && styles.inputDisabled]}
              placeholder="e.g., 5'8 or 173cm"
              value={profileHook.profile.height || ''}
              onChangeText={(text) => profileHook.updateProfile('height', text)}
              editable={!isGuest}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight</Text>
            <TextInput
              style={[styles.input, isGuest && styles.inputDisabled]}
              placeholder="e.g., 150 lbs or 68 kg"
              value={profileHook.profile.weight || ''}
              onChangeText={(text) => profileHook.updateProfile('weight', text)}
              editable={!isGuest}
              placeholderTextColor="#9CA3AF"
            />
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
              <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
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
              <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>
            <Text style={styles.inputHint}>Your daily activity excluding structured workouts</Text>
          </View>
        </View>

        {/* Training & Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionDivider} />
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="target-outline" size={20} color="#F6921D" />
            </View>
            <Text style={styles.sectionTitle}>Training & Goals</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Training Objective</Text>
            <TextInput
              style={[styles.textArea, isGuest && styles.inputDisabled]}
              placeholder="e.g., Training for first marathon in 6 months, improve 5K time, build endurance for trail running..."
              value={profileHook.profile.objective || ''}
              onChangeText={(text) => profileHook.updateProfile('objective', text)}
              editable={!isGuest}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.inputHint}>Describe your primary training goal or objective</Text>
          </View>
        </View>

        {/* Dietary Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionDivider} />
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="document-text-outline" size={20} color="#F6921D" />
            </View>
            <Text style={styles.sectionTitle}>Dietary Preferences</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Dietary Restrictions</Text>
            <TextInput
              style={[styles.textArea, isGuest && styles.inputDisabled]}
              placeholder="e.g., vegetarian, gluten-free, nut allergies, lactose intolerant..."
              value={profileHook.profile.dietaryRestrictions || ''}
              onChangeText={(text) => profileHook.updateProfile('dietaryRestrictions', text)}
              editable={!isGuest}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.inputHint}>
              Any foods you must avoid due to allergies, intolerances, or dietary choices
            </Text>
          </View>
        </View>

        {/* Save Section */}
        <View style={styles.saveSection}>
          {!isGuest ? (
            <>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  profileHook.isSaving && styles.saveButtonDisabled,
                ]}
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
        </View>

        {/* Profile Completion Card */}
        {!isGuest && <ProfileCompletionCard profile={profileHook.profile} />}
      </ScrollView>

      {/* Goal Picker Modal */}
      <Modal
        visible={showGoalPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowGoalPicker(false)}>
          <Pressable style={styles.pickerModal} onPress={() => {}}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Weight Goal</Text>
              <TouchableOpacity onPress={() => setShowGoalPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerOptions}>
              {GOAL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pickerOption,
                    profileHook.profile.goal === option.value && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    profileHook.updateProfile('goal', option.value);
                    setShowGoalPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      profileHook.profile.goal === option.value &&
                        styles.pickerOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {profileHook.profile.goal === option.value && (
                    <Ionicons name="checkmark" size={20} color="#F6921D" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Activity Level Picker Modal */}
      <Modal
        visible={showActivityPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActivityPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowActivityPicker(false)}>
          <Pressable style={styles.pickerModal} onPress={() => {}}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Activity Level</Text>
              <TouchableOpacity onPress={() => setShowActivityPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerOptions}>
              {ACTIVITY_LEVEL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pickerOption,
                    profileHook.profile.activityLevel === option.value &&
                      styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    profileHook.updateProfile('activityLevel', option.value);
                    setShowActivityPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      profileHook.profile.activityLevel === option.value &&
                        styles.pickerOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {profileHook.profile.activityLevel === option.value && (
                    <Ionicons name="checkmark" size={20} color="#F6921D" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// Profile Completion Card Component
const ProfileCompletionCard = ({ profile }) => {
  const requiredFields = [
    'name',
    'age',
    'height',
    'weight',
    'goal',
    'activityLevel',
    'objective',
  ];

  const filledFields = requiredFields.filter(
    (field) => profile[field] && profile[field].toString().trim() !== ''
  );

  const completionPercentage = Math.round(
    (filledFields.length / requiredFields.length) * 100
  );

  if (completionPercentage === 100) {
    return null; // Don't show if profile is complete
  }

  return (
    <View style={styles.completionCard}>
      <View style={styles.completionHeader}>
        <View style={styles.completionIcon}>
          <Ionicons name="alert-circle-outline" size={24} color="#F6921D" />
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

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[styles.progressBar, { width: `${completionPercentage}%` }]}
        />
      </View>

      {/* Missing Fields */}
      {completionPercentage < 100 && (
        <View style={styles.missingFieldsContainer}>
          <Text style={styles.missingFieldsLabel}>Missing fields:</Text>
          <View style={styles.missingFieldsTags}>
            {requiredFields
              .filter(
                (field) => !profile[field] || profile[field].toString().trim() === ''
              )
              .map((field) => (
                <View key={field} style={styles.missingFieldTag}>
                  <Text style={styles.missingFieldTagText}>
                    {field
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase())}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      )}
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 20,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    color: colors.text,
    minHeight: 44,
  },
  inputDisabled: {
    backgroundColor: colors.inputBackground,
    color: colors.textTertiary,
  },
  textArea: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '600',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  pickerButtonText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  pickerButtonPlaceholder: {
    color: colors.placeholderColor,
  },
  saveSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    minHeight: 50,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textInverse,
  },
  confirmationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.successLight,
    borderRadius: 10,
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
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCD34D',
    gap: 10,
  },
  guestIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestTextContainer: {
    flex: 1,
  },
  guestTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  guestText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 16,
    fontWeight: '600',
  },
  completionCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: 16,
    marginTop: 8,
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
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionTextContainer: {
    flex: 1,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },
  completionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  completionPercentage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionPercentageText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
  },
  progressBarContainer: {
    height: 8,
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
    paddingVertical: 6,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  missingFieldTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 18,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '900',
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
    paddingHorizontal: 12,
    borderRadius: 10,
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

