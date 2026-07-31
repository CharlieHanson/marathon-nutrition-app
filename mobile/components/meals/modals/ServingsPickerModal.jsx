import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { AestheticDialog } from '../../ui/AestheticSheet';

export const ServingsPickerModal = ({ visible, onClose, onConfirm, mealName }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [selectedServings, setSelectedServings] = useState(1);

  const handleConfirm = () => {
    onConfirm(selectedServings);
  };

  const footer = (
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
  );

  return (
    <AestheticDialog
      visible={visible}
      onClose={onClose}
      icon="restaurant-outline"
      eyebrow="RECIPE"
      title="How many servings?"
      footer={footer}
    >
      {mealName ? (
        <Text style={styles.mealName} numberOfLines={2}>
          {mealName}
        </Text>
      ) : null}

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
    </AestheticDialog>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    mealName: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      textAlign: 'center',
    },
    servingsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
      gap: 8,
    },
    servingButton: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
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
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonCancel: {
      backgroundColor: colors.inputBackground,
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
