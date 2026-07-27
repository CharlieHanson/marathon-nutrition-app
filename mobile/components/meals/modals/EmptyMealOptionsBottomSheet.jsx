import React from 'react';
import { View, Text, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { TourTarget } from '../../tour/TourTarget';

const getStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.modalOverlay,
      justifyContent: 'flex-end',
      zIndex: 200,
      elevation: 200,
    },
    bottomSheet: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 34,
      maxHeight: '80%',
    },
    bottomSheetHandle: {
      width: 42,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 14,
    },
    bottomSheetTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    bottomSheetOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },
    bottomSheetOptionText: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginLeft: 12,
    },
    bottomSheetCancel: {
      backgroundColor: colors.cardBackground,
    },
    bottomSheetCancelText: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textSecondary,
      textAlign: 'center',
      width: '100%',
    },
  });

/**
 * In-tree empty-slot options sheet (not a native Modal) so the product tour
 * spotlight can cut out and pass presses through to Generate with AI.
 */
export function EmptyMealOptionsBottomSheet({
  visible,
  mealTypeLabel,
  onGenerate,
  onLogMeal,
  onMealPrep,
  onClose,
  canGenerate = true,
  showMealPrep = false,
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHandle} />
        <Text style={styles.bottomSheetTitle} numberOfLines={2}>
          {mealTypeLabel ? `Add ${mealTypeLabel}` : 'Add meal'}
        </Text>

        {canGenerate ? (
          <TourTarget id="meals-generate-action">
            <TouchableOpacity style={styles.bottomSheetOption} onPress={onGenerate}>
              <Ionicons name="color-wand-outline" size={22} color={colors.primary} />
              <Text style={styles.bottomSheetOptionText}>Generate with AI</Text>
            </TouchableOpacity>
          </TourTarget>
        ) : null}

        <TouchableOpacity style={styles.bottomSheetOption} onPress={onLogMeal}>
          <Ionicons name="create-outline" size={22} color={colors.textSecondary} />
          <Text style={styles.bottomSheetOptionText}>Log Meal</Text>
        </TouchableOpacity>

        {showMealPrep ? (
          <TouchableOpacity style={styles.bottomSheetOption} onPress={onMealPrep}>
            <Ionicons name="restaurant-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.bottomSheetOptionText}>Meal Prep</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.bottomSheetOption, styles.bottomSheetCancel]}
          onPress={onClose}
        >
          <Text style={styles.bottomSheetCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
