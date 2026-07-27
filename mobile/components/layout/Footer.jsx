import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { TourTarget } from '../tour/TourTarget';

const FOOTER_ITEMS = [
  { id: 'training', label: 'Training', icon: 'calendar-outline', tourId: 'footer-training' },
  { id: 'dashboard', label: 'Dashboard', icon: 'home-outline' },
  { id: 'meals', label: 'Meals', icon: 'restaurant-outline', tourId: 'footer-meals' },
];

const DASHBOARD_CIRCLE_SIZE = 68;

export const Footer = ({ currentView, onViewChange }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.footer}>
        {FOOTER_ITEMS.map(({ id, label, icon, tourId }) => {
          const isActive = currentView === id;
          const isDashboard = id === 'dashboard';

          const item = (
            <TouchableOpacity
              onPress={() => onViewChange(id)}
              style={[styles.footerItem, isDashboard && styles.footerItemDashboard]}
              activeOpacity={0.7}
              accessibilityLabel={label}
            >
              {isDashboard ? (
                <View style={styles.dashboardCircle}>
                  <Ionicons name={icon} size={36} color="#FFFFFF" />
                </View>
              ) : (
                <>
                  <Ionicons
                    name={icon}
                    size={24}
                    color={isActive ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.footerLabel,
                      isActive && styles.footerLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          );

          if (tourId) {
            return (
              <TourTarget key={id} id={tourId} style={styles.footerSlot}>
                {item}
              </TourTarget>
            );
          }

          return (
            <View key={id} style={styles.footerSlot}>
              {item}
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  safeArea: {
    backgroundColor: colors.cardBackground,
    overflow: 'visible',
    zIndex: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    paddingBottom: 4,
    paddingHorizontal: 12,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
    overflow: 'visible',
    zIndex: 10,
  },
  footerSlot: {
    flex: 1,
    overflow: 'visible',
  },
  footerItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 48,
    width: '100%',
  },
  footerItemDashboard: {
    overflow: 'visible',
  },
  dashboardCircle: {
    width: DASHBOARD_CIRCLE_SIZE,
    height: DASHBOARD_CIRCLE_SIZE,
    borderRadius: DASHBOARD_CIRCLE_SIZE / 2,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -24,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 6,
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 4,
  },
  footerLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
