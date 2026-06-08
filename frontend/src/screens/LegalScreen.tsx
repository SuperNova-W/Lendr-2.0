import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { SHELL_MAX } from '../lib/responsive';

type Section = { heading: string; body: string };

const LAST_UPDATED = 'June 1, 2026';

const TERMS: Section[] = [
  {
    heading: '1. Students Only',
    body: 'Lendr is a peer-to-peer lending marketplace exclusively for verified college students. By creating an account you confirm that you are a currently enrolled student and that the email address you signed in with belongs to you. Accounts found to be ineligible may be removed.',
  },
  {
    heading: '2. Listing & Borrowing Items',
    body: 'When you list an item you are responsible for describing it accurately and for the condition in which it is lent. When you borrow an item you agree to return it on time and in the same condition. Lendr facilitates connections between students but is not a party to any rental agreement between users.',
  },
  {
    heading: '3. Responsible Use',
    body: 'You agree not to list illegal, dangerous, or prohibited items, not to harass other users, and not to misrepresent yourself or your items. Pricing should be fair and transparent. Repeated violations may result in suspension or removal from the platform.',
  },
  {
    heading: '4. Payments & Disputes',
    body: 'Any payment arrangements are made directly between the lender and borrower. Lendr does not currently process payments and is not responsible for resolving payment disputes, damage, or loss. We encourage users to communicate clearly and document item condition before and after each rental.',
  },
  {
    heading: '5. Liability',
    body: 'Lendr is provided "as is" without warranties of any kind. To the fullest extent permitted by law, Lendr is not liable for any damages arising from your use of the platform, interactions with other users, or the condition of borrowed items.',
  },
  {
    heading: '6. Changes to These Terms',
    body: 'We may update these Terms from time to time. Continued use of Lendr after changes take effect constitutes acceptance of the revised Terms.',
  },
];

const PRIVACY: Section[] = [
  {
    heading: '1. Information We Collect',
    body: 'When you sign in with Google we receive your name, email address, and profile photo. During onboarding you may provide your school, graduation year, major, and a short bio. When you use the app we store the items you list, the borrow requests you make or receive, and photos you upload.',
  },
  {
    heading: '2. How We Use Your Information',
    body: 'We use your information to operate the marketplace: to show your listings to other students, to connect borrowers with lenders, to display your profile, and to verify that you are an eligible college student. We do not sell your personal information.',
  },
  {
    heading: '3. What Others Can See',
    body: 'Other students can see your name, profile photo, school, rating, bio, and the items you list. They cannot see your email address unless you choose to share it. Borrow requests are visible only to the lender and borrower involved.',
  },
  {
    heading: '4. Data Storage',
    body: 'Your data is stored securely using industry-standard providers. Photos are stored in cloud object storage and served via public URLs attached to your listings.',
  },
  {
    heading: '5. Your Choices',
    body: 'You can edit your profile information at any time from the Profile screen. You can permanently delete your account from Settings, which removes your profile, listings, and associated data.',
  },
  {
    heading: '6. Contact',
    body: 'If you have questions about this Privacy Policy or how your data is handled, please reach out through the in-app support options.',
  },
];

export const LegalScreen: React.FC<any> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const kind: 'terms' | 'privacy' = route.params?.kind ?? 'terms';
  const title = kind === 'terms' ? 'Terms of Service' : 'Privacy Policy';
  const sections = kind === 'terms' ? TERMS : PRIVACY;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text1} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 40, width: "100%" }}
      >
        <Text style={styles.updated}>Last updated {LAST_UPDATED}</Text>
        {sections.map(s => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
        <Text style={styles.footer}>
          This document is a plain-language summary for the Lendr student community and is not legal advice.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, width: '100%', maxWidth: SHELL_MAX, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  updated: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.text3,
    marginBottom: 24,
  },
  section: {
    marginBottom: 22,
  },
  heading: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: COLORS.text1,
    marginBottom: 8,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text2,
    lineHeight: 22,
  },
  footer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.text3,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 18,
  },
});
