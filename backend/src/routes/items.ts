import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { createItemSchema, updateItemSchema } from '../schemas';
import { pool } from '../db/pool';

const router = Router();

// Columns to return — exclude `geog` (binary) and expose lat/lng instead.
const ITEM_COLS = `
  i.id, i.owner_id, i.title, i.description, i.category, i.price_per_day,
  i.photos, i.campus, i.is_available, i.created_at, i.updated_at,
  i.latitude, i.longitude,
  u.name AS owner_name, u.avatar_url AS owner_avatar, u.rating_avg AS owner_rating`;

// GET /items?campus=UCLA&category=Tech&available=true
//          &lat=34.07&lng=-118.44&radius=8000   (radius in meters → distance filter)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campus, category, available, owner, lat, lng, radius } = req.query;
    const conditions: string[] = [];
    const values: unknown[]    = [];

    if (campus)    { conditions.push(`i.campus = $${values.push(campus)}`); }
    if (category)  { conditions.push(`i.category = $${values.push(category)}::item_category`); }
    if (available) { conditions.push(`i.is_available = $${values.push(available === 'true')}`); }
    if (owner)     { conditions.push(`i.owner_id = $${values.push(owner)}`); }

    // Distance filtering when a valid coordinate is supplied.
    const latN = lat !== undefined ? Number(lat) : NaN;
    const lngN = lng !== undefined ? Number(lng) : NaN;
    const hasGeo = Number.isFinite(latN) && Number.isFinite(lngN);

    let distanceSelect = '';
    let orderBy = 'i.created_at DESC';

    if (hasGeo) {
      // Reference point param ($N), used for both distance + (optional) radius filter.
      const ptIdx = values.push(`SRID=4326;POINT(${lngN} ${latN})`);
      distanceSelect = `, ST_Distance(i.geog, $${ptIdx}::geography) AS distance_m`;

      const radiusN = radius !== undefined ? Number(radius) : NaN;
      if (Number.isFinite(radiusN) && radiusN > 0) {
        // Only items with coordinates within the radius.
        conditions.push(`i.geog IS NOT NULL AND ST_DWithin(i.geog, $${ptIdx}::geography, $${values.push(radiusN)})`);
      }
      // Nearest first; items without coords (NULL distance) sort last.
      orderBy = 'distance_m ASC NULLS LAST, i.created_at DESC';
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT ${ITEM_COLS}${distanceSelect}
       FROM items i JOIN users u ON u.id = i.owner_id
       ${where} ORDER BY ${orderBy} LIMIT 50`,
      values
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /items/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${ITEM_COLS}
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
      `INSERT INTO items (owner_id, title, description, category, price_per_day, photos, campus, latitude, longitude)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, owner_id, title, description, category, price_per_day, photos, campus,
                 is_available, created_at, updated_at, latitude, longitude`,
      [
        (req as AuthRequest).userId,
        data.title, data.description ?? null,
        data.category, data.price_per_day,
        data.photos, data.campus,
        data.latitude ?? null, data.longitude ?? null,
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
      `UPDATE items SET ${setClauses}, updated_at = now() WHERE id = $1
       RETURNING id, owner_id, title, description, category, price_per_day, photos, campus,
                 is_available, created_at, updated_at, latitude, longitude`,
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
