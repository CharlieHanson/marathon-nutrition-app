import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
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
  groceryModal: {
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
  groceryModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  groceryModalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  groceryModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groceryModalAction: {
    padding: 6,
    marginLeft: 10,
  },
  groceryContent: {
    flex: 1,
    minHeight: 0,
    flexShrink: 1,
  },
  groceryContentContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 20,
    flexGrow: 1,
  },
  groceryCategory: {
    marginBottom: 16,
  },
  groceryCategoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  groceryItem: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  groceryItemText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

export const GroceryListModal = ({ visible, groceryList, onShare, onClose }) => {
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
      <View style={styles.groceryModal}>
        <View style={styles.modalInner}>
          {/* Header */}
          <View style={styles.groceryModalHeader}>
            <Text style={styles.groceryModalTitle}>Grocery List</Text>
            <View style={styles.groceryModalActions}>
              <TouchableOpacity 
                onPress={onShare} 
                style={styles.groceryModalAction} 
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="share-outline" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={onClose} 
                style={styles.groceryModalAction} 
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.groceryContent}
            contentContainerStyle={styles.groceryContentContainer}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            bounces={true}
            scrollEventThrottle={16}
          >
            {(groceryList || []).map((category, categoryIndex) => (
              <View key={`category-${categoryIndex}`} style={styles.groceryCategory}>
                <Text style={styles.groceryCategoryTitle}>{category.category || 'Uncategorized'}</Text>
                {(category.items || []).map((item, itemIndex) => (
                  <View key={`item-${categoryIndex}-${itemIndex}`} style={styles.groceryItem}>
                    <Text style={styles.groceryItemText}>• {item}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  </Modal>
  );
};

