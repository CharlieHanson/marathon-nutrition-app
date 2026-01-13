import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Header } from './Header';
import { Footer } from './Footer';

export const Layout = ({ 
  user, 
  userName,
  isGuest, 
  onSignOut, 
  onDisableGuestMode,
  currentView,
  onViewChange,
  children 
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Header 
        user={user}
        userName={userName}
        isGuest={isGuest}
        onSignOut={onSignOut}
        onDisableGuestMode={onDisableGuestMode}
        onViewChange={onViewChange}
      />

      <View style={styles.main}>
        {children}
      </View>

      <Footer 
        currentView={currentView}
        onViewChange={onViewChange}
      />
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  main: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});

