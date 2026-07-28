import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../context/ThemeContext';
import { macroColors } from '../../../shared/lib/macroColors';

// Macro chip colors (match MealCard)
const CAL_COLOR = macroColors.calories;
const PROTEIN_BG = macroColors.protein;
const CARBS_BG = macroColors.carbs;
const FAT_BG = macroColors.fat;

const MOCK_MEAL = {
  name: 'Grilled chicken with roasted potatoes and vegetables',
  calories: 650,
  protein: 42,
  carbs: 58,
  fat: 22,
};

const MOCK_MEAL_IMAGE =
  'https://images.unsplash.com/photo-1663861623497-2151b2bb21fe';

function MockMealCard() {
  const { colors } = useTheme();
  const cardStyles = getCardStyles(colors);
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(screenWidth - 48, 400);
  const imageHeight = 120;

  return (
    <View style={cardStyles.card}>
      <Image
        source={{ uri: MOCK_MEAL_IMAGE }}
        style={[cardStyles.image, { width: cardWidth, height: imageHeight }]}
        contentFit="cover"
        contentPosition="right"
        placeholder={colors.gray100}
      />
      <View style={cardStyles.cardBody}>
        <Text style={cardStyles.mealTypeLabel}>Dinner</Text>
        <Text style={cardStyles.mealName}>{MOCK_MEAL.name}</Text>
        <View style={cardStyles.macroRow}>
          <View style={[cardStyles.macroChip, cardStyles.macroCalories]}>
            <Text style={cardStyles.macroValue}>{MOCK_MEAL.calories}</Text>
            <Text style={cardStyles.macroLabel}>Cal</Text>
          </View>
          <View style={[cardStyles.macroChip, cardStyles.macroProtein]}>
            <Text style={cardStyles.macroValue}>{MOCK_MEAL.protein}g</Text>
            <Text style={cardStyles.macroLabel}>P</Text>
          </View>
          <View style={[cardStyles.macroChip, cardStyles.macroCarbs]}>
            <Text style={cardStyles.macroValue}>{MOCK_MEAL.carbs}g</Text>
            <Text style={cardStyles.macroLabel}>C</Text>
          </View>
          <View style={[cardStyles.macroChip, cardStyles.macroFat]}>
            <Text style={cardStyles.macroValue}>{MOCK_MEAL.fat}g</Text>
            <Text style={cardStyles.macroLabel}>F</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function getCardStyles(colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
      width: '100%',
      maxWidth: 300,
    },
    image: {
      height: 120,
      width: '100%',
      backgroundColor: colors.gray100,
    },
    cardBody: {
      padding: 16,
    },
    mealTypeLabel: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    mealName: {
      fontSize: 17,
      fontWeight: 'normal',
      color: colors.text,
      marginBottom: 12,
    },
    macroRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    macroChip: {
      flex: 1,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      alignItems: 'center',
    },
    macroValue: {
      fontSize: 14,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    macroLabel: {
      fontSize: 10,
      color: '#FFFFFF',
      marginTop: 2,
      fontWeight: '700',
    },
    macroCalories: {
      backgroundColor: CAL_COLOR,
      borderColor: CAL_COLOR,
    },
    macroProtein: {
      backgroundColor: PROTEIN_BG,
      borderColor: PROTEIN_BG,
    },
    macroCarbs: {
      backgroundColor: CARBS_BG,
      borderColor: CARBS_BG,
    },
    macroFat: {
      backgroundColor: FAT_BG,
      borderColor: FAT_BG,
    },
  });
}

export function OnboardingScreen2() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.headline}>
        Meal Plans Tailored to Your Training
      </Text>
      <Text style={styles.subtext}>
        AI-generated recipes matched to your goals and preferences.
      </Text>
      <View style={styles.cardWrap}>
        <MockMealCard />
      </View>
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    headline: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      lineHeight: 28,
      marginBottom: 12,
      paddingHorizontal: 8,
    },
    subtext: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 28,
      paddingHorizontal: 8,
    },
    cardWrap: {
      width: '100%',
      alignItems: 'center',
    },
  });
}
