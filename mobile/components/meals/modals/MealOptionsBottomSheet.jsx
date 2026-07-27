import React from 'react';
import { View, Text, Pressable, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { StarRating } from '../StarRating';

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
    bottomSheetRating: {
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    bottomSheetRatingLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 8,
      fontWeight: '700',
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
 * In-tree meal options sheet (not a native Modal) so the product tour
 * spotlight can cut out and pass presses through to Regenerate.
 */
export const MealOptionsBottomSheet = ({
  visible,
  mealName,
  rating,
  onRate,
  onSaveMeal,
  onGetRecipe,
  onRegenerate,
  onClose,
  loadingRecipe,
  savingMeal,
  canRegenerate = true,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHandle} />
        <Text style={styles.bottomSheetTitle} numberOfLines={2}>
          {mealName || ''}
        </Text>

        <View style={styles.bottomSheetRating}>
          <Text style={styles.bottomSheetRatingLabel}>Rate this meal:</Text>
          <StarRating rating={rating || 0} onRate={onRate} />
        </View>

        {onSaveMeal ? (
          <TouchableOpacity
            style={styles.bottomSheetOption}
            onPress={onSaveMeal}
            disabled={savingMeal}
          >
            <Ionicons name="bookmark-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.bottomSheetOptionText}>Save meal</Text>
            {savingMeal ? (
              <ActivityIndicator
                size="small"
                color={colors.textSecondary}
                style={{ marginLeft: 10 }}
              />
            ) : null}
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.bottomSheetOption}
          onPress={onGetRecipe}
          disabled={loadingRecipe}
        >
          <Ionicons name="book-outline" size={22} color={colors.textSecondary} />
          <Text style={styles.bottomSheetOptionText}>Get Recipe</Text>
          {loadingRecipe ? (
            <ActivityIndicator
              size="small"
              color={colors.textSecondary}
              style={{ marginLeft: 10 }}
            />
          ) : null}
        </TouchableOpacity>

        {canRegenerate ? (
          <TouchableOpacity style={styles.bottomSheetOption} onPress={onRegenerate}>
            <Ionicons name="refresh-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.bottomSheetOptionText}>Regenerate</Text>
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
};
