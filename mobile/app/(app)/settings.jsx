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
import { AestheticCard } from '../../components/ui/AestheticSheet';

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
        <Text style={styles.pageTitle}>Settings</Text>

        {/* General */}
        <AestheticCard>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="options-outline" size={20} color="#3D7C65" />
            </View>
            <Text style={styles.sectionTitle}>General</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.rowIcon}>
                <Ionicons name="moon-outline" size={18} color={colors.primary} />
              </View>
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
              style={[styles.settingRow, styles.settingRowDivider]}
              onPress={handleReplayTutorial}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={styles.rowIcon}>
                  <Ionicons name="compass-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Replay app tutorial</Text>
                  <Text style={styles.settingDescription}>
                    Walk through training, meals, and profile again
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.settingRow, styles.settingRowDivider]}
            onPress={() => setFeedbackModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={styles.rowIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Share Feedback</Text>
                <Text style={styles.settingDescription}>Send feedback or report a bug</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </AestheticCard>

        {/* Change Password */}
        <AestheticCard>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="lock-closed-outline" size={20} color="#3D7C65" />
            </View>
            <Text style={styles.sectionTitle}>Change Password</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              secureTextEntry
              placeholderTextColor={colors.placeholderColor || '#9CA3AF'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              secureTextEntry
              placeholderTextColor={colors.placeholderColor || '#9CA3AF'}
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleChangePassword}>
            <Ionicons name="key-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Update Password</Text>
          </TouchableOpacity>

          {passwordMessage ? (
            <View
              style={[
                styles.messageBanner,
                passwordMessage.includes('✅')
                  ? styles.messageBannerSuccess
                  : styles.messageBannerError,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  passwordMessage.includes('✅')
                    ? styles.messageTextSuccess
                    : styles.messageTextError,
                ]}
              >
                {passwordMessage}
              </Text>
            </View>
          ) : null}
        </AestheticCard>

        {/* Legal */}
        <AestheticCard>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="document-text-outline" size={20} color="#3D7C65" />
            </View>
            <Text style={styles.sectionTitle}>Legal Information</Text>
          </View>

          <TouchableOpacity
            style={styles.legalButton}
            onPress={handleOpenPrivacyPolicy}
            activeOpacity={0.7}
          >
            <View style={styles.rowIcon}>
              <Ionicons name="shield-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.legalButtonText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.legalButton, { marginTop: 10 }]}
            onPress={handleOpenTermsOfService}
            activeOpacity={0.7}
          >
            <View style={styles.rowIcon}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.legalButtonText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </AestheticCard>

        {/* Delete Account */}
        <AestheticCard>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, styles.sectionIconDanger]}>
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
            </View>
            <Text style={styles.sectionTitle}>Delete Account</Text>
          </View>

          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
            <Text style={styles.deleteButtonText}>
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.deleteWarningText}>
            This will permanently delete your account and all associated data.
          </Text>
        </AestheticCard>
      </ScrollView>

      <ShareFeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
      />
    </View>
  );
}

const getStyles = (colors, isDarkMode) =>
  StyleSheet.create({
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
      paddingTop: 14,
      paddingBottom: 28,
      gap: 12,
    },
    pageTitle: {
      fontFamily: 'PlayfairDisplay_600SemiBold',
      fontSize: 28,
      color: colors.text,
      letterSpacing: -0.3,
      marginBottom: 2,
    },
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
    sectionIconDanger: {
      backgroundColor: isDarkMode ? 'rgba(220,38,38,0.2)' : 'rgba(220,38,38,0.1)',
    },
    sectionTitle: {
      fontFamily: 'PlayfairDisplay_600SemiBold',
      fontSize: 19,
      color: colors.text,
      letterSpacing: -0.2,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settingRowDivider: {
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
      paddingRight: 10,
    },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: isDarkMode ? 'rgba(61,124,101,0.15)' : 'rgba(61,124,101,0.08)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingText: {
      flex: 1,
    },
    settingLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
      lineHeight: 18,
    },
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
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 14,
      gap: 8,
      minHeight: 50,
      marginTop: 2,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0 : 0.2,
      shadowRadius: 6,
      elevation: isDarkMode ? 0 : 3,
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    messageBanner: {
      marginTop: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
    },
    messageBannerSuccess: {
      backgroundColor: colors.successLight,
      borderColor: colors.successBorder || colors.success,
    },
    messageBannerError: {
      backgroundColor: colors.errorLight,
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
    legalButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: colors.inputBackground,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.border,
    },
    legalButtonText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: colors.errorLight,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.errorBorder,
      minHeight: 50,
    },
    deleteButtonDisabled: {
      opacity: 0.7,
    },
    deleteButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.error,
    },
    deleteWarningText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textTertiary,
      marginTop: 10,
      lineHeight: 17,
      textAlign: 'center',
    },
  });
