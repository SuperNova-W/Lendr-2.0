import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { createItemSchema, updateItemSchema } from '../schemas';
import { pool } from '../db/pool';

const router = Router();

// GET /items?campus=UCLA&category=Tech&available=true
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campus, category, available } = req.query;
    const conditions: string[] = [];
    const values: unknown[]    = [];

    if (campus)    { conditions.push(`campus = $${values.push(campus)}`); }
    if (category)  { conditions.push(`category = $${values.push(category)}::item_category`); }
    if (available) { conditions.push(`is_available = $${values.push(available === 'true')}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT i.*, u.name AS owner_name, u.avatar_url AS owner_avatar, u.rating_avg AS owner_rating
       FROM items i JOIN users u ON u.id = i.owner_id
       ${where} ORDER BY i.created_at DESC LIMIT 50`,
      values
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /items/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, u.name AS owner_name, u.avatar_url AS owner_avatar, u.rating_avg AS owner_rating
       FROM items i JOIN users u ON u.id = i.owner_id WHERE i.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) throw new AppError(404, 'Item not found');
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /items  (auth required)
router.post('/', requireAuth, async (req, res: Response, next: NextFunction) => {
  try {
    const data = createItemSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO items (owner_id, title, description, category, price_per_day, photos, campus)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        (req as AuthRequest).userId,
        data.title, data.description ?? null,
        data.category, data.price_per_day,
        data.photos, data.campus,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PATCH /items/:id  (auth + must be owner)
router.patch('/:id', requireAuth, async (req, res: Response, next: NextFunction) => {
  try {
    const data   = updateItemSchema.parse(req.body);
    const userId = (req as AuthRequest).userId;

    const existing = await pool.query('SELECT owner_id FROM items WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) throw new AppError(404, 'Item not found');
    if (existing.rows[0].owner_id !== userId) throw new AppError(403, 'Not your item');

    const fields = Object.entries(data).filter(([, v]) => v !== undefined);
    if (!fields.length) { res.status(400).json({ error: 'Nothing to update' }); return; }

    const setClauses = fields.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const { rows }   = await pool.query(
      `UPDATE items SET ${setClauses}, updated_at = now() WHERE id = $1 RETURNING *`,
      [req.params.id, ...fields.map(([, v]) => v)]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /items/:id  (auth + must be owner)
router.delete('/:id', requireAuth, async (req, res: Response, next: NextFunction) => {
  try {
    const userId   = (req as AuthRequest).userId;
    const existing = await pool.query('SELECT owner_id FROM items WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) throw new AppError(404, 'Item not found');
    if (existing.rows[0].owner_id !== userId) throw new AppError(403, 'Not your item');

    await pool.query('DELETE FROM items WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

export { router as itemsRouter };
