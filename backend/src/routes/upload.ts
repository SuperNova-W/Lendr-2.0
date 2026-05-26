import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { AppError } from '../middleware/error';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new AppError(400, 'Only image files are allowed'));
  },
});

// POST /upload
// Multipart form-data with field name "photo".
// Returns: { url } — the public URL to store on the item record.
//
// Before this works, create a "photos" bucket in:
// Supabase Dashboard → Storage → New bucket → name: photos → Public: on
router.post('/', requireAuth, upload.single('photo'), async (req, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError(400, 'No file uploaded');

    const ext = req.file.originalname.split('.').pop();
    const key = `items/${randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from('photos')
      .upload(key, req.file.buffer, { contentType: req.file.mimetype });

    if (error) throw new AppError(500, `Storage upload failed: ${error.message}`);

    const { data } = supabase.storage.from('photos').getPublicUrl(key);
    res.json({ url: data.publicUrl });
  } catch (err) { next(err); }
});

export { router as uploadRouter };
