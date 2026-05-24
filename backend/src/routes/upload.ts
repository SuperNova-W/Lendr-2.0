import { Router, Response, NextFunction } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/error';

const router  = Router();
const s3      = new S3Client({ region: process.env.AWS_REGION });
const upload  = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new AppError(400, 'Only image files are allowed'));
  },
});

// POST /upload  — returns { url } pointing to S3
router.post('/', requireAuth, upload.single('photo'), async (req, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError(400, 'No file uploaded');

    const ext = req.file.originalname.split('.').pop();
    const key = `items/${randomUUID()}.${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket:      process.env.S3_BUCKET!,
      Key:         key,
      Body:        req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    const url = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    res.json({ url });
  } catch (err) { next(err); }
});

export { router as uploadRouter };
