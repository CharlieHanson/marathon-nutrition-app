import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const NAV_ITEMS = [
  { id: 'training', label: 'Training', icon: 'calendar-outline' },
  { id: 'profile', label: 'Profile', icon: 'person-outline' },
  { id: 'preferences', label: 'Preferences', icon: 'checkmark-circle-outline' },
  { id: 'meals', label: 'Meals', icon: 'restaurant-outline' },
];

export const Navigation = ({ currentView, onViewChange }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.nav}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.navContent}
      >
        {NAV_ITEMS.map(({ id, label, icon }) => {
          const isActive = currentView === id;
          return (
            <TouchableOpacity
              key={id}
              onPress={() => onViewChange(id)}
              style={[styles.navItem, isActive && styles.navItemActive]}
            >
              <Ionicons 
                name={icon} 
                size={18} 
                color={isActive ? colors.primary : colors.textSecondary} 
                style={styles.navIcon}
              />
              <Text style={[styles.navText, isActive && styles.navTextActive]} numberOfLines={1}>
                {label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  nav: {
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  navContent: {
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 4,
    minHeight: 44, // Better touch target
  },
  navItemActive: {
    borderBottomColor: colors.primary,
  },
  navIcon: {
    marginRight: 5,
  },
  navText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  navTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
  },
});

