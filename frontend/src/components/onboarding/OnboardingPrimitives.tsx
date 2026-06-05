import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, TextInputProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';

// ── Staggered fade+slide-up wrapper ───────────────────────────────────────────
// Each child of a page wraps in this; `index` staggers the entrance.
export const FadeInUp: React.FC<{ index?: number; children: React.ReactNode; style?: any }> = ({
  index = 0,
  children,
  style,
}) => {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(120 + index * 90, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 18 }],
  }));
  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
};

// ── Page heading block ────────────────────────────────────────────────────────
export const StepHeader: React.FC<{ eyebrow?: string; title: string; subtitle?: string }> = ({
  eyebrow,
  title,
  subtitle,
}) => (
  <View style={styles.headerBlock}>
    {eyebrow ? (
      <FadeInUp index={0}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
      </FadeInUp>
    ) : null}
    <FadeInUp index={1}>
      <Text style={styles.title}>{title}</Text>
    </FadeInUp>
    {subtitle ? (
      <FadeInUp index={2}>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </FadeInUp>
    ) : null}
  </View>
);

// ── Animated selectable chip ──────────────────────────────────────────────────
export const SelectChip: React.FC<{ label: string; selected: boolean; onPress: () => void }> = ({
  label,
  selected,
  onPress,
}) => {
  const sel = useSharedValue(selected ? 1 : 0);
  const press = useSharedValue(0);
  useEffect(() => {
    sel.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected]);

  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(sel.value, [0, 1], [COLORS.surface, COLORS.amber]),
    borderColor: interpolateColor(sel.value, [0, 1], [COLORS.border, COLORS.amber]),
    transform: [{ scale: 1 - press.value * 0.05 }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(sel.value, [0, 1], [COLORS.text2, '#FFFFFF']),
  }));

  return (
    <Pressable
      onPressIn={() => (press.value = withTiming(1, { duration: 90 }))}
      onPressOut={() => (press.value = withTiming(0, { duration: 120 }))}
      onPress={onPress}
    >
      <Animated.View style={[styles.chip, animStyle]}>
        <Animated.Text style={[styles.chipText, textStyle]}>{label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
};

// ── Themed text input ─────────────────────────────────────────────────────────
export const StepInput: React.FC<TextInputProps & { focusedColor?: string }> = (props) => {
  const focus = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.value, [0, 1], [COLORS.borderInput, COLORS.amber]),
    backgroundColor: interpolateColor(focus.value, [0, 1], [COLORS.surfaceInput, '#FFFFFF']),
  }));
  return (
    <Animated.View style={[styles.inputWrap, animStyle]}>
      <TextInput
        placeholderTextColor={COLORS.text3}
        {...props}
        style={[styles.input, props.style]}
        onFocus={(e) => { focus.value = withTiming(1, { duration: 160 }); props.onFocus?.(e); }}
        onBlur={(e) => { focus.value = withTiming(0, { duration: 160 }); props.onBlur?.(e); }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerBlock: { marginBottom: 28 },
  eyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: COLORS.amber,
    marginBottom: 10,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: COLORS.inkOnboarding1,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.inkOnboarding3,
    marginTop: 10,
  },
  chip: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  chipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  inputWrap: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: COLORS.inkOnboarding1,
    paddingVertical: 16,
  },
});
