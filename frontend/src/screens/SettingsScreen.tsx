import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Switch,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { getMe, deleteMe, User } from '../lib/api';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const NOTIF_PREFS_KEY = 'lendr.notifPrefs';

export const SettingsScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const token = session?.access_token;

  const [me, setMe] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [notifBorrow, setNotifBorrow] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifReturns, setNotifReturns] = useState(false);
  const [notifEmail, setNotifEmail] = useState(false);
  const [showLastActive, setShowLastActive] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

  // Load profile for the Account section
  useFocusEffect(
    useCallback(() => {
      if (token) getMe(token).then(setMe).catch(console.error);
    }, [token])
  );

  // Persist notification/privacy toggles locally (no push backend yet)
  useEffect(() => {
    AsyncStorage.getItem(NOTIF_PREFS_KEY).then(raw => {
      if (!raw) return;
      try {
        const p = JSON.parse(raw);
        setNotifBorrow(p.notifBorrow ?? true);
        setNotifMessages(p.notifMessages ?? true);
        setNotifReturns(p.notifReturns ?? false);
        setNotifEmail(p.notifEmail ?? false);
        setShowLastActive(p.showLastActive ?? true);
        setPublicProfile(p.publicProfile ?? true);
      } catch {}
    });
  }, []);

  function persistPrefs(next: Record<string, boolean>) {
    const merged = { notifBorrow, notifMessages, notifReturns, notifEmail, showLastActive, publicProfile, ...next };
    AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(merged)).catch(() => {});
  }

  const comingSoon = (feature: string) =>
    Alert.alert(`${feature}`, 'This feature is coming soon.');

  function confirmLogout() {
    Alert.alert('Log out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  function confirmDelete() {
    Alert.alert(
      'Delete account?',
      'This permanently removes your profile, listings, and requests. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            setDeleting(true);
            try {
              await deleteMe(token);
              await signOut(); // drops back to the auth flow
            } catch (e: any) {
              setDeleting(false);
              Alert.alert('Could not delete account', e.message ?? 'Something went wrong');
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text1} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.screen}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >

        <SectionLabel label="Account" />
        <SettingsCard>
          <NavRow
            icon="person-outline"
            label="Edit Profile"
            onPress={() => navigation.navigate('Profile', { editOnFocus: true })}
          />
          <Divider />
          <InfoRow icon="mail-outline" label="Email Address" detail={me?.email ?? '—'} />
          <Divider />
          <InfoRow icon="school-outline" label="School" detail={me?.campus ?? 'Not set'} />
          <Divider />
          <InfoRow
            icon="ribbon-outline"
            label="Class of"
            detail={me?.grad_year ? String(me.grad_year) : 'Not set'}
          />
        </SettingsCard>

        <SectionLabel label="Notifications" />
        <SettingsCard>
          <ToggleRow
            icon="cube-outline"
            label="Borrow Requests"
            description="When someone wants to borrow your item"
            value={notifBorrow}
            onChange={v => { setNotifBorrow(v); persistPrefs({ notifBorrow: v }); }}
          />
          <Divider />
          <ToggleRow
            icon="chatbubble-ellipses-outline"
            label="Messages"
            description="Direct messages from other students"
            value={notifMessages}
            onChange={v => { setNotifMessages(v); persistPrefs({ notifMessages: v }); }}
          />
          <Divider />
          <ToggleRow
            icon="refresh-outline"
            label="Return Reminders"
            description="Reminders when a borrowed item is due"
            value={notifReturns}
            onChange={v => { setNotifReturns(v); persistPrefs({ notifReturns: v }); }}
          />
          <Divider />
          <ToggleRow
            icon="mail-outline"
            label="Email Digest"
            description="Weekly summary of marketplace activity"
            value={notifEmail}
            onChange={v => { setNotifEmail(v); persistPrefs({ notifEmail: v }); }}
          />
        </SettingsCard>

        <SectionLabel label="Privacy & Safety" />
        <SettingsCard>
          <ToggleRow
            icon="eye-outline"
            label="Public Profile"
            description="Other students can find and view your profile"
            value={publicProfile}
            onChange={v => { setPublicProfile(v); persistPrefs({ publicProfile: v }); }}
          />
          <Divider />
          <ToggleRow
            icon="time-outline"
            label="Show Last Active"
            description="Let others see when you were last online"
            value={showLastActive}
            onChange={v => { setShowLastActive(v); persistPrefs({ showLastActive: v }); }}
          />
          <Divider />
          <NavRow icon="ban-outline" label="Blocked Users" onPress={() => comingSoon('Blocked Users')} />
          <Divider />
          <NavRow icon="shield-checkmark-outline" label="Safety Center" onPress={() => comingSoon('Safety Center')} />
        </SettingsCard>

        <SectionLabel label="Support" />
        <SettingsCard>
          <NavRow icon="help-circle-outline" label="Help Center" onPress={() => comingSoon('Help Center')} />
          <Divider />
          <NavRow icon="bug-outline" label="Report a Bug" onPress={() => comingSoon('Report a Bug')} />
          <Divider />
          <NavRow icon="star-outline" label="Rate Lendr" onPress={() => comingSoon('Rate Lendr')} />
        </SettingsCard>

        <SectionLabel label="About" />
        <SettingsCard>
          <NavRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => navigation.navigate('Legal', { kind: 'terms' })}
          />
          <Divider />
          <NavRow
            icon="lock-closed-outline"
            label="Privacy Policy"
            onPress={() => navigation.navigate('Legal', { kind: 'privacy' })}
          />
          <Divider />
          <InfoRow icon="information-circle-outline" label="Version" detail="1.0.0 (build 42)" />
        </SettingsCard>

        <SectionLabel label="Danger Zone" />
        <SettingsCard>
          <Pressable style={styles.dangerRow} onPress={confirmDelete} disabled={deleting}>
            <View style={[styles.iconTile, { backgroundColor: COLORS.redLight }]}>
              {deleting ? (
                <ActivityIndicator size="small" color={COLORS.red} />
              ) : (
                <Ionicons name="trash-outline" size={16} color={COLORS.red} />
              )}
            </View>
            <Text style={styles.dangerLabel}>{deleting ? 'Deleting…' : 'Delete Account'}</Text>
          </Pressable>
        </SettingsCard>

        <Pressable style={styles.logoutBtn} onPress={confirmLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

      </ScrollView>
    </View>
  );
};

// ── Sub-components ──────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Divider() {
  return <View style={styles.cardDivider} />;
}

function IconTile({ icon }: { icon: IoniconsName }) {
  return (
    <View style={styles.iconTile}>
      <Ionicons name={icon} size={16} color={COLORS.text1} />
    </View>
  );
}

function NavRow({
  icon,
  label,
  detail,
  onPress,
}: {
  icon: IoniconsName;
  label: string;
  detail?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <IconTile icon={icon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
        <Ionicons name="chevron-forward" size={16} color={COLORS.text3} />
      </View>
    </Pressable>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: IoniconsName;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <IconTile icon={icon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.border, true: COLORS.amber }}
        thumbColor="#fff"
        ios_backgroundColor={COLORS.border}
      />
    </View>
  );
}

function InfoRow({
  icon,
  label,
  detail,
}: {
  icon: IoniconsName;
  label: string;
  detail: string;
}) {
  return (
    <View style={styles.row}>
      <IconTile icon={icon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowDetail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: COLORS.text1,
  },
  screen: {
    flex: 1,
  },

  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: COLORS.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    paddingHorizontal: 24,
    paddingBottom: 10,
    paddingTop: 4,
  },
  card: {
    marginHorizontal: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 56,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconTile: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: COLORS.text1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowDetail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.text3,
  },
  toggleDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.text3,
    marginTop: 2,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  dangerLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: COLORS.red,
  },
  logoutBtn: {
    marginHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.redLight,
    alignItems: 'center',
    marginBottom: 8,
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.red,
  },
});
