import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { useResponsive } from '../lib/responsive';

// Each slide uses real product photos in a 2×2 collage on a surface-sub tile.
// Per the rebrand, emoji are retired as primary visual content.
const SLIDES = [
  {
    photos: [
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=300&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80&auto=format&fit=crop',
    ],
    title: 'Borrow What You\nNeed, When You Need It',
    body: 'From textbooks to tech, find everything you need for campus life without buying it outright.',
  },
  {
    photos: [
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=300&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=300&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&q=80&auto=format&fit=crop',
    ],
    title: 'Complete Collection\nOf Campus Items',
    body: 'Sports gear, outdoor equipment, and more — all listed by students just like you.',
  },
  {
    photos: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=300&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=300&q=80&auto=format&fit=crop',
    ],
    title: 'Find The Most Suitable\nItem For You',
    body: 'Browse by category, location, or price. Renting has never been this easy on campus.',
  },
];

function Collage({ photos }: { photos: string[] }) {
  return (
    <View style={styles.photoGrid}>
      {photos.map((src, j) => (
        <View key={j} style={styles.photoCell}>
          <Image source={{ uri: src }} style={styles.photoImg} />
        </View>
      ))}
    </View>
  );
}

export const OnboardingScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const { width } = useWindowDimensions();
  const { isDesktop } = useResponsive();
  // Cap the mobile pager to a phone-like column so slides stay legible.
  const slideW = Math.min(width, 480);

  function handleScroll(e: any) {
    const x = e.nativeEvent.contentOffset.x;
    setPage(Math.round(x / slideW));
  }

  // ── Desktop: split-screen hero (visual left, content right) ──
  if (isDesktop) {
    const slide = SLIDES[page];
    const isLast = page === SLIDES.length - 1;
    return (
      <View style={styles.deskRow}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.deskVisual}>
          <View style={styles.deskCollage}>
            <Collage photos={slide.photos} />
          </View>
        </View>

        <View style={styles.deskContentPane}>
          <View style={styles.deskContentInner}>
            <View style={styles.brandRow}>
              <Text style={styles.brand}>Lendr</Text>
              <Text style={styles.brandDot}>.</Text>
            </View>
            <Text style={styles.deskTitle}>{slide.title.replace('\n', ' ')}</Text>
            <Text style={styles.deskBody}>{slide.body}</Text>

            <View style={styles.deskDots}>
              {SLIDES.map((_, i) => (
                <Pressable key={i} onPress={() => setPage(i)}>
                  <View style={[styles.dot, i === page && styles.dotActive]} />
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.primaryBtn}
              onPress={() =>
                isLast ? navigation.navigate('CreateAccount') : setPage(p => Math.min(p + 1, SLIDES.length - 1))
              }
            >
              <Text style={styles.primaryBtnText}>{isLast ? 'Get Started' : 'Next'}</Text>
            </Pressable>

            {!isLast && (
              <Pressable style={styles.skip} onPress={() => navigation.navigate('CreateAccount')}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ── Mobile: swipe pager ──
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1, alignSelf: 'center', width: slideW }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: slideW }]}>
            <View style={styles.illustration}>
              <Collage photos={slide.photos} />
            </View>

            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      <View style={[styles.buttons, { paddingBottom: Math.max(insets.bottom, 28) }]}>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('CreateAccount')}
        >
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
  },

  illustration: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 320,
    backgroundColor: COLORS.surfaceSub,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    overflow: 'hidden',
    padding: 18,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '85%',
    aspectRatio: 1,
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCell: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  photoImg: { width: '100%', height: '100%' },

  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: COLORS.inkOnboarding1,
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.inkOnboarding3,
    textAlign: 'center',
    lineHeight: 22,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 24,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E0E0EA',
  },
  dotActive: {
    width: 20,
    backgroundColor: COLORS.amber,
  },

  buttons: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 28,
    gap: 16,
  },
  primaryBtn: {
    backgroundColor: COLORS.amber,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.1,
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
    padding: 64,
  },
  deskCollage: {
    width: '100%',
    maxWidth: 520,
    aspectRatio: 1,
  },
  deskContentPane: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  deskContentInner: {
    width: '100%',
    maxWidth: 440,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 28,
  },
  brand: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    color: COLORS.text1,
    letterSpacing: -1,
  },
  brandDot: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    color: COLORS.green,
  },
  deskTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: -0.8,
    color: COLORS.inkOnboarding1,
    marginBottom: 16,
  },
  deskBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.text2,
    marginBottom: 32,
  },
  deskDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 32,
  },
  skip: {
    marginTop: 16,
    alignItems: 'center',
  },
  skipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: COLORS.text3,
  },
});
