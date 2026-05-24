import { z } from 'zod';

export const createItemSchema = z.object({
  title:         z.string().min(3).max(160),
  description:   z.string().optional(),
  category:      z.enum(['Textbooks','Tech','Dorm','Formal','Sports','Outdoors','Other']),
  price_per_day: z.number().positive(),
  photos:        z.array(z.string().url()).optional().default([]),
  campus:        z.string().min(1),
});

export const updateItemSchema = createItemSchema.partial();

export const createRequestSchema = z.object({
  item_id:    z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  end_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  message:    z.string().max(500).optional(),
});

export const updateRequestSchema = z.object({
  status: z.enum(['approved','declined','returned','cancelled']),
});

export const updateUserSchema = z.object({
  name:   z.string().min(1).max(128).optional(),
  campus: z.string().optional(),
  bio:    z.string().max(300).optional(),
});
