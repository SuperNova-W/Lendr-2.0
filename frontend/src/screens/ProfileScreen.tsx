import React, { useCallback, useEffect, useState } from 'react';
import { showAlert } from "../lib/alert";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  StatusBar,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import {
  getMe,
  updateMe,
  getItems,
  getMyRequests,
  getMyStats,
  User,
  Item,
  MyRequest,
} from '../lib/api';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const SETTINGS_ROWS: { icon: IoniconsName; label: string; detail?: string }[] = [
  { icon: 'notifications-outline', label: 'Notifications', detail: 'On' },
  { icon: 'shield-outline',        label: 'Privacy & Safety' },
  { icon: 'chatbubbles-outline',   label: 'Help & Support' },
  { icon: 'document-text-outline', label: 'Terms & Privacy' },
];

const fmtDateRange = (start: string, end: string) => {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${new Date(start).toLocaleDateString(undefined, opts)} – ${new Date(end).toLocaleDateString(undefined, opts)}`;
};

export const ProfileScreen: React.FC<any> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const token = session?.access_token;

  const [me, setMe] = useState<User | null>(null);
  const [listings, setListings] = useState<Item[]>([]);
  const [borrows, setBorrows] = useState<MyRequest[]>([]);
  const [earned, setEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit profile modal
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCampus, setEditCampus] = useState('');
  const [editGradYear, setEditGradYear] = useState<number | null>(null);
  const [editMajor, setEditMajor] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);

  const currentYear = new Date().getFullYear();
  const gradYears = Array.from({ length: 7 }, (_, i) => currentYear + i);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      // Commit identity as soon as it's known. Doing this *before* the secondary
      // fetches means a failure in any of them can't collapse the header back to
      // placeholders ("there" / "Add your campus").
      const meRes = await getMe(token);
      setMe(meRes);

      // Listings / borrows / earnings are non-critical — load them tolerantly so
      // one failing round-trip degrades a single section instead of blanking the
      // whole profile.
      const [items, mine, computed] = await Promise.all([
        getItems({ owner: meRes.id }).catch(() => [] as Item[]),
        getMyRequests(token).catch(() => [] as MyRequest[]),
        getMyStats(token, meRes.id).catch(() => null),
      ]);
      setListings(items);
      setBorrows(mine);
      if (computed) setEarned(computed.earned);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  function openEdit() {
    setEditName(me?.name ?? '');
    setEditCampus(me?.campus ?? '');
    setEditGradYear(me?.grad_year ?? null);
    setEditMajor(me?.major ?? '');
    setEditBio(me?.bio ?? '');
    setEditOpen(true);
  }

  // Settings → "Edit Profile" navigates here with editOnFocus; open once loaded.
  useEffect(() => {
    if (route?.params?.editOnFocus && me) {
      openEdit();
      navigation.setParams({ editOnFocus: false });
    }
  }, [route?.params?.editOnFocus, me]);

  async function saveProfile() {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await updateMe(token, {
        name: editName.trim(),
        campus: editCampus.trim(),
        grad_year: editGradYear ?? undefined,
        major: editMajor.trim(),
        bio: editBio.trim(),
      });
      setMe(updated);
      setEditOpen(false);
    } catch (err: any) {
      showAlert('Could not save', err.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  function confirmLogout() {
    showAlert('Log out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  // Fall back to the Supabase session's Google profile (same source HomeScreen
  // uses) when the backend record hasn't loaded yet — otherwise a logged-in user
  // briefly/erroneously shows the generic "there" placeholder as their name.
  const meta = (session?.user?.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
  const sessionName = meta.full_name ?? meta.name ?? session?.user?.email ?? null;
  const name = me?.name || sessionName || 'there';
  const initial = name.charAt(0).toUpperCase();
  const avatarUrl = me?.avatar_url ?? meta.avatar_url ?? null;
  const rating = Number(me?.rating_avg ?? 0);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.amber} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScrollView
        style={styles.screen}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 110, width: '100%', maxWidth: 640, alignSelf: 'center' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.amber} />}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Text style={styles.headerLogo}>Lendr</Text>
            <Text style={styles.headerLogoDot}>.</Text>
          </View>
          <Pressable style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={18} color={COLORS.text1} />
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* ── Profile Hero ── */}
        <View style={styles.profileHero}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarLarge} />
          ) : (
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{initial}</Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileSub}>{me?.campus || 'Add your campus'}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="star" size={11} color="#F5B324" />
                <Text style={styles.badgeText}>
                  {rating > 0 ? rating.toFixed(1) : 'New'}
                </Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="checkmark" size={11} color={COLORS.green} />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            </View>
          </View>

          <Pressable style={styles.editBtn} onPress={openEdit}>
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
        </View>

        {me?.bio ? <Text style={styles.profileBio}>{me.bio}</Text> : null}

        <View style={styles.divider} />

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{listings.length}</Text>
            <Text style={styles.statLabel}>Listed</Text>
          </View>
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Text style={[styles.statValue, styles.statValueAccent]}>${earned}</Text>
            <Text style={[styles.statLabel, styles.statLabelAccent]}>Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{borrows.length}</Text>
            <Text style={styles.statLabel}>Borrowed</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── My Listings ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Listings</Text>
          <Pressable style={styles.addBtn} onPress={() => navigation.navigate('AddItem')}>
            <Ionicons name="add" size={14} color="#fff" />
            <Text style={styles.addBtnText}>Add Item</Text>
          </Pressable>
        </View>

        {listings.length === 0 ? (
          <Text style={styles.emptyRow}>You haven't listed any items yet.</Text>
        ) : (
          <View style={styles.listingsStack}>
            {listings.map((item, i) => (
              <Pressable
                key={item.id}
                style={[styles.myListingCard, i === listings.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => navigation.navigate('ItemDetail', { item })}
              >
                <View style={styles.thumb}>
                  {item.photos[0] ? (
                    <Image source={{ uri: item.photos[0] }} style={styles.thumbImg} />
                  ) : (
                    <Ionicons name="image-outline" size={18} color={COLORS.text3} />
                  )}
                </View>
                <View style={styles.myListingInfo}>
                  <Text style={styles.myListingTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.myListingMeta}>{item.category} · ${Number(item.price_per_day)}/day</Text>
                </View>
                <View style={[styles.statusPill, item.is_available ? styles.statusActive : styles.statusInactive]}>
                  <Text style={[styles.statusText, item.is_available ? styles.statusTextActive : styles.statusTextInactive]}>
                    {item.is_available ? 'Active' : 'Out'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.divider} />

        {/* ── Recent Borrows ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Borrows</Text>
          <Pressable onPress={() => navigation.navigate('Requests')}>
            <Text style={styles.sectionLink}>See all</Text>
          </Pressable>
        </View>

        {borrows.length === 0 ? (
          <Text style={styles.emptyRow}>No borrow history yet.</Text>
        ) : (
          <View style={styles.listingsStack}>
            {borrows.slice(0, 4).map((req, i) => (
              <View
                key={req.id}
                style={[styles.myListingCard, i === Math.min(borrows.length, 4) - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={styles.thumb}>
                  {req.item_photos?.[0] ? (
                    <Image source={{ uri: req.item_photos[0] }} style={styles.thumbImg} />
                  ) : (
                    <Ionicons name="image-outline" size={18} color={COLORS.text3} />
                  )}
                </View>
                <View style={styles.myListingInfo}>
                  <Text style={styles.myListingTitle} numberOfLines={1}>{req.item_title}</Text>
                  <Text style={styles.myListingMeta}>
                    {fmtDateRange(req.start_date, req.end_date)} · ${Number(req.total_price)}
                  </Text>
                </View>
                <View style={[styles.statusPill, styles.statusInactive]}>
                  <Text style={[styles.statusText, styles.statusTextInactive]}>{req.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.divider} />

        {/* ── Settings ── */}
        <Text style={styles.settingsSectionTitle}>Account</Text>

        <View style={styles.settingsCard}>
          {SETTINGS_ROWS.map((row, i) => (
            <View key={row.label}>
              <Pressable style={styles.settingsRow} onPress={() => navigation.navigate('Settings')}>
                <View style={styles.settingsIconTile}>
                  <Ionicons name={row.icon} size={16} color={COLORS.text1} />
                </View>
                <Text style={styles.settingsRowLabel}>{row.label}</Text>
                <View style={styles.settingsRowRight}>
                  {row.detail ? <Text style={styles.settingsRowDetail}>{row.detail}</Text> : null}
                  <Ionicons name="chevron-forward" size={16} color={COLORS.text3} />
                </View>
              </Pressable>
              {i < SETTINGS_ROWS.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        <Pressable style={styles.logoutBtn} onPress={confirmLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>

      {/* ── Edit profile modal ── */}
      <Modal visible={editOpen} animationType="slide" transparent onRequestClose={() => setEditOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setEditOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Edit Profile</Text>
            <Pressable onPress={() => setEditOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={22} color={COLORS.text2} />
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={editName}
            onChangeText={setEditName}
            placeholder="Your name"
            placeholderTextColor={COLORS.text3}
            maxLength={128}
          />

          <Text style={styles.fieldLabel}>School</Text>
          <TextInput
            style={styles.input}
            value={editCampus}
            onChangeText={setEditCampus}
            placeholder="e.g. UCLA"
            placeholderTextColor={COLORS.text3}
            maxLength={128}
          />

          <Text style={styles.fieldLabel}>Graduation year</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.editChipRow}>
            {gradYears.map(y => {
              const active = y === editGradYear;
              return (
                <Pressable
                  key={y}
                  style={[styles.editChip, active && styles.editChipActive]}
                  onPress={() => setEditGradYear(active ? null : y)}
                >
                  <Text style={[styles.editChipText, active && styles.editChipTextActive]}>{y}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.fieldLabel}>Major</Text>
          <TextInput
            style={styles.input}
            value={editMajor}
            onChangeText={setEditMajor}
            placeholder="e.g. Computer Science"
            placeholderTextColor={COLORS.text3}
            maxLength={128}
          />

          <Text style={styles.fieldLabel}>Bio</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={editBio}
            onChangeText={setEditBio}
            placeholder="Tell others a bit about you…"
            placeholderTextColor={COLORS.text3}
            multiline
            maxLength={300}
          />

          <Pressable
            style={[styles.saveBtn, (saving || !editName.trim()) && { opacity: 0.5 }]}
            onPress={saveProfile}
            disabled={saving || !editName.trim()}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </Pressable>
        </View>
      </Modal>

      <BottomNav
        activeNav="profile"
        setActiveNav={(id) => {
          if (id === 'home') navigation.navigate('Home');
          else if (id === 'requests') navigation.navigate('Requests');
          else if (id === 'browse') navigation.navigate('Search');
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
    color: COLORS.green,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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

  // Stats — "Earned" card flips to green to semantically tie to money.
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
    backgroundColor: COLORS.greenLight,
    borderColor: COLORS.green,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: COLORS.text1,
    letterSpacing: -0.3,
  },
  statValueAccent: {
    color: COLORS.green,
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
    color: COLORS.green,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
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
    backgroundColor: COLORS.greenLight,
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
  emptyRow: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.text3,
    marginHorizontal: 24,
    marginBottom: 28,
  },

  // Edit profile sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: COLORS.text1,
    letterSpacing: -0.3,
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.text1,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text1,
    backgroundColor: COLORS.surface,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editChipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  editChip: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  editChipActive: {
    backgroundColor: COLORS.amber,
    borderColor: COLORS.amber,
  },
  editChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.text2,
  },
  editChipTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: COLORS.amber,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },

  // Account settings
  settingsSectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: COLORS.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
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
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  settingsIconTile: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
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
  rowDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 56,
  },
  logoutBtn: {
    marginHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.redLight,
    alignItems: 'center',
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.red,
  },
});
