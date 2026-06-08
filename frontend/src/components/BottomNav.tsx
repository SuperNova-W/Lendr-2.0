import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useResponsive } from '../lib/responsive';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const NAV: { iconActive: IoniconsName; iconInactive: IoniconsName; label: string; id: string }[] = [
  { iconActive: 'home',   iconInactive: 'home-outline',   label: 'Home',     id: 'home' },
  { iconActive: 'search', iconInactive: 'search-outline', label: 'Browse',   id: 'browse' },
  { iconActive: 'cube',   iconInactive: 'cube-outline',   label: 'Requests', id: 'requests' },
  { iconActive: 'person', iconInactive: 'person-outline', label: 'Profile',  id: 'profile' },
];

interface BottomNavProps {
  activeNav: string;
  setActiveNav: (id: string) => void;
  paddingBottom: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeNav, setActiveNav, paddingBottom }) => {
  const { isWebDesktop } = useResponsive();
  // On the desktop web the persistent top nav replaces the bottom tab bar.
  if (isWebDesktop) return null;

  return (
    <View style={[styles.nav, { paddingBottom: Math.max(paddingBottom, 20) }]}>
      <View style={styles.inner}>
        {NAV.map(n => {
          const isActive = activeNav === n.id;
          return (
            <Pressable
              key={n.id}
              style={styles.navItem}
              onPress={() => setActiveNav(n.id)}
            >
              <Ionicons
                name={isActive ? n.iconActive : n.iconInactive}
                size={24}
                color={isActive ? COLORS.amber : COLORS.text3}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {n.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  // Tabs cap + center on wide screens; full-width bar keeps the top border.
  inner: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 20,
    gap: 4,
  },
  navLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: COLORS.text3,
    letterSpacing: 0.2,
  },
  navLabelActive: { color: COLORS.amber },
});
