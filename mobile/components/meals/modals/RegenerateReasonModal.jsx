import React from 'react';
import { View, Text, Modal, Pressable, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

const getStyles = (colors) => StyleSheet.create({
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    padding: 16,
  },
  reasonModal: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  reasonModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reasonModalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    marginRight: 10,
  },
  reasonModalHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  reasonInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
    backgroundColor: colors.inputBackground,
  },
  reasonModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  reasonModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  reasonModalButtonCancel: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasonModalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  reasonModalButtonCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  reasonModalButtonConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reasonModalButtonDisabled: {
    opacity: 0.5,
  },
});

export const RegenerateReasonModal = ({ 
  visible, 
  reason, 
  onChangeReason, 
  onConfirm, 
  onClose 
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <Pressable style={styles.modalOverlayCenter} onPress={onClose}>
      <View style={styles.reasonModal}>
        <View style={styles.reasonModalHeader}>
          <Text style={styles.reasonModalTitle}>Why regenerate this meal?</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.reasonModalHint}>
          e.g., "don't like salmon", "too many carbs", "prefer vegetarian option"
        </Text>

        <TextInput
          style={styles.reasonInput}
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

        <View style={styles.reasonModalActions}>
          <TouchableOpacity
            style={[styles.reasonModalButton, styles.reasonModalButtonCancel]}
            onPress={onClose}
          >
            <Text style={styles.reasonModalButtonCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reasonModalButton, styles.reasonModalButtonConfirm]}
            onPress={onConfirm}
            disabled={!reason.trim()}
          >
            <Text style={[
              styles.reasonModalButtonConfirmText,
              !reason.trim() && styles.reasonModalButtonDisabled
            ]}>
              Regenerate
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  </Modal>
  );
};

