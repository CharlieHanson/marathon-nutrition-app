// mobile/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext(undefined);

// Warm Alimenta palettes for light and dark modes
export const lightColors = {
  // Backgrounds
  background: '#F7F4EC',
  cardBackground: '#FFFFFF',
  inputBackground: '#F3EEE3',
  modalOverlay: 'rgba(0,0,0,0.45)',

  // Text
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#9A9A9A',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E8E2D6',
  borderLight: '#F0EBE1',
  borderDark: '#D4CBBA',

  // Primary / mint green brand
  primary: '#3D7C65',
  primaryLight: '#EBF4F0',
  primaryBorder: '#A8C9BA',
  brandMuted: '#3D7C65',

  // Success
  success: '#10B981',
  successLight: '#D1FAE5',
  successBorder: '#A7F3D0',
  successText: '#065F46',

  // Error/Danger
  error: '#DC2626',
  errorLight: '#FEE2E2',
  errorBorder: '#FECACA',
  errorText: '#991B1B',
  errorDark: '#7F1D1D',

  // Warning
  warning: '#E8A838',
  warningLight: '#FBF0D9',

  // Info/Blue
  info: '#6B8FA3',
  infoLight: '#E8F0F4',

  // Streak / focus surfaces
  streakBackground: '#3D7C65',
  focusBackground: '#E6DFD2',
  mealChipEmpty: '#F3EEE3',
  mealChipLogged: '#EBF4F0',
  onTrackBackground: '#EBF4F0',
  onTrackText: '#3D7C65',

  // Grays
  gray50: '#F9F7F2',
  gray100: '#F3EEE3',
  gray200: '#E8E2D6',
  gray300: '#D4CBBA',
  gray400: '#9A9A9A',
  gray500: '#6B6B6B',
  gray600: '#4A4A4A',
  gray700: '#333333',
  gray800: '#1F1F1F',
  gray900: '#1A1A1A',

  // Specific UI elements
  shadowColor: '#000',
  placeholderColor: '#9A9A9A',
};

export const darkColors = {
  // Backgrounds
  background: '#1A1A1A',
  cardBackground: '#2A2A2A',
  inputBackground: '#333333',
  modalOverlay: 'rgba(0,0,0,0.75)',

  // Text
  text: '#F5F2EB',
  textSecondary: '#B0ABA3',
  textTertiary: '#8A8580',
  textInverse: '#1A1A1A',

  // Borders
  border: '#3A3A3A',
  borderLight: '#444444',
  borderDark: '#555555',

  // Primary / mint green brand
  primary: '#3D7C65',
  primaryLight: '#1A3329',
  primaryBorder: '#2D5647',
  brandMuted: '#6BA890',

  // Success
  success: '#10B981',
  successLight: '#064E3B',
  successBorder: '#065F46',
  successText: '#D1FAE5',

  // Error/Danger
  error: '#DC2626',
  errorLight: '#450A0A',
  errorBorder: '#7F1D1D',
  errorText: '#FEE2E2',
  errorDark: '#450A0A',

  // Warning
  warning: '#E8A838',
  warningLight: '#3D2E0A',

  // Info/Blue
  info: '#7BA3B5',
  infoLight: '#1E2E36',

  // Streak / focus surfaces
  streakBackground: '#3D7C65',
  focusBackground: '#333333',
  mealChipEmpty: '#333333',
  mealChipLogged: '#1A3329',
  onTrackBackground: '#1A3329',
  onTrackText: '#A8C9BA',

  // Grays (inverted)
  gray50: '#1A1A1A',
  gray100: '#2A2A2A',
  gray200: '#333333',
  gray300: '#444444',
  gray400: '#6B6B6B',
  gray500: '#8A8580',
  gray600: '#B0ABA3',
  gray700: '#D4CFC6',
  gray800: '#E8E2D6',
  gray900: '#F5F2EB',

  // Specific UI elements
  shadowColor: '#000',
  placeholderColor: '#6B6B6B',
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
      }
    } catch (error) {
      console.warn('ThemeContext: Failed to load theme preference', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('themeMode', newMode ? 'dark' : 'light');
    } catch (error) {
      console.warn('ThemeContext: Failed to save theme preference', error);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  const value = {
    isDarkMode,
    toggleTheme,
    colors,
    isLoading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
