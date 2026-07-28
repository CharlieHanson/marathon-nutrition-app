import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Switch,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { OnboardingScreen1 } from '../../components/onboarding/OnboardingScreen1';
import { OnboardingScreen2 } from '../../components/onboarding/OnboardingScreen2';
import { OnboardingScreen3 } from '../../components/onboarding/OnboardingScreen3';
import { OnboardingScreen4 } from '../../components/onboarding/OnboardingScreen4';

const ONBOARDING_STORAGE_KEY = 'hasSeenOnboarding';

const SLIDES = [
  {
    id: '1',
    icon: 'restaurant-outline',
    title: 'Personalized meal plans',
    description: 'Get weekly meal plans tailored to your goals, preferences, and lifestyle.',
  },
  {
    id: '2',
    icon: 'fitness-outline',
    title: 'Training-adaptive nutrition',
    description: 'Meals that adapt to your workout intensity and recovery needs.',
  },
  {
    id: '3',
    icon: 'nutrition-outline',
    title: 'Track macros & progress',
    description: 'Log meals, hit your targets, and see your nutrition at a glance.',
  },
  {
    id: '4',
    icon: 'sparkles-outline',
    title: 'AI that learns you',
    description: 'Rate meals and let Alimenta learn what you love for better suggestions.',
  },
];

function Slide({ item, onGetStarted, onLogin, styles, colors }) {
  const { width } = useWindowDimensions();
  if (item.id === '1') {
    return (
      <View style={[styles.slide, { width }]}>
        <OnboardingScreen1 />
      </View>
    );
  }
  if (item.id === '2') {
    return (
      <View style={[styles.slide, { width }]}>
        <OnboardingScreen2 />
      </View>
    );
  }
  if (item.id === '3') {
    return (
      <View style={[styles.slide, { width }]}>
        <OnboardingScreen3 />
      </View>
    );
  }
  if (item.id === '4') {
    return (
      <View style={[styles.slide, { width }]}>
        <OnboardingScreen4 onGetStarted={onGetStarted} onLogin={onLogin} />
      </View>
    );
  }
  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon} size={56} color={colors.primary} />
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideDescription}>{item.description}</Text>
    </View>
  );
}

function DotIndicator({ total, current, styles }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

export default function OnboardingCarouselScreen() {
  const router = useRouter();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const styles = getStyles(colors);
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems?.length) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const markOnboardingSeen = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch (e) {
      // best effort
    }
  }, []);

  const goToSignup = useCallback(async () => {
    await markOnboardingSeen();
    router.replace('/(auth)/signup');
  }, [markOnboardingSeen, router]);

  const goToLogin = useCallback(async () => {
    await markOnboardingSeen();
    router.replace('/(auth)/login');
  }, [markOnboardingSeen, router]);

  const renderItem = useCallback(
    ({ item }) => (
      <Slide
        item={item}
        onGetStarted={goToSignup}
        onLogin={goToLogin}
        styles={styles}
        colors={colors}
      />
    ),
    [goToSignup, goToLogin, styles, colors]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.themeToggleRow}>
        <View style={styles.themeToggle}>
          <Ionicons
            name={isDarkMode ? 'moon' : 'sunny'}
            size={18}
            color={colors.textSecondary}
          />
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.gray300, true: colors.primary }}
            thumbColor={isDarkMode ? '#FFFFFF' : '#F3F4F6'}
            ios_backgroundColor={colors.gray300}
          />
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        bounces={false}
      />

      <View style={styles.footer}>
        <DotIndicator total={SLIDES.length} current={currentIndex} styles={styles} />

        {currentIndex < SLIDES.length - 1 ? (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={goToSignup}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLinkWrap}
              onPress={goToLogin}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLink}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    themeToggleRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 4,
    },
    themeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    slide: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    iconWrap: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(61, 124, 101, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    slideTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    slideDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 32,
      backgroundColor: colors.background,
      borderTopWidth: 0,
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
    },
    dotActive: {
      backgroundColor: colors.primary,
      width: 24,
    },
    dotInactive: {
      backgroundColor: colors.border,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    loginLinkWrap: {
      alignItems: 'center',
    },
    loginLinkText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    loginLink: {
      color: colors.primary,
      fontWeight: '600',
    },
  });
}
