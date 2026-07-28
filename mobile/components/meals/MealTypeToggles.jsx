import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const NOTICE_TIMEOUT = 4000;

/**
 * Secondary controls row: Log Snack | dessert toggle (equal halves).
 * Snacks are no longer AI-generatable and have no toggle.
 *
 * Props:
 *   includeDessert   {boolean}
 *   onToggleDessert  {function}
 *   disabled         {boolean}  – true when generating, guest user, or past day
 *   dayMeals         {object}   – current day's meal plan object for notice detection
 *   onLogSnack       {function}
 *   showDessert      {boolean}  – hide dessert toggle on past days
 */
export const MealTypeToggles = ({
  includeDessert,
  onToggleDessert,
  disabled = false,
  dayMeals,
  onLogSnack,
  showDessert = true,
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
        <TouchableOpacity
          style={styles.logSnackBtn}
          onPress={onLogSnack}
          accessibilityLabel="Log snack"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Ionicons name="nutrition-outline" size={16} color={colors.primary} />
          <Text style={styles.logSnackText}>Log Snack</Text>
        </TouchableOpacity>

        {showDessert ? (
          <>
            <Text style={styles.separator} accessibilityElementsHidden>
              |
            </Text>
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
          </>
        ) : null}
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
    logSnackBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 4,
      paddingHorizontal: 6,
      minWidth: 0,
    },
    logSnackText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    separator: {
      fontSize: 16,
      fontWeight: '300',
      color: colors.border,
      marginHorizontal: 4,
      lineHeight: 22,
    },
    toggleRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 6,
      minWidth: 0,
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
