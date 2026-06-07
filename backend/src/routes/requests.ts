import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { createRequestSchema, updateRequestSchema } from '../schemas';
import { pool } from '../db/pool';
import { ensureConversationForRequest } from '../lib/messaging';

const router = Router();
router.use(requireAuth);

// POST /requests  — borrower creates a request
//
// Runs in a transaction so the request and its conversation are created
// atomically. If the borrower included an opening `message`, it is both kept on
// the request (backward compatible) and seeded as the first message in the new
// conversation.
router.post('/', async (req, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const data       = createRequestSchema.parse(req.body);
    const borrowerId = (req as AuthRequest).userId;

    await client.query('BEGIN');

    // Fetch item to get owner + price
    const itemRes = await client.query(
      'SELECT * FROM items WHERE id = $1 AND is_available = true',
      [data.item_id]
    );
    if (!itemRes.rows[0]) throw new AppError(404, 'Item not found or unavailable');
    const item = itemRes.rows[0];
    if (item.owner_id === borrowerId) throw new AppError(400, 'Cannot borrow your own item');

    // Calculate total price
    const start     = new Date(data.start_date);
    const end       = new Date(data.end_date);
    const days      = Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
    if (days <= 0) throw new AppError(400, 'end_date must be after start_date');
    const totalPrice = (item.price_per_day * days).toFixed(2);

    const { rows } = await client.query(
      `INSERT INTO requests
         (item_id, borrower_id, owner_id, start_date, end_date, total_price, message)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [data.item_id, borrowerId, item.owner_id,
       data.start_date, data.end_date, totalPrice, data.message ?? null]
    );
    const request = rows[0];

    // Open the conversation for this request, seeding the opening note (if any).
    await ensureConversationForRequest(client, request, { seedFirstMessage: true });

    await client.query('COMMIT');
    res.status(201).json(request);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// GET /requests/mine  — requests I've sent as borrower
router.get('/mine', async (req, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, i.title AS item_title, i.photos AS item_photos,
              u.name AS owner_name, u.avatar_url AS owner_avatar
       FROM requests r
       JOIN items i ON i.id = r.item_id
       JOIN users u ON u.id = r.owner_id
       WHERE r.borrower_id = $1 ORDER BY r.created_at DESC`,
      [(req as AuthRequest).userId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /requests/incoming  — requests on items I own
router.get('/incoming', async (req, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, i.title AS item_title, i.photos AS item_photos,
              u.name AS borrower_name, u.avatar_url AS borrower_avatar
       FROM requests r
       JOIN items i  ON i.id = r.item_id
       JOIN users u  ON u.id = r.borrower_id
       WHERE r.owner_id = $1 ORDER BY r.created_at DESC`,
      [(req as AuthRequest).userId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// PATCH /requests/:id  — approve / decline / return / cancel
router.patch('/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const { status } = updateRequestSchema.parse(req.body);
    const userId     = (req as unknown as AuthRequest).userId;

    const reqRes = await pool.query('SELECT * FROM requests WHERE id = $1', [req.params.id]);
    if (!reqRes.rows[0]) throw new AppError(404, 'Request not found');
    const request = reqRes.rows[0];

    // Permission rules
    const isOwner    = request.owner_id    === userId;
    const isBorrower = request.borrower_id === userId;

    if (['approved','declined'].includes(status) && !isOwner)    throw new AppError(403, 'Only the owner can approve or decline');
    if (status === 'cancelled'                    && !isBorrower) throw new AppError(403, 'Only the borrower can cancel');
    if (status === 'returned'                     && !isOwner)    throw new AppError(403, 'Only the owner can mark as returned');

    const { rows } = await pool.query(
      `UPDATE requests SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );

    // Re-open item availability when request ends
    if (status === 'returned' || status === 'declined' || status === 'cancelled') {
      await pool.query('UPDATE items SET is_available = true WHERE id = $1', [request.item_id]);
    }
    if (status === 'approved') {
      await pool.query('UPDATE items SET is_available = false WHERE id = $1', [request.item_id]);
    }

    res.json(rows[0]);
  } catch (err) { next(err); }
});

export { router as requestsRouter };
