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
 * Meals-page loading shell: pill quick-actions, snack/dessert pills, timeline cards.
 * Matches real content inset + geometry so layout doesn't jump when data arrives.
 */
export function MealsSkeleton() {
  const { colors, isDarkMode } = useTheme();
  const styles = getStyles(colors, isDarkMode);

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.quickActions}>
          {[0, 1].map((i) => (
            <View key={i} style={styles.quickActionSlot}>
              <Skeleton height={42} radius={999} />
            </View>
          ))}
        </View>

        <View style={styles.togglesRow}>
          <Skeleton width={112} height={40} radius={999} />
          <Skeleton width={118} height={40} radius={999} />
        </View>
      </View>

      <View style={styles.timelineList}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.row}>
            <View style={styles.timelineCol}>
              <Skeleton width={26} height={26} radius={13} style={styles.node} />
              {i < 2 ? <View style={styles.timelineLine} /> : null}
            </View>

            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <View style={styles.titleBlock}>
                  <Skeleton width={88} height={20} radius={6} style={styles.mealType} />
                  <Skeleton width="72%" height={14} radius={5} />
                </View>
                <Skeleton width={48} height={12} radius={4} style={styles.calLabel} />
              </View>

              <View style={styles.cardBottomRow}>
                <View style={styles.macroRow}>
                  {[52, 48, 44].map((w, j) => (
                    <Skeleton key={j} width={w} height={26} radius={999} />
                  ))}
                </View>
                <Skeleton width={20} height={20} radius={6} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const getStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 8,
      backgroundColor: colors.background,
    },
    toolbar: {
      gap: 10,
      marginBottom: 16,
    },
    quickActions: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      width: '100%',
    },
    quickActionSlot: {
      flex: 1,
    },
    togglesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      alignSelf: 'flex-start',
    },
    timelineList: {
      marginTop: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginBottom: 14,
    },
    timelineCol: {
      width: 28,
      alignItems: 'center',
      marginRight: 12,
    },
    node: {
      marginTop: 18,
    },
    timelineLine: {
      flex: 1,
      width: 2,
      backgroundColor: isDarkMode ? colors.border : '#D9CFC0',
      marginTop: 4,
      marginBottom: -14,
      minHeight: 24,
    },
    card: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 88,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 6,
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
    },
    mealType: {
      marginBottom: 8,
    },
    calLabel: {
      marginTop: 4,
    },
    cardBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      gap: 8,
    },
    macroRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      flex: 1,
    },
  });
