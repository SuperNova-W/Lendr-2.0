-- Make account deletion work: cascade deletes through requests & ratings.
-- Without these, deleting a user fails ("Database error deleting user") because
-- requests/ratings still reference the user (and requests reference their items,
-- and ratings reference requests).
-- Run in: Supabase Dashboard → SQL Editor → New query

-- ── requests ──────────────────────────────────────────────────
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_borrower_id_fkey;
ALTER TABLE requests ADD  CONSTRAINT requests_borrower_id_fkey
  FOREIGN KEY (borrower_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_owner_id_fkey;
ALTER TABLE requests ADD  CONSTRAINT requests_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_item_id_fkey;
ALTER TABLE requests ADD  CONSTRAINT requests_item_id_fkey
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

-- ── ratings ───────────────────────────────────────────────────
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_request_id_fkey;
ALTER TABLE ratings ADD  CONSTRAINT ratings_request_id_fkey
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE;

ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_rater_id_fkey;
ALTER TABLE ratings ADD  CONSTRAINT ratings_rater_id_fkey
  FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_ratee_id_fkey;
ALTER TABLE ratings ADD  CONSTRAINT ratings_ratee_id_fkey
  FOREIGN KEY (ratee_id) REFERENCES users(id) ON DELETE CASCADE;
