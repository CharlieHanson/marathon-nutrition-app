import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { HeaderSlotProvider, useHeaderSlot } from '../../context/HeaderSlotContext';
import { Header } from './Header';
import { Footer } from './Footer';

const LayoutInner = ({
  user,
  userName,
  isGuest,
  onSignOut,
  onDisableGuestMode,
  currentView,
  onViewChange,
  children,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const headerSlot = useHeaderSlot();

  return (
    <View style={styles.container}>
      <Header
        user={user}
        userName={userName}
        isGuest={isGuest}
        onSignOut={onSignOut}
        onDisableGuestMode={onDisableGuestMode}
        onViewChange={onViewChange}
        headerExtra={headerSlot}
        // Day-strip height only for meals/training — dashboard matches settings.
        reserveExtra={currentView === 'meals' || currentView === 'training'}
      />

      <View
        style={[
          styles.main,
          (currentView === 'training' || currentView === 'profile' || currentView === 'meals') &&
            styles.mainCompact,
        ]}
      >
        {children}
      </View>

      <Footer
        currentView={currentView}
        onViewChange={onViewChange}
      />
    </View>
  );
};

export const Layout = (props) => (
  <HeaderSlotProvider>
    <LayoutInner {...props} />
  </HeaderSlotProvider>
);

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // No horizontal padding here — Stack keeps inactive screens mounted, so
  // view-dependent pad (e.g. meals edge-to-edge vs other screens) would
  // resize every mounted screen when switching tabs and cause width flicker.
  // Each screen owns its own horizontal inset.
  main: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 16,
    overflow: 'visible',
  },
  mainCompact: {
    paddingTop: 12,
  },
});
