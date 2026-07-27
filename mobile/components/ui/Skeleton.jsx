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
 * Meals-page loading shell: quick-actions strip + meal-card shaped blocks.
 * Matches real card geometry so content doesn't jump when data arrives.
 */
export function MealsSkeleton() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.quickActions}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} width={72} height={36} radius={10} />
        ))}
      </View>

      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.card}>
          <View style={styles.cardHeader}>
            <Skeleton width={110} height={18} radius={6} />
            <Skeleton width={28} height={28} radius={14} />
          </View>
          <View style={styles.cardBody}>
            <Skeleton width="78%" height={17} radius={6} style={styles.line} />
            <View style={styles.macroRow}>
              <Skeleton width={64} height={28} radius={8} />
              <Skeleton width={64} height={28} radius={8} />
              <Skeleton width={64} height={28} radius={8} />
              <Skeleton width={64} height={28} radius={8} />
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
      marginHorizontal: -16,
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 14,
      paddingHorizontal: 2,
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
  });
