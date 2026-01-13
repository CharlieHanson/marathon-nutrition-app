// mobile/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext(undefined);

// Color palettes for light and dark modes
export const lightColors = {
  // Backgrounds
  background: '#F3F4F6',
  cardBackground: '#FFFFFF',
  inputBackground: '#F9FAFB',
  modalOverlay: 'rgba(0,0,0,0.45)',
  
  // Text
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',
  
  // Primary/Accent
  primary: '#F6921D',
  primaryLight: '#FFF7ED',
  primaryBorder: '#FED7AA',
  
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
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  
  // Info/Blue
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  
  // Grays
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Specific UI elements
  shadowColor: '#000',
  placeholderColor: '#9CA3AF',
};

export const darkColors = {
  // Backgrounds
  background: '#111827',
  cardBackground: '#1F2937',
  inputBackground: '#374151',
  modalOverlay: 'rgba(0,0,0,0.75)',
  
  // Text
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textInverse: '#111827',
  
  // Borders
  border: '#374151',
  borderLight: '#4B5563',
  borderDark: '#1F2937',
  
  // Primary/Accent (keep the same orange)
  primary: '#F6921D',
  primaryLight: '#422006',
  primaryBorder: '#92400E',
  
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
  warning: '#F59E0B',
  warningLight: '#451A03',
  
  // Info/Blue
  info: '#3B82F6',
  infoLight: '#1E3A8A',
  
  // Grays (inverted)
  gray50: '#111827',
  gray100: '#1F2937',
  gray200: '#374151',
  gray300: '#4B5563',
  gray400: '#6B7280',
  gray500: '#9CA3AF',
  gray600: '#D1D5DB',
  gray700: '#E5E7EB',
  gray800: '#F3F4F6',
  gray900: '#F9FAFB',
  
  // Specific UI elements
  shadowColor: '#000',
  placeholderColor: '#6B7280',
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
