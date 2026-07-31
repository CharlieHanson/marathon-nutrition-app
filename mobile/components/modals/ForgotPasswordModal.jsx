import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { supabase } from '../../../shared/lib/supabase.native';
import { useTheme } from '../../context/ThemeContext';
import { AestheticDialog } from '../ui/AestheticSheet';

const getSiteUrl = () => {
  const siteUrl = process.env.EXPO_PUBLIC_SITE_URL;
  if (!siteUrl || !String(siteUrl).trim()) {
    throw new Error(
      'Missing EXPO_PUBLIC_SITE_URL. Set it in mobile/.env (local) and as an EAS secret for cloud builds.'
    );
  }
  return String(siteUrl).trim().replace(/\/$/, '');
};

export const ForgotPasswordModal = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
    onClose();
  };

  const footer = (
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
  );

  return (
    <AestheticDialog
      visible={visible}
      onClose={handleClose}
      icon="lock-closed-outline"
      eyebrow="ACCOUNT"
      title="Reset Password"
      footer={footer}
    >
      <Text style={styles.description}>
        Enter your email address and we'll send you a link to reset your password.
      </Text>

      <Text style={styles.label}>Email Address</Text>
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor={colors.textTertiary}
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
              message.includes('✅') ? styles.messageTextSuccess : styles.messageTextError,
            ]}
          >
            {message}
          </Text>
        </View>
      ) : null}
    </AestheticDialog>
  );
};

function getStyles(colors) {
  return StyleSheet.create({
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
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
      borderRadius: 12,
      backgroundColor: colors.inputBackground,
      color: colors.text,
      fontSize: 16,
      marginBottom: 8,
    },
    messageContainer: {
      padding: 12,
      borderRadius: 12,
      marginTop: 8,
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
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
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
