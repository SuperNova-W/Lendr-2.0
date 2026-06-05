import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { updateUserSchema } from '../schemas';
import { pool } from '../db/pool';
import { supabase } from '../lib/supabase';

const router = Router();
router.use(requireAuth);

// GET /users/me
router.get('/me', async (req, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [(req as AuthRequest).userId]
    );
    if (!rows[0]) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// PATCH /users/me
router.patch('/me', async (req, res: Response, next: NextFunction) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const fields = Object.entries(data).filter(([, v]) => v !== undefined);
    if (fields.length === 0) { res.status(400).json({ error: 'Nothing to update' }); return; }

    const setClauses = fields.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values     = fields.map(([, v]) => v);

    const { rows } = await pool.query(
      `UPDATE users SET ${setClauses}, updated_at = now() WHERE id = $1 RETURNING *`,
      [(req as AuthRequest).userId, ...values]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /users/me — permanently delete the account.
// Removing the auth user cascades to public.users (and their items/requests
// via the FK ON DELETE CASCADE), so this wipes all of the user's data.
router.delete('/me', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    res.status(204).send();
  } catch (err) { next(err); }
});

export { router as usersRouter };
