import React from 'react';
import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// Primary sections, mirrored from the mobile bottom tab bar.
const LINKS: { label: string; route: string; id: string }[] = [
  { label: 'Home',     route: 'Home',     id: 'home' },
  { label: 'Browse',   route: 'Search',   id: 'browse' },
  { label: 'Requests', route: 'Requests', id: 'requests' },
];

// Map the active route name to a primary section id for highlighting.
const ROUTE_TO_ID: Record<string, string> = {
  Home: 'home',
  Search: 'browse',
  Requests: 'requests',
  Profile: 'profile',
};

interface TopNavProps {
  /** Current route name, used to highlight the active section. */
  activeRoute?: string;
  onNavigate: (route: string) => void;
}

// Desktop-web only top navigation bar. Spans the full window width and replaces
// the mobile bottom tab bar so the app reads as a real web app rather than a
// phone screen. Rendered above the navigator (see App.tsx).
export const TopNav: React.FC<TopNavProps> = ({ activeRoute, onNavigate }) => {
  const { session } = useAuth();
  const activeId = activeRoute ? ROUTE_TO_ID[activeRoute] : undefined;

  const meta = (session?.user?.user_metadata ?? {}) as { full_name?: string; name?: string; avatar_url?: string };
  const name = meta.full_name ?? meta.name ?? session?.user?.email ?? '';
  const initial = name.charAt(0).toUpperCase() || '?';
  const avatarUrl = meta.avatar_url ?? null;

  const iconBtn = (icon: IoniconsName, route: string, key: string) => (
    <Pressable key={key} style={styles.iconBtn} onPress={() => onNavigate(route)}>
      <Ionicons name={icon} size={20} color={COLORS.text1} />
    </Pressable>
  );

  return (
    <View style={styles.bar}>
      <View style={styles.inner}>
        {/* Left: brand + primary links */}
        <View style={styles.left}>
          <Pressable style={styles.logoRow} onPress={() => onNavigate('Home')}>
            <Text style={styles.logo}>Lendr</Text>
            <Text style={styles.logoDot}>.</Text>
          </Pressable>

          <View style={styles.links}>
            {LINKS.map(l => {
              const active = activeId === l.id;
              return (
                <Pressable key={l.id} style={styles.link} onPress={() => onNavigate(l.route)}>
                  <Text style={[styles.linkText, active && styles.linkTextActive]}>{l.label}</Text>
                  {active && <View style={styles.activeBar} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Right: actions */}
        <View style={styles.right}>
          {iconBtn('chatbubble-ellipses-outline', 'Messages', 'messages')}
          {iconBtn('notifications-outline', 'Notifications', 'notifications')}
          <Pressable style={styles.avatarBtn} onPress={() => onNavigate('Profile')}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    // Keep the bar visually above scrolling content.
    zIndex: 20,
  },
  inner: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 36,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logo: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: COLORS.text1,
    letterSpacing: -0.5,
  },
  logoDot: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: COLORS.green,
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  link: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  linkText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: COLORS.text2,
  },
  linkTextActive: {
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.text1,
  },
  activeBar: {
    position: 'absolute',
    bottom: -1,
    height: 2,
    left: 14,
    right: 14,
    borderRadius: 2,
    backgroundColor: COLORS.text1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    marginLeft: 4,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.amberLight,
    borderWidth: 2,
    borderColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: COLORS.amberDark,
  },
});
