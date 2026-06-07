import { QueryResult, QueryResultRow } from 'pg';

// Both the shared `pool` and a checked-out `PoolClient` expose this `query`
// shape, so helpers can run against either — pass a transaction's client to
// make the conversation creation atomic with surrounding writes.
export interface Querier {
  query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<R>>;
}

// Minimal request shape needed to back a conversation.
export interface RequestForConversation {
  id: string;
  item_id: string;
  borrower_id: string;
  owner_id: string;
  message?: string | null;
}

// Creates (or returns the existing) conversation for a request. Keyed on the
// unique `request_id`, so it's idempotent — repeated calls return the same row.
// When `seedFirstMessage` is set and the request carried an opening note, that
// note is inserted as the borrower's first message *only if the thread is still
// empty*, keeping the existing `requests.message` field as the source of truth
// for backward compatibility.
export async function ensureConversationForRequest(
  db: Querier,
  request: RequestForConversation,
  opts: { seedFirstMessage?: boolean } = {}
): Promise<{ id: string }> {
  const upsert = await db.query<{ id: string }>(
    `INSERT INTO conversations (request_id, item_id, borrower_id, owner_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (request_id) DO UPDATE SET updated_at = now()
     RETURNING id`,
    [request.id, request.item_id, request.borrower_id, request.owner_id]
  );
  const conversationId = upsert.rows[0].id;

  const opening = request.message?.trim();
  if (opts.seedFirstMessage && opening) {
    const existing = await db.query(
      'SELECT 1 FROM messages WHERE conversation_id = $1 LIMIT 1',
      [conversationId]
    );
    if (existing.rowCount === 0) {
      const inserted = await db.query<{ created_at: string }>(
        `INSERT INTO messages (conversation_id, sender_id, body)
         VALUES ($1, $2, $3)
         RETURNING created_at`,
        [conversationId, request.borrower_id, opening.slice(0, 2000)]
      );
      await db.query(
        'UPDATE conversations SET last_message_at = $2, updated_at = now() WHERE id = $1',
        [conversationId, inserted.rows[0].created_at]
      );
    }
  }

  return { id: conversationId };
}
