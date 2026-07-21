import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#F6921D';
const PRIMARY_LIGHT = 'rgba(246, 146, 29, 0.15)';
const TEXT = '#111827';
const TEXT_SECONDARY = '#4B5563';

export function WelcomeStep({ onNext }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoOrange}>Al</Text>
          <Text style={styles.logoGray}>imenta</Text>
        </View>
        <Text style={styles.title}>Welcome to Alimenta!</Text>
        <Text style={styles.subtitle}>
          Let's personalize your nutrition experience in just 3 quick steps
        </Text>
      </View>

      <View style={styles.features}>
        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <Ionicons name="restaurant-outline" size={24} color={PRIMARY} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>AI-Powered Meal Plans</Text>
            <Text style={styles.featureDesc}>
              Get personalized weekly meal plans tailored to your training and preferences
            </Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <Ionicons name="calendar-outline" size={24} color={PRIMARY} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Training-Adaptive Nutrition</Text>
            <Text style={styles.featureDesc}>
              Meals that adapt to your workout intensity and training schedule
            </Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <Ionicons name="trending-up-outline" size={24} color={PRIMARY} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Track Your Progress</Text>
            <Text style={styles.featureDesc}>
              Rate meals and let our AI learn what you love
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={onNext} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  logoOrange: {
    fontSize: 28,
    fontWeight: '800',
    color: PRIMARY,
  },
  logoGray: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT_SECONDARY,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  features: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PRIMARY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    lineHeight: 20,
  },
  button: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
