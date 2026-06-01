import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  StatusBar,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { updateMe } from '../lib/api';

// Best-effort campus guess from the user's .edu email (e.g. someone@ucla.edu → "UCLA").
function campusFromEmail(email?: string): string {
  if (!email) return '';
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  const label = domain
    .replace(/\.(edu|ac\.uk|edu\.au|ac\.nz|edu\.sg|ac\.in|edu\.in)$/i, '')
    .split('.')
    .pop();
  return label ? label.toUpperCase() : '';
}

export const SetupProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { session, completeOnboarding, signOut } = useAuth();
  const token = session?.access_token;

  const meta = session?.user?.user_metadata ?? {};
  const email: string = session?.user?.email ?? '';
  const fullName: string = meta.full_name ?? meta.name ?? '';
  const avatarUrl: string | null = meta.avatar_url ?? null;
  const firstName = fullName.split(' ')[0] || 'there';

  const currentYear = new Date().getFullYear();
  const gradYears = useMemo(
    () => Array.from({ length: 7 }, (_, i) => currentYear + i),
    [currentYear]
  );

  const [campus, setCampus] = useState(campusFromEmail(email));
  const [gradYear, setGradYear] = useState<number | null>(null);
  const [major, setMajor] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  async function finish() {
    if (!token) { Alert.alert('Session expired', 'Please sign in again.'); return; }
    if (!campus.trim()) { Alert.alert('One more thing', 'Please enter your school.'); return; }
    if (!gradYear)      { Alert.alert('One more thing', 'Please select your graduation year.'); return; }

    setSaving(true);
    try {
      await updateMe(token, {
        campus: campus.trim(),
        grad_year: gradYear,
        major: major.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      completeOnboarding(); // flips the app over to the main experience
    } catch (e: any) {
      Alert.alert('Could not save', e.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 28, paddingBottom: insets.bottom + 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Identity header */}
          <View style={styles.identity}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.verifiedPill}>
              <Ionicons name="shield-checkmark" size={13} color={COLORS.green} />
              <Text style={styles.verifiedText} numberOfLines={1}>{email}</Text>
            </View>
          </View>

          <Text style={styles.title}>Welcome, {firstName}!</Text>
          <Text style={styles.subtitle}>
            Lendr is a students-only community. Tell us a bit about you to finish setting up.
          </Text>

          {/* School */}
          <Text style={styles.label}>School</Text>
          <TextInput
            style={styles.input}
            value={campus}
            onChangeText={setCampus}
            placeholder="e.g. UCLA"
            placeholderTextColor={COLORS.text3}
            maxLength={128}
          />

          {/* Graduation year */}
          <Text style={styles.label}>Graduation year</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {gradYears.map(y => {
              const active = y === gradYear;
              return (
                <Pressable key={y} style={[styles.chip, active && styles.chipActive]} onPress={() => setGradYear(y)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{y}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Major */}
          <Text style={styles.label}>Major <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={styles.input}
            value={major}
            onChangeText={setMajor}
            placeholder="e.g. Computer Science"
            placeholderTextColor={COLORS.text3}
            maxLength={128}
          />

          {/* Bio */}
          <Text style={styles.label}>Bio <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={bio}
            onChangeText={setBio}
            placeholder="What are you studying, what do you like to lend or borrow?"
            placeholderTextColor={COLORS.text3}
            multiline
            maxLength={300}
          />

          <Pressable onPress={signOut} style={styles.signOutRow}>
            <Text style={styles.signOutText}>Not you? Sign out</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom action */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable style={[styles.cta, saving && { opacity: 0.6 }]} onPress={finish} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Get Started</Text>}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  identity: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.amberLight,
    borderWidth: 2,
    borderColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: COLORS.amberDark,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.greenLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    maxWidth: '100%',
  },
  verifiedText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: COLORS.green,
  },

  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: COLORS.inkOnboarding1,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.inkOnboarding3,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 28,
  },

  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.inkOnboarding1,
    marginTop: 20,
    marginBottom: 10,
  },
  optional: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.text3,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.borderInput,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.inkOnboarding1,
    backgroundColor: COLORS.surfaceInput,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },

  chipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.borderInput,
    backgroundColor: COLORS.surfaceInput,
  },
  chipActive: {
    backgroundColor: COLORS.amber,
    borderColor: COLORS.amber,
  },
  chipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.text2,
  },
  chipTextActive: { color: '#fff' },

  signOutRow: {
    alignItems: 'center',
    marginTop: 28,
  },
  signOutText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: COLORS.text3,
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 28,
    paddingTop: 14,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cta: {
    backgroundColor: COLORS.amber,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.1,
  },
});
