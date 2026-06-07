import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogBox, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const isWeb = Platform.OS === 'web';

// On launch, supabase-js tries to refresh any persisted session. If the stored
// refresh token has since been invalidated server-side (after a reinstall, a
// token revocation, or the dev project being reset) the refresh fails and
// GoTrueClient._recoverAndRefresh() logs the error via console.error before
// self-healing by clearing the stale session. The recovery is correct — the only
// fallout is a full-screen red LogBox overlay on startup. Suppress just that one
// benign message so it no longer hijacks the screen; it still prints to the Metro
// console. No-op on web (react-native-web's LogBox is a stub).
LogBox.ignoreLogs(['Invalid Refresh Token']);

// anon/public key — safe to expose in the client app
// Find it in: Supabase Dashboard → Settings → API → anon public
const SUPABASE_URL = 'https://kjasxekwliifjsdfhtua.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqYXN4ZWt3bGlpZmpzZGZodHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1OTQzNTQsImV4cCI6MjA5NTE3MDM1NH0.MaiGCRSDXCFMn2QG2DekOJ6uCJJyjTLu4c9cgzxnWDg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // On web, use the browser's localStorage (the default) so detectSessionInUrl
    // and same-origin redirects work; AsyncStorage is the native store.
    storage: isWeb ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Native uses a deep-link listener to exchange the PKCE code manually
    // (see AuthContext.createSessionFromUrl). On web the OAuth redirect lands
    // back on our own origin with ?code=..., so let supabase-js exchange it.
    detectSessionInUrl: isWeb,
    flowType: 'pkce',
  },
});
