import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export function WelcomeStep({ onNext }) {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.themeRow}>
        <View style={styles.themeLeft}>
          <Ionicons
            name={isDarkMode ? 'moon' : 'sunny'}
            size={18}
            color={colors.textSecondary}
          />
          <Text style={styles.themeLabel}>{isDarkMode ? 'Dark' : 'Light'} mode</Text>
        </View>
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme}
          trackColor={{ false: colors.gray300, true: colors.primary }}
          thumbColor={isDarkMode ? '#FFFFFF' : '#F3F4F6'}
          ios_backgroundColor={colors.gray300}
        />
      </View>

      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoOrange}>Al</Text>
          <Text style={styles.logoGray}>imenta</Text>
        </View>
        <Text style={styles.title}>Welcome to Alimenta!</Text>
        <Text style={styles.subtitle}>
          Let's personalize your nutrition experience in just 3 quick steps
        </Text>
      </View>

      <View style={styles.features}>
        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <Ionicons name="restaurant-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>AI-Powered Meal Plans</Text>
            <Text style={styles.featureDesc}>
              Get personalized weekly meal plans tailored to your training and preferences
            </Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <Ionicons name="calendar-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Training-Adaptive Nutrition</Text>
            <Text style={styles.featureDesc}>
              Meals that adapt to your workout intensity and training schedule
            </Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <Ionicons name="trending-up-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Track Your Progress</Text>
            <Text style={styles.featureDesc}>
              Rate meals and let our AI learn what you love
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={onNext} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 24,
      marginHorizontal: 16,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    themeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    themeLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    themeLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    header: {
      alignItems: 'center',
      marginBottom: 24,
    },
    logoRow: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    logoOrange: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.primary,
    },
    logoGray: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.textSecondary,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    features: {
      marginBottom: 24,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    featureIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    featureText: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    featureDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
}
