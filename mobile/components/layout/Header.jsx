import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export const Header = ({ user, userName, isGuest, onSignOut, onDisableGuestMode, onViewChange }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  // Get user initial from name or email
  const getInitial = () => {
    if (userName) {
      return userName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'G'; // Guest
  };

  const initial = getInitial();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* User Initial Circle - Top Left */}
          <TouchableOpacity
            onPress={() => onViewChange('profile')}
            style={styles.initialCircle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.initialText}>{initial}</Text>
          </TouchableOpacity>

          {/* Logo - Centered */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoOrange}>Al</Text>
            <Text style={styles.logoGray}>imenta</Text>
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
                <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
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
                <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  safeArea: {
    backgroundColor: colors.cardBackground,
  },
  header: {
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  initialCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  initialText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textInverse,
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
  logoOrange: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primary,
  },
  logoGray: {
    fontSize: 26,
    fontWeight: 'bold',
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

