import { createClient } from '@supabase/supabase-js';

// Service-role client — full DB access, bypasses RLS.
// Only used server-side. Never expose SUPABASE_SERVICE_ROLE_KEY to the client app.
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
