import React, { useMemo, useState } from 'react';
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
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
  SlideInRight,
  SlideInLeft,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../theme/colors';
import { SHELL_MAX } from '../lib/responsive';
import { useAuth } from '../context/AuthContext';
import { updateMe, uploadPhoto } from '../lib/api';
import { FadeInUp, StepHeader, SelectChip, StepInput } from '../components/onboarding/OnboardingPrimitives';

const INTEREST_OPTIONS = ['Textbooks', 'Tech', 'Dorm', 'Formal', 'Sports', 'Outdoors', 'Gaming', 'Music', 'Kitchen', 'Other'];

// Best-effort school name from the .edu email (e.g. bruin@ucla.edu → "UCLA").
function campusFromEmail(email?: string): string {
  if (!email) return '';
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  const label = domain
    .replace(/\.(edu|ac\.uk|edu\.au|ac\.nz|edu\.sg|ac\.in|edu\.in)$/i, '')
    .split('.')
    .pop();
  return label ? label.toUpperCase() : '';
}

type StepId = 'welcome' | 'grad' | 'major' | 'interests' | 'dorm' | 'phone' | 'photo' | 'payment' | 'bio' | 'done';

export const SetupProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { session, completeOnboarding, signOut } = useAuth();
  const token = session?.access_token;

  const meta = session?.user?.user_metadata ?? {};
  const fullName: string = meta.full_name ?? meta.name ?? '';
  const firstName = fullName.split(' ')[0] || 'there';
  const googleAvatar: string | null = meta.avatar_url ?? null;

  const currentYear = new Date().getFullYear();
  const gradYears = useMemo(() => Array.from({ length: 7 }, (_, i) => currentYear + i), [currentYear]);

  // ── Collected data ──
  const [gradYear, setGradYear] = useState<number | null>(null);
  const [major, setMajor] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [dorm, setDorm] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(googleAvatar);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [bio, setBio] = useState('');
  // Payment is a UI-only mockup — never stored or transmitted.
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);

  const steps: StepId[] = ['welcome', 'grad', 'major', 'interests', 'dorm', 'phone', 'photo', 'payment', 'bio', 'done'];
  const current = steps[step];
  const progress = (step + 1) / steps.length;

  const progressW = useSharedValue(1 / steps.length);
  const progressStyle = useAnimatedStyle(() => ({ width: `${progressW.value * 100}%` }));

  function goNext() {
    if (step < steps.length - 1) {
      setDirection(1);
      const next = step + 1;
      setStep(next);
      progressW.value = withTiming((next + 1) / steps.length, { duration: 350 });
    }
  }
  function goBack() {
    if (step > 0) {
      setDirection(-1);
      const prev = step - 1;
      setStep(prev);
      progressW.value = withTiming((prev + 1) / steps.length, { duration: 350 });
    }
  }

  function toggleInterest(i: string) {
    setInterests(prev => (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]));
  }

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showAlert('Permission needed', 'Allow photo access to choose a profile picture.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled) {
      setPhotoUri(res.assets[0].uri);
      setPhotoChanged(true);
    }
  }

  // Per-step validation gate for the Next button
  const canAdvance = () => {
    if (current === 'grad') return gradYear !== null;
    if (current === 'major') return major.trim().length > 0;
    return true;
  };

  async function finish() {
    if (!token) { showAlert('Session expired', 'Please sign in again.'); return; }
    setSaving(true);
    try {
      let avatarUrl: string | undefined;
      if (photoChanged && photoUri && !photoUri.startsWith('http')) {
        avatarUrl = await uploadPhoto(token, photoUri);
      }
      // Campus is derived from the verified .edu email (Google doesn't expose "school").
      const derivedCampus = meta.campus || campusFromEmail(session?.user?.email);
      await updateMe(token, {
        campus: derivedCampus || undefined,
        grad_year: gradYear ?? undefined,
        major: major.trim() || undefined,
        interests: interests.length ? interests : undefined,
        dorm: dorm.trim() || undefined,
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar_url: avatarUrl,
      });
      completeOnboarding();
    } catch (e: any) {
      showAlert('Could not save', e.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  // ── Step content ──
  function renderStep() {
    switch (current) {
      case 'welcome':
        return (
          <View style={styles.stepBody}>
            <FadeInUp index={0} style={{ alignItems: 'center' }}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.welcomeAvatar} />
              ) : (
                <View style={styles.welcomeAvatar}><Text style={styles.welcomeAvatarText}>{firstName.charAt(0).toUpperCase()}</Text></View>
              )}
            </FadeInUp>
            <FadeInUp index={1}>
              <Text style={styles.welcomeTitle}>Welcome, {firstName} 👋</Text>
            </FadeInUp>
            <FadeInUp index={2}>
              <Text style={styles.welcomeBody}>
                Let's set up your profile so other students can get to know you. It only takes a minute.
              </Text>
            </FadeInUp>
          </View>
        );

      case 'grad':
        return (
          <View style={styles.stepBody}>
            <StepHeader eyebrow="About you" title="When do you graduate?" subtitle="Your class year helps connect you with peers." />
            <View style={styles.chipWrap}>
              {gradYears.map((y, i) => (
                <FadeInUp key={y} index={3 + i * 0.4}>
                  <SelectChip label={String(y)} selected={gradYear === y} onPress={() => setGradYear(y)} />
                </FadeInUp>
              ))}
            </View>
          </View>
        );

      case 'major':
        return (
          <View style={styles.stepBody}>
            <StepHeader eyebrow="About you" title="What's your major?" subtitle="Tell us what you're studying." />
            <FadeInUp index={3}>
              <StepInput value={major} onChangeText={setMajor} placeholder="e.g. Computer Science" autoFocus maxLength={128} />
            </FadeInUp>
          </View>
        );

      case 'interests':
        return (
          <View style={styles.stepBody}>
            <StepHeader eyebrow="Your vibe" title="What are you into?" subtitle="Pick what you like to borrow or lend. Optional." />
            <View style={styles.chipWrap}>
              {INTEREST_OPTIONS.map((opt, i) => (
                <FadeInUp key={opt} index={3 + i * 0.3}>
                  <SelectChip label={opt} selected={interests.includes(opt)} onPress={() => toggleInterest(opt)} />
                </FadeInUp>
              ))}
            </View>
          </View>
        );

      case 'dorm':
        return (
          <View style={styles.stepBody}>
            <StepHeader eyebrow="Where you are" title="Where do you live?" subtitle="Your dorm or area near campus. Optional." />
            <FadeInUp index={3}>
              <StepInput value={dorm} onChangeText={setDorm} placeholder="e.g. Rieber Hall" autoFocus maxLength={128} />
            </FadeInUp>
          </View>
        );

      case 'phone':
        return (
          <View style={styles.stepBody}>
            <StepHeader eyebrow="Stay reachable" title="Phone number" subtitle="So you can coordinate pickups. Optional and never shown publicly." />
            <FadeInUp index={3}>
              <StepInput value={phone} onChangeText={t => setPhone(t.replace(/[^0-9+\-() ]/g, ''))} placeholder="(555) 123-4567" keyboardType="phone-pad" autoFocus maxLength={32} />
            </FadeInUp>
          </View>
        );

      case 'photo':
        return (
          <View style={styles.stepBody}>
            <StepHeader eyebrow="Show yourself" title="Profile photo" subtitle="Keep your Google photo or pick a new one." />
            <FadeInUp index={3} style={{ alignItems: 'center', marginTop: 8 }}>
              <Pressable onPress={pickPhoto} style={styles.photoPick}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoImg} />
                ) : (
                  <Ionicons name="person" size={56} color={COLORS.text3} />
                )}
                <View style={styles.photoEdit}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </Pressable>
              <Pressable onPress={pickPhoto}>
                <Text style={styles.photoLink}>{photoUri ? 'Change photo' : 'Upload a photo'}</Text>
              </Pressable>
            </FadeInUp>
          </View>
        );

      case 'payment':
        return (
          <View style={styles.stepBody}>
            <StepHeader eyebrow="Payments" title="Add a card" subtitle="For smooth rentals later. You can always do this another time." />
            <FadeInUp index={3}>
              <View style={styles.cardPreview}>
                <View style={styles.cardChip} />
                <Text style={styles.cardNumberText}>
                  {cardNumber ? cardNumber.padEnd(19, '•').replace(/(.{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                </Text>
                <View style={styles.cardBottomRow}>
                  <Text style={styles.cardExpText}>{cardExp || 'MM/YY'}</Text>
                  <Ionicons name="card" size={26} color="rgba(255,255,255,0.85)" />
                </View>
              </View>
            </FadeInUp>
            <FadeInUp index={4}>
              <StepInput value={cardNumber} onChangeText={t => setCardNumber(t.replace(/[^0-9]/g, '').slice(0, 16))} placeholder="Card number" keyboardType="number-pad" style={{ marginTop: 16 }} />
            </FadeInUp>
            <FadeInUp index={5} style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <StepInput value={cardExp} onChangeText={setCardExp} placeholder="MM/YY" maxLength={5} />
              </View>
              <View style={{ flex: 1 }}>
                <StepInput value={cardCvc} onChangeText={t => setCardCvc(t.replace(/[^0-9]/g, '').slice(0, 4))} placeholder="CVC" keyboardType="number-pad" />
              </View>
            </FadeInUp>
            <FadeInUp index={6}>
              <Text style={styles.cardNote}>This is a preview — no card details are stored yet.</Text>
            </FadeInUp>
          </View>
        );

      case 'bio':
        return (
          <View style={styles.stepBody}>
            <StepHeader eyebrow="Last step" title="Add a short bio" subtitle="A line or two about you. Optional." />
            <FadeInUp index={3}>
              <StepInput
                value={bio}
                onChangeText={setBio}
                placeholder="What do you study, what do you like to lend or borrow?"
                multiline
                maxLength={300}
                style={{ minHeight: 110, textAlignVertical: 'top' }}
              />
            </FadeInUp>
          </View>
        );

      case 'done':
        return (
          <View style={[styles.stepBody, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
            <Animated.View entering={FadeIn.duration(400)} style={styles.doneCircle}>
              <Ionicons name="checkmark" size={48} color="#fff" />
            </Animated.View>
            <FadeInUp index={1}><Text style={styles.welcomeTitle}>You're all set!</Text></FadeInUp>
            <FadeInUp index={2}>
              <Text style={styles.welcomeBody}>Welcome to Lendr. Let's find something to borrow.</Text>
            </FadeInUp>
          </View>
        );
    }
  }

  const optionalSteps: StepId[] = ['interests', 'dorm', 'phone', 'photo', 'payment', 'bio'];
  const isOptional = optionalSteps.includes(current);
  const isLast = current === 'done';
  const nextLabel = current === 'welcome' ? "Let's go" : current === 'bio' ? 'Review' : 'Continue';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Top bar: back + progress */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={goBack} disabled={step === 0} style={[styles.backBtn, step === 0 && { opacity: 0 }]}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text1} />
        </Pressable>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top + 50}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 24, width: "100%", maxWidth: 560, alignSelf: "center" }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* key remounts on step change so entrance animations replay */}
          <Animated.View key={current} entering={direction >= 0 ? slideFromRight : slideFromLeft} style={{ flex: 1 }}>
            {renderStep()}
          </Animated.View>
        </ScrollView>

        {/* Bottom actions */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {isLast ? (
            <Pressable style={[styles.cta, saving && { opacity: 0.6 }]} onPress={finish} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Enter Lendr</Text>}
            </Pressable>
          ) : (
            <Pressable
              style={[styles.cta, !canAdvance() && { opacity: 0.4 }]}
              onPress={goNext}
              disabled={!canAdvance()}
            >
              <Text style={styles.ctaText}>{nextLabel}</Text>
            </Pressable>
          )}

          {isOptional && !isLast && (
            <Pressable style={styles.skipBtn} onPress={goNext}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          )}
          {step === 0 && (
            <Pressable style={styles.skipBtn} onPress={signOut}>
              <Text style={styles.skipText}>Not you? Sign out</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// Slide-in transitions (Reanimated layout animations)
const slideFromRight = SlideInRight.duration(320).easing(Easing.out(Easing.cubic));
const slideFromLeft = SlideInLeft.duration(320).easing(Easing.out(Easing.cubic));

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, width: '100%', maxWidth: SHELL_MAX, alignSelf: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceSub,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.amber,
  },

  stepBody: { flex: 1 },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // Welcome / done
  welcomeAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.amberLight,
    borderWidth: 3,
    borderColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  welcomeAvatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 40,
    color: COLORS.amberDark,
  },
  welcomeTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    letterSpacing: -0.6,
    color: COLORS.inkOnboarding1,
    textAlign: 'center',
  },
  welcomeBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.inkOnboarding3,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
  },

  // Photo
  photoPick: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  photoImg: { width: '100%', height: '100%' },
  photoEdit: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.amber,
    borderWidth: 3,
    borderColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: COLORS.amber,
  },

  // Payment card mockup
  cardPreview: {
    height: 190,
    borderRadius: 22,
    backgroundColor: COLORS.inkOnboarding1,
    padding: 22,
    justifyContent: 'space-between',
  },
  cardChip: {
    width: 44,
    height: 32,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  cardNumberText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    letterSpacing: 2,
    color: '#fff',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardExpText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cardNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.text3,
    textAlign: 'center',
    marginTop: 16,
  },

  // Done
  doneCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  // Bottom
  bottomBar: {
    paddingHorizontal: 28,
    paddingTop: 12,
    gap: 6,
  },
  cta: {
    backgroundColor: COLORS.amber,
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.1,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: COLORS.text3,
  },
});
