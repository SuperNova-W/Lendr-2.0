import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { COLORS } from '../theme/colors';

const NAV = [
  { icon: '🏠', label: 'Home', id: 'home' },
  { icon: '🔍', label: 'Browse', id: 'browse' },
  { icon: '📦', label: 'Requests', id: 'requests' },
  { icon: '👤', label: 'Profile', id: 'profile' },
];

interface BottomNavProps {
  activeNav: string;
  setActiveNav: (id: string) => void;
  paddingBottom: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeNav, setActiveNav, paddingBottom }) => {
  return (
    <View style={[styles.nav, { paddingBottom: Math.max(paddingBottom, 20) }]}>
      {NAV.map(n => {
        const isActive = activeNav === n.id;
        return (
          <Pressable
            key={n.id}
            style={styles.navItem}
            onPress={() => setActiveNav(n.id)}
          >
            <Text style={styles.navIcon}>{n.icon}</Text>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {n.label}
            </Text>
            {isActive && <View style={styles.navDot} />}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 20,
    gap: 4,
  },
  navIcon: { fontSize: 20 },
  navLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: COLORS.text3,
    letterSpacing: 0.2,
  },
  navLabelActive: { color: COLORS.amberDark },
  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.amber,
    position: 'absolute',
    bottom: -6,
  },
});
