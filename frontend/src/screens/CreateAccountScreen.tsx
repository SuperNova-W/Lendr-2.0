import React, { useState } from 'react';
import { showAlert } from "../lib/alert";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { COLORS } from '../theme/colors';
import { SPLASH_PHOTOS } from '../data/dummyData';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../lib/responsive';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const FEATURES: { icon: IoniconsName; text: string }[] = [
  { icon: 'pricetags-outline', text: 'Borrow gear, books & tech for less' },
  { icon: 'people-outline',    text: 'Verified students on your campus' },
  { icon: 'flash-outline',     text: 'List something in under a minute' },
];

export const CreateAccountScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isDesktop } = useResponsive();
  const { signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Hero collage sizing — two columns that fill the width with a gutter.
  const gutter = 12;
  const colW = (width - 48 - gutter) / 2;

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      showAlert('Sign in failed', err?.message ?? 'Something went wrong');
    } finally {
      setGoogleLoading(false);
    }
  }

  // Shared CTA block (brand → features → Google button → legal).
  const cta = (
    <>
      <View style={styles.brandRow}>
        <Text style={styles.logo}>Lendr</Text>
        <Text style={styles.logoDot}>.</Text>
      </View>

      <Text style={styles.headline}>The campus marketplace for borrowing.</Text>

      <View style={styles.features}>
        {FEATURES.map(f => (
          <View key={f.text} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon} size={16} color={COLORS.amber} />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.googleBtn, pressed && styles.googleBtnPressed]}
        onPress={handleGoogleSignIn}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <View style={styles.googleGlyph}>
              <Ionicons name="logo-google" size={16} color={COLORS.text1} />
            </View>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </>
        )}
      </Pressable>

      <View style={styles.eduRow}>
        <Ionicons name="shield-checkmark" size={13} color={COLORS.green} />
        <Text style={styles.eduText}>Students only · verified by your .edu email</Text>
      </View>

      <Text style={styles.legal}>
        By continuing you agree to our{' '}
        <Text style={styles.legalLink} onPress={() => navigation.navigate('Legal', { kind: 'terms' })}>
          Terms
        </Text>{' '}
        and{' '}
        <Text style={styles.legalLink} onPress={() => navigation.navigate('Legal', { kind: 'privacy' })}>
          Privacy Policy
        </Text>
        .
      </Text>
    </>
  );

  // ── Desktop: split-screen hero (photo collage left, sign-in right) ──
  if (isDesktop) {
    return (
      <View style={styles.deskRow}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.deskVisual}>
          <View style={styles.deskHero}>
            <View style={[styles.heroCol, { flex: 1 }]}>
              <Image source={{ uri: SPLASH_PHOTOS[0] }} style={[styles.heroImg, { height: 210 }]} />
              <Image source={{ uri: SPLASH_PHOTOS[2] }} style={[styles.heroImg, { height: 150 }]} />
              <Image source={{ uri: SPLASH_PHOTOS[4] }} style={[styles.heroImg, { height: 180 }]} />
            </View>
            <View style={[styles.heroCol, { flex: 1, marginTop: 40 }]}>
              <Image source={{ uri: SPLASH_PHOTOS[1] }} style={[styles.heroImg, { height: 170 }]} />
              <Image source={{ uri: SPLASH_PHOTOS[3] }} style={[styles.heroImg, { height: 210 }]} />
              <Image source={{ uri: SPLASH_PHOTOS[5] }} style={[styles.heroImg, { height: 150 }]} />
            </View>
          </View>
        </View>

        <View style={styles.deskContentPane}>
          <View style={styles.deskContentInner}>{cta}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Hero collage ── */}
      <Animated.View
        entering={FadeIn.duration(600)}
        style={[styles.hero, { paddingTop: insets.top }]}
      >
        <View style={[styles.heroCol, { width: colW }]}>
          <Image source={{ uri: SPLASH_PHOTOS[0] }} style={[styles.heroImg, { height: 160 }]} />
          <Image source={{ uri: SPLASH_PHOTOS[2] }} style={[styles.heroImg, { height: 120 }]} />
          <Image source={{ uri: SPLASH_PHOTOS[4] }} style={[styles.heroImg, { height: 140 }]} />
        </View>
        <View style={[styles.heroCol, { width: colW, marginTop: 28 }]}>
          <Image source={{ uri: SPLASH_PHOTOS[1] }} style={[styles.heroImg, { height: 130 }]} />
          <Image source={{ uri: SPLASH_PHOTOS[3] }} style={[styles.heroImg, { height: 160 }]} />
          <Image source={{ uri: SPLASH_PHOTOS[5] }} style={[styles.heroImg, { height: 120 }]} />
        </View>
      </Animated.View>

      {/* ── Bottom sheet ── */}
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Animated.View entering={FadeInUp.delay(150).duration(500)} style={styles.brandRow}>
          <Text style={styles.logo}>Lendr</Text>
          <Text style={styles.logoDot}>.</Text>
        </Animated.View>

        <Animated.Text entering={FadeInUp.delay(220).duration(500)} style={styles.headline}>
          The campus marketplace for borrowing.
        </Animated.Text>

        {/* Feature highlights */}
        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.text}
              entering={FadeInUp.delay(300 + i * 80).duration(450)}
              style={styles.featureRow}
            >
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={16} color={COLORS.amber} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </Animated.View>
          ))}
        </View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(560).duration(500)}>
          <Pressable
            style={({ pressed }) => [styles.googleBtn, pressed && styles.googleBtnPressed]}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <View style={styles.googleGlyph}>
                  <Ionicons name="logo-google" size={16} color={COLORS.text1} />
                </View>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          <View style={styles.eduRow}>
            <Ionicons name="shield-checkmark" size={13} color={COLORS.green} />
            <Text style={styles.eduText}>Students only · verified by your .edu email</Text>
          </View>

          <Text style={styles.legal}>
            By continuing you agree to our{' '}
            <Text style={styles.legalLink} onPress={() => navigation.navigate('Legal', { kind: 'terms' })}>
              Terms
            </Text>{' '}
            and{' '}
            <Text style={styles.legalLink} onPress={() => navigation.navigate('Legal', { kind: 'privacy' })}>
              Privacy Policy
            </Text>
            .
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Hero
  hero: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  heroCol: {
    gap: 12,
  },
  heroImg: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSub,
  },

  // Sheet
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 28,
    shadowColor: '#0F1115',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 20,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logo: {
    fontFamily: 'Inter_700Bold',
    fontSize: 34,
    color: COLORS.text1,
    letterSpacing: -1.2,
  },
  logoDot: {
    fontFamily: 'Inter_700Bold',
    fontSize: 34,
    color: COLORS.green,
  },
  headline: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    lineHeight: 29,
    letterSpacing: -0.5,
    color: COLORS.inkOnboarding1,
    marginTop: 6,
    marginBottom: 22,
  },

  features: {
    gap: 14,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14.5,
    color: COLORS.text2,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.amber,
    borderRadius: 999,
    paddingVertical: 17,
    shadowColor: COLORS.amber,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  googleBtnPressed: {
    transform: [{ scale: 0.985 }],
    shadowOpacity: 0.12,
  },
  googleGlyph: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },

  eduRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  eduText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12.5,
    color: COLORS.text3,
  },

  legal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.inkOnboarding3,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  legalLink: {
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.amber,
  },

  // ── Desktop split-hero ──
  deskRow: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },
  deskVisual: {
    flex: 1.1,
    backgroundColor: COLORS.surfaceSub,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 56,
    overflow: 'hidden',
  },
  deskHero: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    maxWidth: 460,
  },
  deskContentPane: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  deskContentInner: {
    width: '100%',
    maxWidth: 420,
  },
});
