import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export function ProgressIndicator({ currentStep, totalSteps }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const steps = [
    { number: 1, label: 'Welcome' },
    { number: 2, label: 'Profile' },
    { number: 3, label: 'Preferences' },
  ];

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <View style={styles.stepColumn}>
            <View
              style={[
                styles.circle,
                currentStep > step.number && styles.circleDone,
                currentStep === step.number && styles.circleActive,
              ]}
            >
              {currentStep > step.number ? (
                <Ionicons name="checkmark" size={20} color="#FFF" />
              ) : (
                <Text
                  style={[
                    styles.circleText,
                    currentStep === step.number && styles.circleTextActive,
                  ]}
                >
                  {step.number}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.label,
                currentStep >= step.number ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {step.label}
            </Text>
          </View>
          {index < steps.length - 1 && (
            <View
              style={[
                styles.connector,
                currentStep > step.number && styles.connectorDone,
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    stepColumn: {
      alignItems: 'center',
    },
    circle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    circleActive: {
      backgroundColor: colors.primary,
    },
    circleDone: {
      backgroundColor: colors.success,
    },
    circleText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    circleTextActive: {
      color: '#FFF',
    },
    label: {
      marginTop: 8,
      fontSize: 12,
      fontWeight: '600',
    },
    labelActive: {
      color: colors.text,
    },
    labelInactive: {
      color: colors.textSecondary,
    },
    connector: {
      flex: 1,
      height: 4,
      backgroundColor: colors.border,
      marginHorizontal: 4,
      borderRadius: 2,
    },
    connectorDone: {
      backgroundColor: colors.success,
    },
  });
}
