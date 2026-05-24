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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';

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
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.screen}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >

        {/* ── Account ── */}
        <SectionLabel label="Account" />
        <SettingsCard>
          <NavRow icon="👤" label="Edit Profile" onPress={() => {}} />
          <Divider />
          <NavRow icon="📧" label="Email Address" detail="kayla@ucla.edu" onPress={() => {}} />
          <Divider />
          <NavRow icon="🔑" label="Change Password" onPress={() => {}} />
          <Divider />
          <NavRow icon="📱" label="Phone Number" detail="(310) 555-0192" onPress={() => {}} />
          <Divider />
          <NavRow icon="🏫" label="Campus" detail="UCLA" onPress={() => {}} />
        </SettingsCard>

        {/* ── Notifications ── */}
        <SectionLabel label="Notifications" />
        <SettingsCard>
          <ToggleRow
            icon="📦"
            label="Borrow Requests"
            description="When someone wants to borrow your item"
            value={notifBorrow}
            onChange={setNotifBorrow}
          />
          <Divider />
          <ToggleRow
            icon="💬"
            label="Messages"
            description="Direct messages from other students"
            value={notifMessages}
            onChange={setNotifMessages}
          />
          <Divider />
          <ToggleRow
            icon="🔄"
            label="Return Reminders"
            description="Reminders when a borrowed item is due"
            value={notifReturns}
            onChange={setNotifReturns}
          />
          <Divider />
          <ToggleRow
            icon="📧"
            label="Email Digest"
            description="Weekly summary of marketplace activity"
            value={notifEmail}
            onChange={setNotifEmail}
          />
        </SettingsCard>

        {/* ── Privacy & Safety ── */}
        <SectionLabel label="Privacy & Safety" />
        <SettingsCard>
          <ToggleRow
            icon="👁️"
            label="Public Profile"
            description="Other students can find and view your profile"
            value={publicProfile}
            onChange={setPublicProfile}
          />
          <Divider />
          <ToggleRow
            icon="🕐"
            label="Show Last Active"
            description="Let others see when you were last online"
            value={showLastActive}
            onChange={setShowLastActive}
          />
          <Divider />
          <NavRow icon="🚫" label="Blocked Users" detail="0 blocked" onPress={() => {}} />
          <Divider />
          <NavRow icon="🛡️" label="Safety Center" onPress={() => {}} />
        </SettingsCard>

        {/* ── Payments ── */}
        <SectionLabel label="Payments" />
        <SettingsCard>
          <NavRow icon="💳" label="Payment Methods" detail="Venmo connected" onPress={() => {}} />
          <Divider />
          <NavRow icon="🏦" label="Payout Account" detail="Bank •• 4291" onPress={() => {}} />
          <Divider />
          <NavRow icon="🧾" label="Transaction History" onPress={() => {}} />
        </SettingsCard>

        {/* ── Support ── */}
        <SectionLabel label="Support" />
        <SettingsCard>
          <NavRow icon="❓" label="Help Center" onPress={() => {}} />
          <Divider />
          <NavRow icon="🐛" label="Report a Bug" onPress={() => {}} />
          <Divider />
          <NavRow icon="⭐" label="Rate Lendr" onPress={() => {}} />
        </SettingsCard>

        {/* ── About ── */}
        <SectionLabel label="About" />
        <SettingsCard>
          <NavRow icon="📄" label="Terms of Service" onPress={() => {}} />
          <Divider />
          <NavRow icon="🔒" label="Privacy Policy" onPress={() => {}} />
          <Divider />
          <InfoRow icon="ℹ️" label="Version" detail="1.0.0 (build 42)" />
        </SettingsCard>

        {/* ── Danger Zone ── */}
        <SectionLabel label="Danger Zone" />
        <SettingsCard>
          <Pressable style={styles.dangerRow}>
            <Text style={styles.dangerIcon}>🗑️</Text>
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
  return <Text style={sectionLabelStyle}>{label}</Text>;
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View style={cardStyle}>{children}</View>;
}

function Divider() {
  return <View style={dividerStyle} />;
}

function NavRow({
  icon,
  label,
  detail,
  onPress,
}: {
  icon: string;
  label: string;
  detail?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={rowStyle} onPress={onPress}>
      <Text style={rowIconStyle}>{icon}</Text>
      <Text style={rowLabelStyle}>{label}</Text>
      <View style={rowRightStyle}>
        {detail ? <Text style={rowDetailStyle}>{detail}</Text> : null}
        <Text style={chevronStyle}>›</Text>
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
  icon: string;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={rowStyle}>
      <Text style={rowIconStyle}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={rowLabelStyle}>{label}</Text>
        <Text style={toggleDescStyle}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.border, true: COLORS.amber }}
        thumbColor="#fff"
      />
    </View>
  );
}

function InfoRow({
  icon,
  label,
  detail,
}: {
  icon: string;
  label: string;
  detail: string;
}) {
  return (
    <View style={rowStyle}>
      <Text style={rowIconStyle}>{icon}</Text>
      <Text style={rowLabelStyle}>{label}</Text>
      <Text style={rowDetailStyle}>{detail}</Text>
    </View>
  );
}

// ── Shared inline styles ──────────────────────────────────────

const sectionLabelStyle: object = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 12,
  color: COLORS.text3,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.7,
  paddingHorizontal: 24,
  paddingBottom: 10,
  paddingTop: 4,
};

const cardStyle: object = {
  marginHorizontal: 24,
  backgroundColor: COLORS.surface,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 16,
  marginBottom: 24,
  overflow: 'hidden' as const,
};

const dividerStyle: object = {
  height: 1,
  backgroundColor: COLORS.border,
  marginLeft: 54,
};

const rowStyle: object = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  paddingVertical: 14,
  paddingHorizontal: 16,
  gap: 14,
};

const rowIconStyle: object = {
  fontSize: 18,
  width: 24,
  textAlign: 'center' as const,
};

const rowLabelStyle: object = {
  flex: 1,
  fontFamily: 'Inter_500Medium',
  fontSize: 14,
  color: COLORS.text1,
};

const rowRightStyle: object = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 4,
};

const rowDetailStyle: object = {
  fontFamily: 'Inter_400Regular',
  fontSize: 13,
  color: COLORS.text3,
};

const chevronStyle: object = {
  fontSize: 20,
  color: COLORS.text3,
  lineHeight: 22,
};

const toggleDescStyle: object = {
  fontFamily: 'Inter_400Regular',
  fontSize: 12,
  color: COLORS.text3,
  marginTop: 2,
};

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
  backIcon: {
    fontSize: 20,
    color: COLORS.text1,
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: COLORS.text1,
  },
  screen: {
    flex: 1,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  dangerIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  dangerLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#D9534F',
  },
  logoutBtn: {
    marginHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#FFD5D5',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#D9534F',
  },
});
