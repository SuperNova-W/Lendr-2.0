import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Switch,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export const SettingsScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [notifBorrow, setNotifBorrow] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifReturns, setNotifReturns] = useState(false);
  const [notifEmail, setNotifEmail] = useState(false);
  const [showLastActive, setShowLastActive] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

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
          <NavRow icon="person-outline" label="Edit Profile" onPress={() => {}} />
          <Divider />
          <NavRow icon="mail-outline" label="Email Address" detail="kayla@ucla.edu" onPress={() => {}} />
          <Divider />
          <NavRow icon="key-outline" label="Change Password" onPress={() => {}} />
          <Divider />
          <NavRow icon="call-outline" label="Phone Number" detail="(310) 555-0192" onPress={() => {}} />
          <Divider />
          <NavRow icon="school-outline" label="Campus" detail="UCLA" onPress={() => {}} />
        </SettingsCard>

        <SectionLabel label="Notifications" />
        <SettingsCard>
          <ToggleRow
            icon="cube-outline"
            label="Borrow Requests"
            description="When someone wants to borrow your item"
            value={notifBorrow}
            onChange={setNotifBorrow}
          />
          <Divider />
          <ToggleRow
            icon="chatbubble-ellipses-outline"
            label="Messages"
            description="Direct messages from other students"
            value={notifMessages}
            onChange={setNotifMessages}
          />
          <Divider />
          <ToggleRow
            icon="refresh-outline"
            label="Return Reminders"
            description="Reminders when a borrowed item is due"
            value={notifReturns}
            onChange={setNotifReturns}
          />
          <Divider />
          <ToggleRow
            icon="mail-outline"
            label="Email Digest"
            description="Weekly summary of marketplace activity"
            value={notifEmail}
            onChange={setNotifEmail}
          />
        </SettingsCard>

        <SectionLabel label="Privacy & Safety" />
        <SettingsCard>
          <ToggleRow
            icon="eye-outline"
            label="Public Profile"
            description="Other students can find and view your profile"
            value={publicProfile}
            onChange={setPublicProfile}
          />
          <Divider />
          <ToggleRow
            icon="time-outline"
            label="Show Last Active"
            description="Let others see when you were last online"
            value={showLastActive}
            onChange={setShowLastActive}
          />
          <Divider />
          <NavRow icon="ban-outline" label="Blocked Users" detail="0 blocked" onPress={() => {}} />
          <Divider />
          <NavRow icon="shield-checkmark-outline" label="Safety Center" onPress={() => {}} />
        </SettingsCard>

        <SectionLabel label="Payments" />
        <SettingsCard>
          <NavRow icon="card-outline" label="Payment Methods" detail="Venmo connected" onPress={() => {}} />
          <Divider />
          <NavRow icon="business-outline" label="Payout Account" detail="Bank •• 4291" onPress={() => {}} />
          <Divider />
          <NavRow icon="receipt-outline" label="Transaction History" onPress={() => {}} />
        </SettingsCard>

        <SectionLabel label="Support" />
        <SettingsCard>
          <NavRow icon="help-circle-outline" label="Help Center" onPress={() => {}} />
          <Divider />
          <NavRow icon="bug-outline" label="Report a Bug" onPress={() => {}} />
          <Divider />
          <NavRow icon="star-outline" label="Rate Lendr" onPress={() => {}} />
        </SettingsCard>

        <SectionLabel label="About" />
        <SettingsCard>
          <NavRow icon="document-text-outline" label="Terms of Service" onPress={() => {}} />
          <Divider />
          <NavRow icon="lock-closed-outline" label="Privacy Policy" onPress={() => {}} />
          <Divider />
          <InfoRow icon="information-circle-outline" label="Version" detail="1.0.0 (build 42)" />
        </SettingsCard>

        <SectionLabel label="Danger Zone" />
        <SettingsCard>
          <Pressable style={styles.dangerRow}>
            <View style={[styles.iconTile, { backgroundColor: COLORS.redLight }]}>
              <Ionicons name="trash-outline" size={16} color={COLORS.red} />
            </View>
            <Text style={styles.dangerLabel}>Delete Account</Text>
          </Pressable>
        </SettingsCard>

        <Pressable style={styles.logoutBtn}>
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
