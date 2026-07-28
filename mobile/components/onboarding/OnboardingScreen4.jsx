import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export function OnboardingScreen4({ onGetStarted, onLogin }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      {/* Subtle celebratory accents */}
      <View style={styles.sparkleWrap}>
        <View style={styles.sparkleLeft}>
          <Sparkles size={20} color={colors.primary} strokeWidth={2} />
        </View>
        <View style={styles.sparkleRight}>
          <Sparkles size={16} color={colors.primary} strokeWidth={2} />
        </View>
      </View>

      {/* Logo */}
      <View style={styles.logoRow}>
        <Text style={styles.logoOrange}>Al</Text>
        <Text style={styles.logoGray}>imenta</Text>
      </View>

      <Text style={styles.headline}>
        Ready to Fuel Your Training?
      </Text>
      <Text style={styles.subtext}>
        Join athletes optimizing their nutrition with AI.
      </Text>

      {onGetStarted ? (
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onGetStarted}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaButtonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        <View style={styles.ctaPlaceholder} />
      )}

      {onLogin ? (
        <TouchableOpacity
          style={styles.loginLinkWrap}
          onPress={onLogin}
          activeOpacity={0.7}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? <Text style={styles.loginLink}>Log in</Text>
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28,
    },
    sparkleWrap: {
      position: 'absolute',
      top: '18%',
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 32,
      pointerEvents: 'none',
    },
    sparkleLeft: {
      opacity: 0.6,
    },
    sparkleRight: {
      opacity: 0.5,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 28,
    },
    logoOrange: {
      fontSize: 40,
      fontWeight: '700',
      color: colors.primary,
    },
    logoGray: {
      fontSize: 40,
      fontWeight: '700',
      color: colors.text,
    },
    headline: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      lineHeight: 30,
      marginBottom: 12,
      paddingHorizontal: 8,
    },
    subtext: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
      paddingHorizontal: 8,
    },
    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      minWidth: 260,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    ctaButtonText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    ctaPlaceholder: {
      height: 56,
      marginBottom: 8,
    },
    loginLinkWrap: {
      alignItems: 'center',
      marginTop: 16,
    },
    loginLinkText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    loginLink: {
      color: colors.primary,
      fontWeight: '600',
    },
  });
}
