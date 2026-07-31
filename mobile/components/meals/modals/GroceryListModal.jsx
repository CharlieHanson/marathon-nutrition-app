import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import {
  AestheticSheet,
  AestheticCard,
  AestheticSectionLabel,
} from '../../ui/AestheticSheet';

export const GroceryListModal = ({ visible, groceryList, onShare, onClose }) => {
  const { colors, isDarkMode } = useTheme();
  const styles = getStyles(colors, isDarkMode);
  const categories = groceryList || [];

  return (
    <AestheticSheet
      visible={visible}
      onClose={onClose}
      title="Grocery List"
      eyebrow="THIS WEEK"
      icon="cart-outline"
      onShare={onShare}
      shareDisabled={categories.length === 0}
    >
      {categories.length === 0 ? (
        <AestheticCard>
          <Text style={styles.emptyText}>No grocery items yet. Generate a list from your meal plan.</Text>
        </AestheticCard>
      ) : (
        categories.map((category, categoryIndex) => (
          <AestheticCard key={`category-${categoryIndex}`}>
            <AestheticSectionLabel>
              {(category.category || 'Uncategorized').toUpperCase()}
            </AestheticSectionLabel>
            {(category.items || []).map((item, itemIndex) => (
              <View
                key={`item-${categoryIndex}-${itemIndex}`}
                style={[
                  styles.itemRow,
                  itemIndex < (category.items || []).length - 1 && styles.itemDivider,
                ]}
              >
                <View style={styles.dot} />
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </AestheticCard>
        ))
      )}
    </AestheticSheet>
  );
};

const getStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    emptyText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      lineHeight: 20,
      textAlign: 'center',
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 9,
    },
    itemDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginTop: 5,
    },
    itemText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 22,
    },
  });
