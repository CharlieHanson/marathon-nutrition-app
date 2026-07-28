import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../shared/lib/supabase.native';
import { useTheme } from '../../context/ThemeContext';

const getSiteUrl = () => {
  const siteUrl = process.env.EXPO_PUBLIC_SITE_URL;
  if (!siteUrl || !String(siteUrl).trim()) {
    throw new Error(
      'Missing EXPO_PUBLIC_SITE_URL. Set it in mobile/.env (local) and as an EAS secret for cloud builds.'
    );
  }
  return String(siteUrl).trim().replace(/\/$/, '');
};

const KEYBOARD_LIFT = 56;

export const ForgotPasswordModal = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    if (!visible) {
      setKeyboardOpen(false);
      return undefined;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const handleSendResetLink = async () => {
    if (!email.trim()) {
      setMessage('❌ Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage('❌ Please enter a valid email address');
      return;
    }

    setMessage('');
    setLoading(true);

    try {
      const baseUrl = getSiteUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${baseUrl}/update-password`,
      });

      if (error) throw error;

      setMessage('✅ Password reset email sent! Check your inbox.');
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setMessage('');
    setKeyboardOpen(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable onPress={handleClose} style={styles.overlayPressable} />
        <View
          style={[
            styles.modalContent,
            keyboardOpen && { transform: [{ translateY: -KEYBOARD_LIFT }] },
          ]}
        >
          <View style={styles.modalInner}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Reset Password</Text>
              <TouchableOpacity
                onPress={handleClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.description}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.placeholderColor}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setMessage('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>

            {message ? (
              <View
                style={[
                  styles.messageContainer,
                  message.includes('✅')
                    ? styles.messageContainerSuccess
                    : styles.messageContainerError,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.includes('✅')
                      ? styles.messageTextSuccess
                      : styles.messageTextError,
                  ]}
                >
                  {message}
                </Text>
              </View>
            ) : null}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.sendButton, loading && styles.sendButtonDisabled]}
                onPress={handleSendResetLink}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.sendButtonText}>Sending...</Text>
                  </>
                ) : (
                  <Text style={styles.sendButtonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

function getStyles(colors) {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    overlayPressable: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 0,
    },
    modalContent: {
      width: '90%',
      maxWidth: 400,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      overflow: 'hidden',
      zIndex: 1,
    },
    modalInner: {
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.text,
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 20,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.gray700,
      marginBottom: 8,
    },
    input: {
      width: '100%',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.borderDark,
      borderRadius: 8,
      backgroundColor: colors.inputBackground,
      color: colors.text,
      fontSize: 16,
    },
    messageContainer: {
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    messageContainerSuccess: {
      backgroundColor: colors.successLight,
      borderWidth: 1,
      borderColor: colors.successBorder,
    },
    messageContainerError: {
      backgroundColor: colors.errorLight,
      borderWidth: 1,
      borderColor: colors.errorBorder,
    },
    messageText: {
      fontSize: 14,
      lineHeight: 20,
    },
    messageTextSuccess: {
      color: colors.successText,
    },
    messageTextError: {
      color: colors.error,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: colors.gray100,
    },
    cancelButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.gray700,
    },
    sendButton: {
      backgroundColor: colors.primary,
      flexDirection: 'row',
      gap: 8,
    },
    sendButtonDisabled: {
      opacity: 0.6,
    },
    sendButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}
