import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { updateUserSchema } from '../schemas';
import { pool } from '../db/pool';

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

export { router as usersRouter };
