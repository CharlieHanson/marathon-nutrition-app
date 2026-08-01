import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Switch,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useProductTour } from '../../context/ProductTourContext';
import { supabase } from '../../../shared/lib/supabase.native';
import { apiClient } from '../../../shared/services/api';
import { useRouter } from 'expo-router';
import { ShareFeedbackModal } from '../../components/modals/ShareFeedbackModal';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut, isGuest } = useAuth();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const { startTour, isActive } = useProductTour();

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // Delete account state
  const [isDeleting, setIsDeleting] = useState(false);

  // Share feedback state
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);

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

  const handleDeleteAccount = () => {
    if (isDeleting) return;

    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account and all associated data?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);

            try {
              const result = await apiClient.deleteAccount({
                userId: user.id,
                confirmationText: 'DELETE',
              });

              if (result.success) {
                Alert.alert(
                  'Account Deleted',
                  'Your account and all data have been permanently deleted.',
                  [
                    {
                      text: 'OK',
                      onPress: async () => {
                        // Sign out and navigate to auth screen
                        await signOut();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Error', result.error || 'Failed to delete account');
              }
            } catch (error) {
              console.error('Delete account error:', error);
              Alert.alert('Error', 'An error occurred. Please try again or contact support.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleReplayTutorial = () => {
    if (isActive) return;
    router.push('/(app)/dashboard');
    startTour();
  };

  const handleOpenPrivacyPolicy = async () => {
    const baseUrl = 'https://alimentanutrition.com';
    const url = `${baseUrl}/privacy`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open browser');
      }
    } catch (error) {
      console.error('Error opening privacy policy:', error);
      Alert.alert('Error', 'Unable to open privacy policy');
    }
  };

  const handleOpenTermsOfService = async () => {
    const baseUrl = 'https://alimentanutrition.com';
    const url = `${baseUrl}/terms`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open browser');
      }
    } catch (error) {
      console.error('Error opening terms of service:', error);
      Alert.alert('Error', 'Unable to open terms of service');
    }
  };

  const styles = getStyles(colors, isDarkMode);

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.bgDecor}>
        <View style={[styles.bgCircle, styles.bgCircleMint]} />
        <View style={[styles.bgCircle, styles.bgCirclePeach]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
      <Text style={styles.title}>Account Settings</Text>

      {/* General Settings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>General</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="moon" size={20} color={colors.textSecondary} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Use dark theme for the app</Text>
            </View>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.gray300, true: colors.primary }}
            thumbColor={isDarkMode ? '#FFFFFF' : '#F3F4F6'}
            ios_backgroundColor={colors.gray300}
          />
        </View>

        {!isGuest ? (
          <TouchableOpacity
            style={[styles.settingRow, styles.tutorialRow]}
            onPress={handleReplayTutorial}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="compass-outline" size={20} color={colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Replay app tutorial</Text>
                <Text style={styles.settingDescription}>
                  Walk through training, meals, and profile again
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.settingRow, styles.tutorialRow]}
          onPress={() => setFeedbackModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textSecondary} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Share Feedback</Text>
              <Text style={styles.settingDescription}>
                Send feedback or report a bug
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Change Password */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Change Password</Text>
        <View style={styles.passwordForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              secureTextEntry
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              secureTextEntry
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleChangePassword}>
            <Text style={styles.primaryButtonText}>Update Password</Text>
          </TouchableOpacity>

          {passwordMessage ? (
            <View
              style={[
                styles.messageBanner,
                passwordMessage.includes('✅') ? styles.messageBannerSuccess : styles.messageBannerError,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  passwordMessage.includes('✅') ? styles.messageTextSuccess : styles.messageTextError,
                ]}
              >
                {passwordMessage}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Legal Information Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Legal Information</Text>
        <View style={styles.legalButtonsContainer}>
          <TouchableOpacity
            style={styles.legalButton}
            onPress={handleOpenPrivacyPolicy}
          >
            <Ionicons name="shield-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.legalButtonText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.legalButton}
            onPress={handleOpenTermsOfService}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.legalButtonText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ShareFeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
      />

      {/* Delete Account Section */}
      <View style={styles.dangerSection}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          <Ionicons name="trash-outline" size={20} color="#DC2626" />
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
        <Text style={styles.deleteWarningText}>
          This will permanently delete your account and all associated data.
        </Text>
      </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  bgDecor: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  bgCircleMint: {
    width: width * 0.72,
    height: width * 0.72,
    backgroundColor: isDarkMode ? 'rgba(224,236,222,0.12)' : '#E0ECDE',
    top: -width * 0.18,
    right: -width * 0.28,
  },
  bgCirclePeach: {
    width: width * 0.78,
    height: width * 0.78,
    backgroundColor: isDarkMode ? 'rgba(247,233,218,0.1)' : '#F7E9DA',
    top: width * 0.22,
    left: -width * 0.42,
  },
  scroll: {
    flex: 1,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 11,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tutorialRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.inputBackground,
    color: colors.text,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  messageBanner: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
  },
  messageBannerSuccess: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  messageBannerError: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageTextSuccess: {
    color: colors.successText,
  },
  messageTextError: {
    color: colors.errorText,
  },
  passwordForm: {
    marginTop: 8,
  },
  // Legal Information Section
  legalButtonsContainer: {
    marginTop: 8,
    gap: 12,
  },
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legalButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  // Delete Account Section
  dangerSection: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.errorBorder,
  },
  dangerSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.errorLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  deleteWarningText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
  },
});

