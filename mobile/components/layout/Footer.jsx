import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const FOOTER_ITEMS = [
  { id: 'training', label: 'Training', icon: 'calendar-outline' },
  { id: 'dashboard', label: 'Dashboard', icon: 'home-outline' },
  { id: 'meals', label: 'Meals', icon: 'restaurant-outline' },
  { id: 'preferences', label: 'Preferences', icon: 'checkmark-circle-outline' },
];

export const Footer = ({ currentView, onViewChange }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.footer}>
        {FOOTER_ITEMS.map(({ id, label, icon }) => {
          const isActive = currentView === id;
          const isLarge = id === 'meals' || id === 'dashboard';
          
          return (
            <TouchableOpacity
              key={id}
              onPress={() => onViewChange(id)}
              style={[styles.footerItem, isLarge && styles.footerItemLarge]}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={icon} 
                size={isLarge ? 28 : 24} 
                color={isActive ? colors.primary : colors.textSecondary} 
              />
              <Text style={[
                styles.footerLabel, 
                isLarge && styles.footerLabelLarge,
                isActive && styles.footerLabelActive
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  safeArea: {
    backgroundColor: colors.cardBackground,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
  },
  footerItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 60,
  },
  footerItemLarge: {
    // Dashboard and Meals are bigger
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 4,
  },
  footerLabelLarge: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});

