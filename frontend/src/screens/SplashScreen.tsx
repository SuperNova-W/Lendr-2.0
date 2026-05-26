import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Animated,
  Easing,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { SPLASH_PHOTOS } from '../data/dummyData';

// Tile positions mirror the design's hand-arranged mosaic — varied sizes,
// rotations, and delays so the entrance feels composed rather than gridded.
const TILES = [
  { xPct: -0.02, yPct: 0.08, size: 110, rot: -8,  delay: 120 },
  { xPct:  0.64, yPct: 0.04, size: 96,  rot:  6,  delay: 190 },
  { xPct:  0.08, yPct: 0.64, size: 86,  rot:  5,  delay: 260 },
  { xPct:  0.70, yPct: 0.70, size: 100, rot: -7,  delay: 330 },
  { xPct:  0.78, yPct: 0.38, size: 72,  rot: 11,  delay: 400 },
  { xPct: -0.04, yPct: 0.38, size: 78,  rot: -4,  delay: 470 },
  { xPct:  0.36, yPct: 0.78, size: 64,  rot:  8,  delay: 540 },
  { xPct:  0.38, yPct: -0.02, size: 64, rot: -6,  delay: 610 },
];

const SPLASH_DURATION = 3600;
const TILE_IN_MS    = 700;
const MARK_DELAY    = 700;
const MARK_DURATION = 700;
const DOT_DELAY     = 1350;
const DOT_DURATION  = 520;
const LINE_DELAY    = 1600;
const LINE_DURATION = 600;
const HINT_DELAY    = 2200;
const HINT_DURATION = 500;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const SplashScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  // One Animated.Value per element drives a 0→1 progress.
  const tileAnims = useRef(TILES.map(() => new Animated.Value(0))).current;
  const markAnim  = useRef(new Animated.Value(0)).current;
  const dotAnim   = useRef(new Animated.Value(0)).current;
  const lineAnim  = useRef(new Animated.Value(0)).current;
  const hintAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    TILES.forEach((tile, i) => {
      animations.push(
        Animated.timing(tileAnims[i], {
          toValue: 1,
          duration: TILE_IN_MS,
          delay: tile.delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      );
    });

    animations.push(
      Animated.timing(markAnim, {
        toValue: 1,
        duration: MARK_DURATION,
        delay: MARK_DELAY,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(dotAnim, {
        toValue: 1,
        delay: DOT_DELAY,
        friction: 5,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.timing(lineAnim, {
        toValue: 1,
        duration: LINE_DURATION,
        delay: LINE_DELAY,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(hintAnim, {
        toValue: 1,
        duration: HINT_DURATION,
        delay: HINT_DELAY,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );

    Animated.parallel(animations).start();

    const t = setTimeout(() => navigation.replace('Onboarding'), SPLASH_DURATION);
    return () => clearTimeout(t);
  }, []);

  return (
    <Pressable
      style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 32) }]}
      onPress={() => navigation.replace('Onboarding')}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Drifting photo mosaic */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {TILES.map((tile, i) => {
          const progress = tileAnims[i];
          const translateY = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [36, 0],
          });
          const scale = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.92, 1],
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.tile,
                {
                  width: tile.size,
                  height: tile.size,
                  left: tile.xPct * SCREEN_W,
                  top: tile.yPct * SCREEN_H,
                  borderRadius: tile.size > 90 ? 22 : 18,
                  opacity: progress,
                  transform: [
                    { translateY },
                    { scale },
                    { rotate: `${tile.rot}deg` },
                  ],
                },
              ]}
            >
              <Image source={{ uri: SPLASH_PHOTOS[i] }} style={styles.tileImg} />
            </Animated.View>
          );
        })}
      </View>

      {/* Wordmark + tagline (centered) */}
      <View style={styles.center} pointerEvents="none">
        <View style={styles.logoRow}>
          <Animated.Text
            style={[
              styles.logo,
              {
                opacity: markAnim,
                transform: [
                  {
                    translateY: markAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            Lendr
          </Animated.Text>
          <Animated.Text
            style={[
              styles.logoDot,
              {
                opacity: dotAnim,
                transform: [
                  {
                    scale: dotAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.2, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            .
          </Animated.Text>
        </View>

        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: lineAnim,
              transform: [
                {
                  translateY: lineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [6, 0],
                  }),
                },
              ],
            },
          ]}
        >
          Borrow anything, right from campus.
        </Animated.Text>
      </View>

      {/* Bottom hint */}
      <Animated.View
        style={[
          styles.hint,
          {
            opacity: hintAnim,
            transform: [
              {
                translateY: hintAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [6, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.hintLabel}>Tap to continue</Text>
        <Text style={styles.version}>v0.0.1</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logo: {
    fontFamily: 'Inter_700Bold',
    fontSize: 76,
    color: COLORS.text1,
    letterSpacing: -2.6,
    lineHeight: 80,
  },
  logoDot: {
    fontFamily: 'Inter_700Bold',
    fontSize: 76,
    color: COLORS.green,
    lineHeight: 80,
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: COLORS.text2,
    marginTop: 18,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 32,
    alignItems: 'center',
    gap: 14,
  },
  hintLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: COLORS.text3,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  version: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: COLORS.text3,
    opacity: 0.6,
  },
  tile: {
    position: 'absolute',
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#0F1115',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  tileImg: {
    width: '100%',
    height: '100%',
  },
});
