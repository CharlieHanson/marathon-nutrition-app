import React from 'react';
import { Text, StyleSheet, Linking } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const HOW_IT_WORKS_URL = 'https://alimentanutrition.com/how-it-works';

/**
 * Small methodology footnote with a tappable How it works link.
 */
export function NutritionCitation({ children, paddingHorizontal }) {
  const { colors, isDarkMode } = useTheme();
  const citationColor = colors.textSecondary;
  const linkColor = isDarkMode ? '#9A958C' : '#4A4A4A';

  return (
    <Text
      style={[
        styles.citation,
        { color: citationColor, paddingHorizontal: paddingHorizontal ?? 0 },
      ]}
    >
      {children}{' '}
      <Text
        style={[styles.link, { color: linkColor }]}
        onPress={() => Linking.openURL(HOW_IT_WORKS_URL)}
        accessibilityRole="link"
        accessibilityLabel="How it works"
      >
        How it works
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  citation: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
    fontWeight: '400',
  },
  link: {
    fontSize: 11,
    lineHeight: 16,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});
