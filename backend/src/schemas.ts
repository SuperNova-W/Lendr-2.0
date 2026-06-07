import { z } from 'zod';

export const createItemSchema = z.object({
  title:         z.string().min(3).max(160),
  description:   z.string().optional(),
  category:      z.enum(['Textbooks','Tech','Dorm','Formal','Sports','Outdoors','Other']),
  price_per_day: z.number().positive().max(9999),
  photos:        z.array(z.string().url()).optional().default([]),
  campus:        z.string().min(1),
  latitude:      z.number().min(-90).max(90).optional(),
  longitude:     z.number().min(-180).max(180).optional(),
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

// ── Messaging ────────────────────────────────────────────────────────────────

export const createConversationSchema = z.object({
  request_id: z.string().uuid(),
});

// Trim first, then require 1..2000 chars so whitespace-only bodies are rejected
// and the stored value is already normalized.
export const sendMessageSchema = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty').max(2000),
});

// ── Places ───────────────────────────────────────────────────────────────────

// Query params arrive as strings, so coerce lat/lng. An optional `q` switches the
// proxy from a nearby search to a text search biased to the same point.
export const placesNearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  q:   z.string().trim().max(120).optional(),
});

// ── Push tokens (future notifications) ───────────────────────────────────────

export const registerPushTokenSchema = z.object({
  token:    z.string().min(1).max(512),
  platform: z.enum(['ios', 'android', 'web', 'expo']),
});

export const deletePushTokenSchema = z.object({
  token: z.string().min(1).max(512),
});

export const updateUserSchema = z.object({
  name:       z.string().min(1).max(128).optional(),
  campus:     z.string().max(128).optional(),
  grad_year:  z.number().int().min(1950).max(2100).optional(),
  major:      z.string().max(128).optional(),
  bio:        z.string().max(300).optional(),
  interests:  z.array(z.string().max(40)).max(20).optional(),
  dorm:       z.string().max(128).optional(),
  phone:      z.string().max(32).optional(),
  avatar_url: z.string().url().optional(),
});
