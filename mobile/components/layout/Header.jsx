import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { TourTarget } from '../tour/TourTarget';

export const Header = ({
  user,
  userName,
  isGuest,
  onSignOut,
  onDisableGuestMode,
  onViewChange,
  headerExtra,
  reserveExtra = false,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const hasExtra = Boolean(headerExtra);
  const showExtra = hasExtra || reserveExtra;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Profile icon - Top Left (routes to profile) */}
          <TourTarget id="header-avatar" style={styles.avatarTarget}>
            <TouchableOpacity
              onPress={() => onViewChange('profile')}
              style={styles.initialCircle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Profile"
              accessibilityRole="button"
            >
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </TourTarget>

          {/* Logo - Centered (non-interactive so it can't steal avatar taps) */}
          <View style={styles.logoContainer} pointerEvents="none">
            <Text style={styles.logoBrand}>Al</Text>
            <Text style={styles.logoRest}>imenta</Text>
          </View>

          {/* Right Section - Settings and Logout */}
          <View style={styles.rightSection}>
            {/* Settings Button - only show for logged-in users */}
            {!isGuest && (
              <TouchableOpacity
                onPress={() => onViewChange('settings')}
                style={styles.iconButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="settings-outline" size={22} color={colors.text} />
              </TouchableOpacity>
            )}
            
            {/* Logout Button */}
            <TouchableOpacity
              onPress={isGuest ? onDisableGuestMode : onSignOut}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isGuest ? (
                <Text style={styles.exitGuestText}>Exit</Text>
              ) : (
                <Ionicons name="log-out-outline" size={22} color={colors.text} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {showExtra ? (
          <View style={[styles.headerExtra, !hasExtra && styles.headerExtraReserve]}>
            {headerExtra}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.background,
    borderBottomWidth: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 48,
  },
  headerExtra: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    paddingTop: 0,
  },
  // Matches DaySelector pill card (padding 4+10 + ~52px row).
  headerExtraReserve: {
    minHeight: 72,
  },
  avatarTarget: {
    zIndex: 1,
  },
  initialCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  logoBrand: {
    fontFamily: 'Questrial_400Regular',
    fontSize: 32,
    color: colors.primary,
  },
  logoRest: {
    fontFamily: 'Questrial_400Regular',
    fontSize: 32,
    color: colors.text,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  iconButton: {
    padding: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  exitGuestText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

