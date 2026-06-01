import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// anon/public key — safe to expose in the client app
// Find it in: Supabase Dashboard → Settings → API → anon public
const SUPABASE_URL = 'https://kjasxekwliifjsdfhtua.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqYXN4ZWt3bGlpZmpzZGZodHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1OTQzNTQsImV4cCI6MjA5NTE3MDM1NH0.MaiGCRSDXCFMn2QG2DekOJ6uCJJyjTLu4c9cgzxnWDg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
