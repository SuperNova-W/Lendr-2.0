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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';

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
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start borrowing with your new account</Text>
        </View>

        <View style={styles.form}>
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
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={COLORS.text2}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.primaryBtnText}>Create Account</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or using other method</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialButtons}>
          <Pressable style={styles.socialBtn}>
            <Ionicons name="logo-google" size={18} color="#EA4335" />
            <Text style={styles.socialBtnText}>Sign Up with Google</Text>
          </Pressable>

          <Pressable style={styles.socialBtn}>
            <Ionicons name="logo-apple" size={18} color={COLORS.text1} />
            <Text style={styles.socialBtnText}>Sign Up with Apple</Text>
          </Pressable>
        </View>

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

  titleBlock: {
    marginBottom: 36,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: COLORS.inkOnboarding1,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.inkOnboarding3,
  },

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
    color: COLORS.inkOnboarding1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderInput,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: COLORS.surfaceInput,
    gap: 10,
  },
  inputFocused: {
    borderColor: COLORS.amber,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.inkOnboarding1,
  },
  eyeBtn: {
    padding: 2,
  },

  primaryBtn: {
    backgroundColor: COLORS.amber,
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

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderInput,
  },
  dividerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.inkOnboarding3,
  },

  socialButtons: {
    gap: 12,
    marginBottom: 32,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderInput,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  socialBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: COLORS.inkOnboarding1,
  },

  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.inkOnboarding3,
  },
  signinLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.amber,
  },
});
