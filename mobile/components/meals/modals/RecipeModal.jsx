import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

const getStyles = (colors) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  overlayPressable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  recipeModal: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    overflow: 'hidden',
    zIndex: 1,
  },
  modalInner: {
    flex: 1,
    flexDirection: 'column',
    pointerEvents: 'auto',
  },
  recipeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recipeModalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  recipeModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeModalAction: {
    padding: 6,
    marginLeft: 10,
  },
  recipeContent: {
    flex: 1,
    minHeight: 0,
    flexShrink: 1,
  },
  recipeContentContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 20,
    flexGrow: 1,
  },
  recipeText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

export const RecipeModal = ({ visible, recipe, mealName, onClose, onShare, loading = false }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <Pressable onPress={onClose} style={styles.overlayPressable} />
      <View style={styles.recipeModal}>
        <View style={styles.modalInner}>
          {/* Header */}
          <View style={styles.recipeModalHeader}>
            <Text style={styles.recipeModalTitle}>
              {mealName || 'Recipe'}
            </Text>
            <View style={styles.recipeModalActions}>
              <TouchableOpacity 
                onPress={onShare} 
                style={styles.recipeModalAction}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                disabled={loading}
              >
                <Ionicons name="share-outline" size={22} color={loading ? colors.textTertiary : colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={onClose} 
                style={styles.recipeModalAction}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading recipe...</Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.recipeContent}
              contentContainerStyle={styles.recipeContentContainer}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              bounces={true}
              scrollEventThrottle={16}
            >
              <Text style={styles.recipeText}>{recipe}</Text>
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  </Modal>
  );
};

