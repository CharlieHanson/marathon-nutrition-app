import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { usePostHog } from 'posthog-react-native';
import { supabase } from '../../../shared/lib/supabase.native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { capture } from '../../lib/analytics';
import { AestheticDialog } from '../ui/AestheticSheet';

const FEEDBACK_TYPE_OPTIONS = [
  { value: 'feedback', label: 'Feedback' },
  { value: 'bug', label: 'Bug' },
];

export const ShareFeedbackModal = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const posthog = usePostHog();

  const [feedbackType, setFeedbackType] = useState('feedback');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);

  const selectedTypeLabel =
    FEEDBACK_TYPE_OPTIONS.find((o) => o.value === feedbackType)?.label ?? 'Feedback';

  const canSubmit = body.trim().length > 0 && !loading;

  const resetForm = () => {
    setFeedbackType('feedback');
    setBody('');
    setMessage('');
    setShowTypePicker(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    if (!user?.id) {
      setMessage('❌ You must be signed in to submit feedback');
      return;
    }

    setMessage('');
    setLoading(true);

    try {
      const buildNumber =
        Constants.expoConfig?.ios?.buildNumber ??
        Constants.expoConfig?.android?.versionCode;

      const { error } = await supabase.from('user_feedback').insert({
        user_id: user.id,
        feedback_type: feedbackType,
        body: body.trim(),
        app_version: Constants.expoConfig?.version ?? null,
        platform: Platform.OS,
        build_number: buildNumber != null ? String(buildNumber) : null,
      });

      if (error) throw error;

      capture(posthog, 'feedback_submitted', { feedback_type: feedbackType });
      setMessage("✅ Thanks! We've received your feedback.");
      setTimeout(() => {
        setFeedbackType('feedback');
        setBody('');
        setMessage('');
        setShowTypePicker(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Share feedback error:', err);
      setMessage('❌ Error submitting feedback.');
    } finally {
      setLoading(false);
    }
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
        style={[
          styles.button,
          styles.sendButton,
          (!canSubmit || loading) && styles.sendButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!canSubmit}
      >
        {loading ? (
          <>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.sendButtonText}>Submitting...</Text>
          </>
        ) : (
          <Text style={styles.sendButtonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <AestheticDialog
      visible={visible}
      onClose={handleClose}
      icon="chatbubble-ellipses-outline"
      eyebrow="SUPPORT"
      title="Share Feedback"
      footer={footer}
    >
      <Text style={styles.description}>
        Tell us what you think or report a bug. We read every submission.
      </Text>

      <Text style={styles.label}>Type</Text>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowTypePicker((open) => !open)}
        disabled={loading}
      >
        <Text style={styles.pickerText} numberOfLines={1}>
          {selectedTypeLabel}
        </Text>
        <Ionicons
          name={showTypePicker ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.placeholderColor}
        />
      </TouchableOpacity>

      {showTypePicker ? (
        <View style={styles.pickerOptions}>
          {FEEDBACK_TYPE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.pickerOption,
                feedbackType === opt.value && styles.pickerOptionSelected,
              ]}
              onPress={() => {
                setFeedbackType(opt.value);
                setShowTypePicker(false);
              }}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  feedbackType === opt.value && styles.pickerOptionTextSelected,
                ]}
              >
                {opt.label}
              </Text>
              {feedbackType === opt.value && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <Text style={[styles.label, styles.bodyLabel]}>Message</Text>
      <TextInput
        style={styles.input}
        placeholder="What's on your mind?"
        placeholderTextColor={colors.textTertiary}
        value={body}
        onChangeText={(text) => {
          setBody(text);
          setMessage('');
        }}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        editable={!loading}
        returnKeyType="default"
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
    bodyLabel: {
      marginTop: 12,
    },
    pickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 44,
      backgroundColor: colors.inputBackground,
    },
    pickerText: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
    },
    pickerOptions: {
      marginTop: 4,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.cardBackground,
      padding: 4,
    },
    pickerOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 14,
      borderRadius: 10,
    },
    pickerOptionSelected: {
      backgroundColor: colors.primaryLight,
    },
    pickerOptionText: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
    },
    pickerOptionTextSelected: {
      fontWeight: '600',
      color: colors.primary,
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
      minHeight: 120,
      textAlignVertical: 'top',
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
