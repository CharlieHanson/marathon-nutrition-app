import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, Calendar, ThumbsUp } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const BULLETS = [
  { Icon: Sparkles, label: 'AI-Personalized Plans' },
  { Icon: Calendar, label: 'Adapts to Training' },
  { Icon: ThumbsUp, label: 'Learns From You' },
];

const PEEK_SCALE = 0.9;

function DashboardPeek() {
  const { colors } = useTheme();
  const peekStyles = getPeekStyles(colors);

  return (
    <View style={peekStyles.wrapper}>
      <View style={[peekStyles.mockup, { transform: [{ scale: PEEK_SCALE }] }]}>
        {/* Today's Nutrition card */}
        <View style={peekStyles.tile}>
          <View style={[peekStyles.tileHeader, peekStyles.nutritionHeader]}>
            <Ionicons name="restaurant" size={18} color="#FFFFFF" />
            <Text style={peekStyles.tileTitle}>Today's Nutrition</Text>
          </View>
          <View style={peekStyles.tileContent}>
            <View style={peekStyles.nutritionRow}>
              <View>
                <Text style={peekStyles.caloriesValue}>2,100</Text>
                <Text style={peekStyles.caloriesLabel}>Calories</Text>
              </View>
              <View style={peekStyles.macrosRow}>
                <View style={peekStyles.macroStat}>
                  <Text style={peekStyles.macroValue}>145g</Text>
                  <Text style={peekStyles.macroLabel}>P</Text>
                </View>
                <View style={peekStyles.macroStat}>
                  <Text style={peekStyles.macroValue}>198g</Text>
                  <Text style={peekStyles.macroLabel}>C</Text>
                </View>
                <View style={peekStyles.macroStat}>
                  <Text style={peekStyles.macroValue}>72g</Text>
                  <Text style={peekStyles.macroLabel}>F</Text>
                </View>
              </View>
            </View>
            <View style={peekStyles.progressBar}>
              <View style={[peekStyles.progressFill, { width: '60%' }]} />
            </View>
          </View>
        </View>

        {/* Today's Training card */}
        <View style={peekStyles.tile}>
          <View style={[peekStyles.tileHeader, peekStyles.trainingHeader]}>
            <Ionicons name="fitness" size={18} color="#FFFFFF" />
            <Text style={peekStyles.tileTitle}>Today's Training</Text>
          </View>
          <View style={peekStyles.tileContent}>
            <Text style={peekStyles.workoutType}>Easy run</Text>
            <Text style={peekStyles.workoutDetail}>5 km</Text>
            <View style={peekStyles.intensityBadge}>
              <Text style={peekStyles.intensityText}>Low</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={peekStyles.fadeOverlay} pointerEvents="none" />
    </View>
  );
}

function getPeekStyles(colors) {
  return StyleSheet.create({
    wrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 300,
      alignItems: 'center',
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    mockup: {
      width: 340,
      opacity: 0.85,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
      marginBottom: 2,
    },
    tile: {
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      marginBottom: 10,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    tileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      gap: 8,
    },
    nutritionHeader: {
      backgroundColor: colors.primary,
    },
    trainingHeader: {
      backgroundColor: '#3B82F6',
    },
    tileTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    tileContent: {
      padding: 14,
    },
    nutritionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    caloriesValue: {
      fontSize: 26,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 2,
    },
    caloriesLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    macrosRow: {
      flexDirection: 'row',
      gap: 10,
    },
    macroStat: {
      alignItems: 'center',
    },
    macroValue: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.text,
    },
    macroLabel: {
      fontSize: 9,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    progressBar: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      marginTop: 10,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#22c55e',
      borderRadius: 3,
    },
    workoutType: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    workoutDetail: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 6,
    },
    intensityBadge: {
      alignSelf: 'flex-start',
      backgroundColor: '#DBEAFE',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 5,
    },
    intensityText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#3B82F6',
    },
    fadeOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 40,
      backgroundColor: colors.primaryLight,
    },
  });
}

export function OnboardingScreen1() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Text style={styles.logoOrange}>Al</Text>
        <Text style={styles.logoGray}>imenta</Text>
      </View>

      <Text style={styles.headline}>
        Fuel Your Training with AI-Powered Nutrition
      </Text>

      <View style={styles.bullets}>
        {BULLETS.map(({ Icon, label }) => (
          <View key={label} style={styles.bullet}>
            <View style={styles.bulletIconWrap}>
              <Icon size={28} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.bulletLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <DashboardPeek />
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 72,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    logoOrange: {
      fontSize: 36,
      fontWeight: '700',
      color: colors.primary,
    },
    logoGray: {
      fontSize: 36,
      fontWeight: '700',
      color: colors.text,
    },
    headline: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      lineHeight: 28,
      marginBottom: 28,
      paddingHorizontal: 8,
    },
    bullets: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      width: '100%',
      maxWidth: 320,
      marginBottom: 24,
    },
    bullet: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: 6,
    },
    bulletIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(61, 124, 101, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    bulletLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}
