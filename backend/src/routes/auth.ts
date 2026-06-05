import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { pool } from '../db/pool';
import { isCollegeEmail } from '../lib/eduEmail';

const router = Router();

// POST /auth/sync
//
// The mobile app signs in with Google via Supabase Auth (client-side).
// Supabase issues a JWT. The app then calls this endpoint once — we upsert
// the user into our own `users` table so the rest of the API works normally.
//
// Call this immediately after every sign-in, before any other request.
router.post('/sync', requireAuth, async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).userId;

    // Fetch the full user profile from Supabase Auth
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !user) { res.status(401).json({ error: 'User not found in Supabase Auth' }); return; }

    const { email, user_metadata } = user;

    // College-email gate — accountability requirement. Reject non-academic emails.
    // We intentionally do NOT delete the auth user here: public.users.id cascades
    // from auth.users, so deleting could wipe a previously-valid user's data. A
    // rejected auth user is harmless — they can't pass sync, so they get nothing.
    if (!isCollegeEmail(email)) {
      res.status(403).json({
        error: 'Lendr is only open to students. Please sign in with your college (.edu) email address.',
        code: 'NOT_COLLEGE_EMAIL',
      });
      return;
    }

    // id (UUID) and google_id (TEXT) get separate params so Postgres can deduce
    // each column's type independently — reusing one $1 triggers 42P08.
    const { rows } = await pool.query(
      `INSERT INTO users (id, google_id, email, name, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
         SET name       = EXCLUDED.name,
             avatar_url = EXCLUDED.avatar_url,
             updated_at = now()
       RETURNING *`,
      [userId, userId, email, user_metadata?.full_name ?? email, user_metadata?.avatar_url ?? null]
    );

    const u = rows[0];
    // "Onboarded" = they've completed the required profile (campus set).
    res.json({ ...u, onboarded: Boolean(u.campus) });
  } catch (err) { next(err); }
});

export { router as authRouter };
