import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { pool } from '../db/pool';

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

    const { rows } = await pool.query(
      `INSERT INTO users (id, google_id, email, name, avatar_url)
       VALUES ($1, $1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE
         SET name       = EXCLUDED.name,
             avatar_url = EXCLUDED.avatar_url,
             updated_at = now()
       RETURNING *`,
      [userId, email, user_metadata?.full_name ?? email, user_metadata?.avatar_url ?? null]
    );

    res.json(rows[0]);
  } catch (err) { next(err); }
});

export { router as authRouter };
