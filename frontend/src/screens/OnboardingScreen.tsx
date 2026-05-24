import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIMARY = '#4F46E5';
const { width: SCREEN_W } = Dimensions.get('window');

const SLIDES = [
  {
    emojis: ['📚', '🖥️', '📐', '🎒', '📷', '🎧'],
    title: 'Borrow What You\nNeed, When You Need It',
    body: 'From textbooks to tech, find everything you need for campus life without buying it outright.',
  },
  {
    emojis: ['🚲', '🎾', '🏕️', '⚽', '🎿', '🛹'],
    title: 'Complete Collection\nOf Campus Items',
    body: 'Sports gear, outdoor equipment, and more — all listed by students just like you.',
  },
  {
    emojis: ['👔', '👗', '📷', '💼', '🎩', '✨'],
    title: 'Find The Most Suitable\nItem For You',
    body: 'Browse by category, location, or price. Renting has never been this easy on campus.',
  },
];

export const OnboardingScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  function handleScroll(e: any) {
    const x = e.nativeEvent.contentOffset.x;
    const newPage = Math.round(x / SCREEN_W);
    setPage(newPage);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Slides ── */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: SCREEN_W }]}>
            {/* Illustration */}
            <View style={styles.illustration}>
              <View style={styles.emojiGrid}>
                {slide.emojis.map((e, j) => (
                  <View key={j} style={styles.emojiCell}>
                    <Text style={styles.emojiText}>{e}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Text */}
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* ── Dots ── */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      {/* ── Buttons ── */}
      <View style={[styles.buttons, { paddingBottom: Math.max(insets.bottom, 28) }]}>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('CreateAccount')}
        >
          <Text style={styles.primaryBtnText}>Create Account</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.secondaryBtnText}>Already Have an Account</Text>
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

  // Illustration box
  illustration: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 320,
    backgroundColor: '#F4F4F8',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    overflow: 'hidden',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '72%',
    gap: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiCell: {
    width: 64,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  emojiText: {
    fontSize: 30,
  },

  // Slide text
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#1A1A2E',
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#9B9BAA',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Pagination dots
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
    backgroundColor: PRIMARY,
  },

  // Buttons
  buttons: {
    paddingHorizontal: 28,
    gap: 16,
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
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
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  secondaryBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: PRIMARY,
  },
});
