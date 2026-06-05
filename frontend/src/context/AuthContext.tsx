import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Session } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from '../lib/supabase';
import { syncUser, ApiError } from '../lib/api';

// Required so the in-app browser closes itself after the OAuth redirect
WebBrowser.maybeCompleteAuthSession();

// In Expo Go this resolves to exp://<your-lan-ip>:8081 — add it to Supabase's
// Authentication → URL Configuration → Redirect URLs (logged below on sign-in).
const redirectTo = makeRedirectUri();

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  needsOnboarding: boolean;
  completeOnboarding: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Run the college-email gate + onboarding check. Returns false if rejected.
  async function syncAndGate(accessToken: string): Promise<boolean> {
    try {
      const result = await syncUser(accessToken);
      setNeedsOnboarding(!result.onboarded);
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NOT_COLLEGE_EMAIL') {
        // Not a student — the backend already removed the auth user; sign out locally.
        await supabase.auth.signOut();
        Alert.alert('Students only', err.message);
        return false;
      }
      console.error('sync failed', err);
      return true; // transient error — don't block an already-valid session
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) await syncAndGate(session.access_token);
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Catch the redirect if the app was cold-started by the deep link
  useEffect(() => {
    const { remove } = Linking.addEventListener('url', ({ url }) => {
      createSessionFromUrl(url).catch(console.error);
    });
    return remove;
  }, []);

  // PKCE flow: the redirect comes back as ?code=... which we exchange for a session
  async function createSessionFromUrl(url: string) {
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode) throw new Error(errorCode);
    if (!params.code) return null;

    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    if (data.session) {
      const allowed = await syncAndGate(data.session.access_token);
      if (!allowed) return null; // rejected non-college email — session already cleared
    }
    return data.session;
  }

  async function signInWithGoogle() {
    console.log('OAuth redirectTo (add this to Supabase allow-list):', redirectTo);

    // On web, let supabase redirect the whole page to Google; the OAuth callback
    // lands back on our origin with ?code=... and supabase-js (detectSessionInUrl)
    // exchanges it on reload, firing onAuthStateChange.
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
      return;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (error || !data.url) throw error ?? new Error('No auth URL returned');

    // openAuthSessionAsync returns the redirect URL directly when it matches our scheme
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type === 'success') {
      await createSessionFromUrl(res.url);
    }
  }

  async function signOut() {
    setNeedsOnboarding(false);
    await supabase.auth.signOut();
  }

  function completeOnboarding() {
    setNeedsOnboarding(false);
  }

  return (
    <AuthContext.Provider
      value={{ session, loading, needsOnboarding, completeOnboarding, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
