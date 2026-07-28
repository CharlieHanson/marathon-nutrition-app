import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

/**
 * Pulsing block for loading placeholders. Opacity-only, UI thread.
 */
export function Skeleton({ width = '100%', height = 16, radius = 8, style }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/**
 * Meals-page loading shell: 2 quick-action buttons, log-snack | dessert row, meal cards.
 * Matches real content inset + geometry so layout doesn't jump when data arrives.
 */
export function MealsSkeleton() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.quickActions}>
        {[0, 1].map((i) => (
          <View key={i} style={styles.quickActionSlot}>
            <Skeleton height={42} radius={11} />
          </View>
        ))}
      </View>

      <View style={styles.secondaryRow}>
        <View style={styles.half}>
          <Skeleton width={88} height={14} radius={4} />
        </View>
        <Skeleton width={8} height={14} radius={2} style={styles.separator} />
        <View style={[styles.half, styles.dessertToggle]}>
          <Skeleton width={56} height={14} radius={4} />
          <Skeleton width={51} height={31} radius={16} />
        </View>
      </View>

      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.card}>
          <View style={styles.cardHeader}>
            <Skeleton width={90} height={17} radius={6} />
            <Skeleton width={28} height={28} radius={14} />
          </View>
          <View style={styles.cardBody}>
            <Skeleton width="78%" height={17} radius={6} style={styles.line} />
            <View style={styles.macroRow}>
              {[0, 1, 2, 3].map((j) => (
                <View key={j} style={styles.macroChipSlot}>
                  <Skeleton height={28} radius={8} />
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 8,
      backgroundColor: colors.background,
    },
    quickActions: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    quickActionSlot: {
      flex: 1,
    },
    secondaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      marginBottom: 10,
    },
    half: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 0,
    },
    dessertToggle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 6,
    },
    separator: {
      marginHorizontal: 4,
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    cardBody: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 16,
    },
    line: {
      marginBottom: 12,
    },
    macroRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    macroChipSlot: {
      flex: 1,
    },
  });
