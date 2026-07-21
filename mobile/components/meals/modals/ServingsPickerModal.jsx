import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

export const ServingsPickerModal = ({ visible, onClose, onConfirm, mealName }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [selectedServings, setSelectedServings] = useState(1);

  const handleConfirm = () => {
    onConfirm(selectedServings);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>How many servings?</Text>
          {mealName && (
            <Text style={styles.mealName} numberOfLines={2}>
              {mealName}
            </Text>
          )}

          <View style={styles.servingsContainer}>
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.servingButton,
                  selectedServings === num && styles.servingButtonSelected,
                ]}
                onPress={() => setSelectedServings(num)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.servingButtonText,
                    selectedServings === num && styles.servingButtonTextSelected,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonCancel]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonConfirm]}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonConfirmText}>Generate Recipe</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    mealName: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 20,
      textAlign: 'center',
    },
    servingsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
      gap: 8,
    },
    servingButton: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    servingButtonSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    servingButtonText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    servingButtonTextSelected: {
      color: colors.textInverse,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    buttonCancel: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonCancelText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    buttonConfirm: {
      backgroundColor: colors.primary,
    },
    buttonConfirmText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textInverse,
    },
  });
