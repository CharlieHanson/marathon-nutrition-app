import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const NOTICE_TIMEOUT = 4000;

/**
 * Renders two row-level switches for Snacks and Dessert toggles.
 * Matches the visual aesthetic of MealsHeader components.
 *
 * Props:
 *   includeSnacks    {boolean}
 *   includeDessert   {boolean}
 *   onToggleSnacks   {function}
 *   onToggleDessert  {function}
 *   disabled         {boolean}  – true when generating, guest user, or past day
 *   dayMeals         {object}   – current day's meal plan object for notice detection
 */
export const MealTypeToggles = ({
  includeSnacks,
  includeDessert,
  onToggleSnacks,
  onToggleDessert,
  disabled = false,
  dayMeals,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [notice, setNotice] = useState(null);
  const noticeTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const showNotice = () => {
    setNotice('Regenerate meals to update portions.');
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setNotice(null), NOTICE_TIMEOUT);
  };

  const handleToggleSnacks = (value) => {
    if (!value) {
      const meal = dayMeals?.snacks;
      if (meal && typeof meal === 'string' && meal.trim() && meal !== '__generating__') {
        showNotice();
      }
    }
    onToggleSnacks(value);
  };

  const handleToggleDessert = (value) => {
    if (!value) {
      const meal = dayMeals?.dessert;
      if (meal && typeof meal === 'string' && meal.trim() && meal !== '__generating__') {
        showNotice();
      }
    }
    onToggleDessert(value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.toggleRow}>
          <Text style={[styles.label, disabled && styles.labelDisabled]}>Snacks</Text>
          <Switch
            value={includeSnacks}
            onValueChange={handleToggleSnacks}
            disabled={disabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card || '#fff'}
            ios_backgroundColor={colors.border}
            accessibilityLabel="Toggle snacks"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <Text style={[styles.label, disabled && styles.labelDisabled]}>Dessert</Text>
          <Switch
            value={includeDessert}
            onValueChange={handleToggleDessert}
            disabled={disabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card || '#fff'}
            ios_backgroundColor={colors.border}
            accessibilityLabel="Toggle dessert"
          />
        </View>
      </View>

      {notice ? (
        <Text style={styles.notice}>{notice}</Text>
      ) : null}
    </View>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      paddingVertical: 4,
      marginBottom: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    toggleRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 6,
    },
    divider: {
      width: StyleSheet.hairlineWidth,
      height: 24,
      backgroundColor: colors.border,
      marginHorizontal: 4,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    labelDisabled: {
      color: colors.textTertiary,
    },
    notice: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 6,
    },
  });
