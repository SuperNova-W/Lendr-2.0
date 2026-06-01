import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';

const router = Router();

// GET /stats?campus=UCLA — headline numbers for the home screen.
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campus } = req.query;
    const filter = campus ? 'WHERE campus = $1' : '';
    const args = campus ? [campus] : [];

    const [students, listings] = await Promise.all([
      pool.query(`SELECT count(*)::int AS n FROM users ${filter}`, args),
      pool.query(`SELECT count(*)::int AS n FROM items ${filter}`, args),
    ]);

    // Avg saved = average daily price across listings (a rough "vs. buying" proxy).
    const avg = await pool.query(
      `SELECT COALESCE(round(avg(price_per_day)), 0)::int AS n FROM items ${filter}`,
      args
    );

    res.json({
      students: students.rows[0].n,
      listings: listings.rows[0].n,
      avgSaved: avg.rows[0].n,
    });
  } catch (err) { next(err); }
});

export { router as statsRouter };
