import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIMARY = '#4F46E5';

export const CreateAccountScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 32) }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Title ── */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start learning with create your account</Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.form}>

          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={[styles.inputWrap, focusedField === 'username' && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Create your username"
                placeholderTextColor="#C4C4D4"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Email / Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email or Phone Number</Text>
            <View style={[styles.inputWrap, focusedField === 'contact' && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email or phone number"
                placeholderTextColor="#C4C4D4"
                value={contact}
                onChangeText={setContact}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocusedField('contact')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={[styles.inputWrap, focusedField === 'password' && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Create your password"
                placeholderTextColor="#C4C4D4"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                <Text style={styles.eyeToggle}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── Primary CTA ── */}
        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.primaryBtnText}>Create Account</Text>
        </Pressable>

        {/* ── Divider ── */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or using other method</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── Social Buttons ── */}
        <View style={styles.socialButtons}>
          <Pressable style={styles.socialBtn}>
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialBtnText}>Sign Up with Google</Text>
          </Pressable>

          <Pressable style={styles.socialBtn}>
            <Text style={[styles.socialIcon, styles.fbIcon]}>f</Text>
            <Text style={styles.socialBtnText}>Sign Up with Facebook</Text>
          </Pressable>
        </View>

        {/* ── Sign In link ── */}
        <Pressable style={styles.signinRow} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.signinText}>Already have an account? </Text>
          <Text style={styles.signinLink}>Sign In</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 32,
  },

  // Title block
  titleBlock: {
    marginBottom: 36,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: '#1A1A2E',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#9B9BAA',
  },

  // Form
  form: {
    gap: 20,
    marginBottom: 32,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#1A1A2E',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#FAFAFC',
    gap: 10,
  },
  inputFocused: {
    borderColor: PRIMARY,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#1A1A2E',
  },
  eyeBtn: {
    padding: 2,
  },
  eyeToggle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: PRIMARY,
  },

  // Primary button
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 28,
  },
  primaryBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8F0',
  },
  dividerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#9B9BAA',
  },

  // Social buttons
  socialButtons: {
    gap: 12,
    marginBottom: 32,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E8F0',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  socialIcon: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#EA4335',
    width: 24,
    textAlign: 'center',
  },
  fbIcon: {
    color: '#1877F2',
  },
  socialBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#1A1A2E',
  },

  // Sign in row
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#9B9BAA',
  },
  signinLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: PRIMARY,
  },
});
