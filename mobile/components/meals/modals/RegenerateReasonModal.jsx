import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { AestheticDialog } from '../../ui/AestheticSheet';

export const RegenerateReasonModal = ({
  visible,
  reason,
  onChangeReason,
  onConfirm,
  onClose,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const footer = (
    <View style={styles.actions}>
      <TouchableOpacity
        style={[styles.button, styles.buttonCancel]}
        onPress={onClose}
      >
        <Text style={styles.buttonCancelText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          styles.buttonConfirm,
          !reason.trim() && styles.buttonDisabled,
        ]}
        onPress={onConfirm}
        disabled={!reason.trim()}
      >
        <Text style={styles.buttonConfirmText}>Regenerate</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AestheticDialog
      visible={visible}
      onClose={onClose}
      icon="refresh-outline"
      eyebrow="REGENERATE"
      title="Why regenerate this meal?"
      footer={footer}
    >
      <Text style={styles.hint}>
        e.g., "don't like salmon", "too many carbs", "prefer vegetarian option"
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter reason..."
        placeholderTextColor={colors.textTertiary}
        value={reason}
        onChangeText={onChangeReason}
        multiline
        numberOfLines={3}
        autoFocus
        returnKeyType="done"
        blurOnSubmit={true}
      />
    </AestheticDialog>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    hint: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 12,
      fontStyle: 'italic',
    },
    input: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 12,
      fontSize: 15,
      color: colors.text,
      minHeight: 80,
      textAlignVertical: 'top',
      backgroundColor: colors.inputBackground,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonCancel: {
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonConfirm: {
      backgroundColor: colors.primary,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonCancelText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    buttonConfirmText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
