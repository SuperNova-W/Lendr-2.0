import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIMARY = '#4F46E5';

export const SplashScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const t = setTimeout(() => navigation.replace('Onboarding'), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 32) }]}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <View style={styles.center}>
        <Text style={styles.logo}>Lendr.</Text>
        <Text style={styles.tagline}>Borrow anything, right from campus.</Text>
      </View>
      <Text style={styles.version}>Version 0.0.1</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    fontFamily: 'Inter_700Bold',
    fontSize: 44,
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  version: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 8,
  },
});
