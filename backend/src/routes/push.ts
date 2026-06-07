import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { registerPushTokenSchema, deletePushTokenSchema } from '../schemas';
import { pool } from '../db/pool';

const router = Router();
router.use(requireAuth);

// POST /push/register — store (or refresh) a device push token for the current
// user. Idempotent on (user_id, token). Tokens are only ever associated with the
// authenticated user; the body never carries a user id.
router.post('/register', async (req, res: Response, next: NextFunction) => {
  try {
    const { token, platform } = registerPushTokenSchema.parse(req.body);
    const userId = (req as AuthRequest).userId;

    const { rows } = await pool.query(
      `INSERT INTO device_push_tokens (user_id, token, platform)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, token)
         DO UPDATE SET platform = EXCLUDED.platform, updated_at = now()
       RETURNING id, user_id, token, platform, created_at, updated_at`,
      [userId, token, platform]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /push/token — drop a token (e.g. on sign-out). Scoped to the current
// user so one account can't delete another's token.
router.delete('/token', async (req, res: Response, next: NextFunction) => {
  try {
    const { token } = deletePushTokenSchema.parse(req.body);
    const userId = (req as AuthRequest).userId;

    await pool.query(
      'DELETE FROM device_push_tokens WHERE user_id = $1 AND token = $2',
      [userId, token]
    );
    res.status(204).send();
  } catch (err) { next(err); }
});

export { router as pushRouter };
