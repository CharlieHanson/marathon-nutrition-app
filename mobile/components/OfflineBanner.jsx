// mobile/components/OfflineBanner.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '../context/NetworkContext';

export function OfflineBanner() {
  const { isConnected } = useNetwork();
  const insets = useSafeAreaInsets();

  if (isConnected !== false) {
    return null;
  }

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.text}>You're offline</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
