import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { BottomNav } from '../components/BottomNav';

const MY_LISTINGS = [
  { id: 4, emoji: '📐', title: 'TI-84 Plus CE', price: '$3/day', tag: 'Tech', active: true },
  { id: 5, emoji: '👔', title: 'Suit Jacket (M)', price: '$8/day', tag: 'Formal', active: true },
  { id: 6, emoji: '📚', title: 'Organic Chem Textbook', price: '$4/day', tag: 'Textbooks', active: false },
];

const RECENT_BORROWS = [
  { id: 1, emoji: '🚲', title: 'Campus Bike', price: '$5/day', date: 'May 12–15' },
  { id: 2, emoji: '📷', title: 'Sony A7 III', price: '$22/day', date: 'Apr 28–29' },
];

const SETTINGS_ROWS = [
  { icon: '🔔', label: 'Notifications', detail: 'On' },
  { icon: '🔒', label: 'Privacy & Safety', detail: '' },
  { icon: '💬', label: 'Help & Support', detail: '' },
  { icon: '📄', label: 'Terms & Privacy', detail: '' },
];


export const ProfileScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScrollView
        style={styles.screen}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 110 }}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Text style={styles.headerLogo}>Lendr</Text>
            <Text style={styles.headerLogoDot}>.</Text>
          </View>
          <Pressable style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* ── Profile Hero ── */}
        <View style={styles.profileHero}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>K</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Kayla Chen</Text>
            <Text style={styles.profileSub}>UCLA · Junior</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>⭐ 4.9</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>✅ Verified</Text>
              </View>
            </View>
          </View>

          <Pressable style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
        </View>

        <Text style={styles.profileBio}>
          Lending stuff so we can all stop overpaying on campus. 🎓
        </Text>

        <View style={styles.divider} />

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Listed</Text>
          </View>
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Text style={[styles.statValue, styles.statValueAccent]}>$47</Text>
            <Text style={[styles.statLabel, styles.statLabelAccent]}>Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Borrowed</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── My Listings ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Listings</Text>
          <Pressable style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add Item</Text>
          </Pressable>
        </View>

        <View style={styles.listingsStack}>
          {MY_LISTINGS.map(item => (
            <View key={item.id} style={styles.myListingCard}>
              <View style={styles.myListingEmoji}>
                <Text style={styles.myListingEmojiText}>{item.emoji}</Text>
              </View>
              <View style={styles.myListingInfo}>
                <Text style={styles.myListingTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.myListingMeta}>{item.tag} · {item.price}</Text>
              </View>
              <View style={[styles.statusPill, item.active ? styles.statusActive : styles.statusInactive]}>
                <Text style={[styles.statusText, item.active ? styles.statusTextActive : styles.statusTextInactive]}>
                  {item.active ? 'Active' : 'Paused'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* ── Recent Borrows ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Borrows</Text>
          <Text style={styles.sectionLink}>See all</Text>
        </View>

        <View style={styles.listingsStack}>
          {RECENT_BORROWS.map(item => (
            <View key={item.id} style={styles.myListingCard}>
              <View style={styles.myListingEmoji}>
                <Text style={styles.myListingEmojiText}>{item.emoji}</Text>
              </View>
              <View style={styles.myListingInfo}>
                <Text style={styles.myListingTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.myListingMeta}>{item.date} · {item.price}</Text>
              </View>
              <Text style={styles.reviewLink}>Review</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* ── Settings ── */}
        <Text style={styles.settingsSectionTitle}>Account</Text>

        <View style={styles.settingsCard}>
          {SETTINGS_ROWS.map((row, i) => (
            <View key={row.label}>
              <Pressable style={styles.settingsRow} onPress={() => navigation.navigate('Settings')}>
                <Text style={styles.settingsRowIcon}>{row.icon}</Text>
                <Text style={styles.settingsRowLabel}>{row.label}</Text>
                <View style={styles.settingsRowRight}>
                  {row.detail ? <Text style={styles.settingsRowDetail}>{row.detail}</Text> : null}
                  <Text style={styles.settingsRowChevron}>›</Text>
                </View>
              </Pressable>
              {i < SETTINGS_ROWS.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        <Pressable style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>

      <BottomNav
        activeNav="profile"
        setActiveNav={(id) => {
          if (id === 'home') navigation.navigate('Home');
        }}
        paddingBottom={insets.bottom}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
  },
  logoRow: { flexDirection: 'row' },
  headerLogo: {
    fontFamily: 'Inter_700Bold',
    fontSize: 21,
    color: COLORS.text1,
    letterSpacing: -0.3,
  },
  headerLogoDot: {
    fontFamily: 'Inter_700Bold',
    fontSize: 21,
    color: COLORS.amber,
    letterSpacing: -0.3,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 17,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 24,
    marginBottom: 28,
  },

  // Profile Hero
  profileHero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 16,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.amberLight,
    borderWidth: 2,
    borderColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: COLORS.amberDark,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: COLORS.text1,
    letterSpacing: -0.3,
  },
  profileSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.text3,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: COLORS.text2,
  },
  editBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  editBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: COLORS.text2,
  },
  profileBio: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text2,
    lineHeight: 21,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 28,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statCardAccent: {
    backgroundColor: COLORS.amberLight,
    borderColor: COLORS.amber,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: COLORS.text1,
    letterSpacing: -0.3,
  },
  statValueAccent: {
    color: COLORS.amberDark,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: COLORS.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  statLabelAccent: {
    color: COLORS.amber,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: COLORS.text1,
  },
  sectionLink: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: COLORS.amberDark,
  },
  addBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: COLORS.amber,
  },
  addBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#fff',
  },

  // Listing rows
  listingsStack: {
    marginHorizontal: 24,
    marginBottom: 28,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  myListingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  myListingEmoji: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myListingEmojiText: {
    fontSize: 22,
  },
  myListingInfo: {
    flex: 1,
    gap: 3,
  },
  myListingTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.text1,
  },
  myListingMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.text3,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusActive: {
    backgroundColor: '#E4F4ED',
  },
  statusInactive: {
    backgroundColor: COLORS.surfaceSub,
  },
  statusText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  statusTextActive: {
    color: COLORS.green,
  },
  statusTextInactive: {
    color: COLORS.text3,
  },
  reviewLink: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: COLORS.amberDark,
  },

  // Account settings
  settingsSectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: COLORS.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  settingsCard: {
    marginHorizontal: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    gap: 14,
  },
  settingsRowIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  settingsRowLabel: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: COLORS.text1,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsRowDetail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.text3,
  },
  settingsRowChevron: {
    fontSize: 20,
    color: COLORS.text3,
    lineHeight: 22,
  },
  rowDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 54,
  },
  logoutBtn: {
    marginHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#FFD5D5',
    alignItems: 'center',
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#D9534F',
  },
});
