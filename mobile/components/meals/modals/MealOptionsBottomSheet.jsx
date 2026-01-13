import React from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { StarRating } from '../StarRating';

const getStyles = (colors) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
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
  bottomSheetDelete: {
    backgroundColor: colors.errorLight,
    borderColor: colors.errorBorder,
  },
  bottomSheetDeleteText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.error,
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

export const MealOptionsBottomSheet = ({ 
  visible, 
  mealName, 
  rating,
  onRate,
  onGetRecipe, 
  onRegenerate,
  onDelete,
  onClose,
  loadingRecipe
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Pressable style={styles.bottomSheet} onPress={() => {}}>
        <View style={styles.bottomSheetHandle} />
        <Text style={styles.bottomSheetTitle} numberOfLines={2}>
          {mealName || ''}
        </Text>

        <View style={styles.bottomSheetRating}>
          <Text style={styles.bottomSheetRatingLabel}>Rate this meal:</Text>
          <StarRating rating={rating || 0} onRate={onRate} />
        </View>

        <TouchableOpacity 
          style={styles.bottomSheetOption} 
          onPress={onGetRecipe} 
          disabled={loadingRecipe}
        >
          <Ionicons name="book-outline" size={22} color={colors.textSecondary} />
          <Text style={styles.bottomSheetOptionText}>Get Recipe</Text>
          {loadingRecipe ? (
            <ActivityIndicator size="small" color={colors.textSecondary} style={{ marginLeft: 10 }} />
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomSheetOption} onPress={onRegenerate}>
          <Ionicons name="refresh-outline" size={22} color={colors.textSecondary} />
          <Text style={styles.bottomSheetOptionText}>Regenerate</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bottomSheetOption, styles.bottomSheetDelete]} 
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={22} color={colors.error} />
          <Text style={styles.bottomSheetDeleteText}>Delete Meal</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bottomSheetOption, styles.bottomSheetCancel]} 
          onPress={onClose}
        >
          <Text style={styles.bottomSheetCancelText}>Cancel</Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  </Modal>
  );
};

