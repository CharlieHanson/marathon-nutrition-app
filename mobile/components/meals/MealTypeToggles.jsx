import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const NOTICE_TIMEOUT = 4000;

/**
 * Snack pill + dessert toggle (dashboard aesthetic).
 * Snacks are manual-log only and have no AI toggle.
 */
export const MealTypeToggles = ({
  includeDessert,
  onToggleDessert,
  disabled = false,
  dayMeals,
  onLogSnack,
  showDessert = true,
}) => {
  const { colors, isDarkMode } = useTheme();
  const styles = getStyles(colors, isDarkMode);
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
      <TouchableOpacity
        style={styles.pill}
        onPress={onLogSnack}
        accessibilityLabel="Log snack"
        accessibilityRole="button"
        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      >
        <Ionicons name="nutrition-outline" size={16} color={colors.text} />
        <Text style={styles.pillText}>Log Snack</Text>
      </TouchableOpacity>

      {showDessert ? (
        <View style={styles.dessertPill}>
          <Text style={[styles.dessertLabel, disabled && styles.labelDisabled]}>Dessert</Text>
          <Switch
            value={includeDessert}
            onValueChange={handleToggleDessert}
            disabled={disabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colors.border}
            accessibilityLabel="Toggle dessert"
          />
        </View>
      ) : null}

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
    </View>
  );
};

const getStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      alignSelf: 'flex-start',
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.cardBackground,
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDarkMode ? 0 : 0.04,
      shadowRadius: 3,
      elevation: isDarkMode ? 0 : 1,
    },
    pillText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    dessertPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.cardBackground,
      borderRadius: 999,
      paddingVertical: 6,
      paddingLeft: 14,
      paddingRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDarkMode ? 0 : 0.04,
      shadowRadius: 3,
      elevation: isDarkMode ? 0 : 1,
    },
    dessertLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    labelDisabled: {
      color: colors.textTertiary,
    },
    notice: {
      width: '100%',
      fontSize: 11,
      fontWeight: '500',
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 2,
    },
  });
