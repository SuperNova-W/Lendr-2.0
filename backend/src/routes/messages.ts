import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { createConversationSchema, sendMessageSchema } from '../schemas';
import { pool } from '../db/pool';
import { ensureConversationForRequest } from '../lib/messaging';
import { notifyNewMessage } from '../lib/push';

const router = Router();
router.use(requireAuth);

// Loads a conversation row and enforces that the current user is a participant.
// Throws 404 if it doesn't exist, 403 if the caller is neither party.
async function requireParticipant(conversationId: string, userId: string) {
  const { rows } = await pool.query(
    'SELECT * FROM conversations WHERE id = $1',
    [conversationId]
  );
  const convo = rows[0];
  if (!convo) throw new AppError(404, 'Conversation not found');
  if (convo.borrower_id !== userId && convo.owner_id !== userId) {
    throw new AppError(403, 'Not your conversation');
  }
  return convo;
}

// GET /messages/conversations — every thread the current user is part of, with
// the context the list UI needs: item, the *other* participant, a last-message
// preview, unread count, and the backing request status.
router.get('/conversations', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { rows } = await pool.query(
      `SELECT
         c.id, c.request_id, c.item_id, c.borrower_id, c.owner_id,
         c.last_message_at, c.created_at,
         i.title  AS item_title,
         i.photos AS item_photos,
         r.status AS request_status,
         ou.id         AS other_user_id,
         ou.name       AS other_user_name,
         ou.avatar_url AS other_user_avatar,
         lm.body       AS last_message_body,
         lm.created_at AS last_message_created_at,
         lm.sender_id  AS last_message_sender_id,
         COALESCE(uc.unread, 0)::int AS unread_count
       FROM conversations c
       JOIN items    i  ON i.id  = c.item_id
       JOIN requests r  ON r.id  = c.request_id
       JOIN users    ou ON ou.id = CASE WHEN c.borrower_id = $1 THEN c.owner_id ELSE c.borrower_id END
       LEFT JOIN LATERAL (
         SELECT m.body, m.created_at, m.sender_id
         FROM messages m
         WHERE m.conversation_id = c.id
         ORDER BY m.created_at DESC
         LIMIT 1
       ) lm ON true
       LEFT JOIN LATERAL (
         SELECT count(*) AS unread
         FROM messages m
         WHERE m.conversation_id = c.id
           AND m.sender_id <> $1
           AND m.read_at IS NULL
       ) uc ON true
       WHERE c.borrower_id = $1 OR c.owner_id = $1
       ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /messages/conversations/:id — one thread with its messages (ascending),
// plus item/request context. Participant-only.
router.get('/conversations/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).userId;
    await requireParticipant(req.params.id, userId);

    const detail = await pool.query(
      `SELECT
         c.id, c.request_id, c.item_id, c.borrower_id, c.owner_id,
         c.last_message_at, c.created_at,
         i.title  AS item_title,
         i.photos AS item_photos,
         r.status      AS request_status,
         r.start_date, r.end_date, r.total_price,
         ou.id         AS other_user_id,
         ou.name       AS other_user_name,
         ou.avatar_url AS other_user_avatar
       FROM conversations c
       JOIN items    i  ON i.id  = c.item_id
       JOIN requests r  ON r.id  = c.request_id
       JOIN users    ou ON ou.id = CASE WHEN c.borrower_id = $2 THEN c.owner_id ELSE c.borrower_id END
       WHERE c.id = $1`,
      [req.params.id, userId]
    );

    const messages = await pool.query(
      `SELECT id, conversation_id, sender_id, body, created_at, read_at
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [req.params.id]
    );

    res.json({ ...detail.rows[0], messages: messages.rows });
  } catch (err) { next(err); }
});

// POST /messages/conversations — create or return the conversation for a
// request. Only the request's borrower or owner may call it.
router.post('/conversations', async (req, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const { request_id } = createConversationSchema.parse(req.body);
    const userId = (req as AuthRequest).userId;

    await client.query('BEGIN');

    const reqRes = await client.query(
      'SELECT id, item_id, borrower_id, owner_id, message FROM requests WHERE id = $1',
      [request_id]
    );
    const request = reqRes.rows[0];
    if (!request) throw new AppError(404, 'Request not found');
    if (request.borrower_id !== userId && request.owner_id !== userId) {
      throw new AppError(403, 'Not your request');
    }

    // Seed the opening note as the first message when the thread is brand new.
    const { id } = await ensureConversationForRequest(client, request, { seedFirstMessage: true });

    const { rows } = await client.query(
      'SELECT * FROM conversations WHERE id = $1',
      [id]
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// POST /messages/conversations/:id/messages — send a message. Participant-only.
router.post('/conversations/:id/messages', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).userId;
    const { body } = sendMessageSchema.parse(req.body);
    const convo = await requireParticipant(req.params.id, userId);

    // sender_id comes from the verified token, never the request body.
    const { rows } = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, conversation_id, sender_id, body, created_at, read_at`,
      [req.params.id, userId, body]
    );
    const message = rows[0];

    await pool.query(
      'UPDATE conversations SET last_message_at = $2, updated_at = now() WHERE id = $1',
      [req.params.id, message.created_at]
    );

    // Notify the other participant. No-op today; see lib/push.ts for the seam.
    const recipientId = convo.borrower_id === userId ? convo.owner_id : convo.borrower_id;
    void notifyNewMessage({
      recipientId,
      conversationId: convo.id,
      requestId: convo.request_id,
      itemId: convo.item_id,
      senderName: '',
      preview: message.body,
    }).catch(() => {});

    res.status(201).json(message);
  } catch (err) { next(err); }
});

// PATCH /messages/conversations/:id/read — mark the *other* participant's
// messages as read. Participant-only. Returns how many rows were updated.
router.patch('/conversations/:id/read', async (req, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as AuthRequest).userId;
    await requireParticipant(req.params.id, userId);

    const { rowCount } = await pool.query(
      `UPDATE messages
       SET read_at = now()
       WHERE conversation_id = $1
         AND sender_id <> $2
         AND read_at IS NULL`,
      [req.params.id, userId]
    );
    res.json({ updated: rowCount ?? 0 });
  } catch (err) { next(err); }
});

export { router as messagesRouter };
