import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { pool } from './pool';

// Seeds a second demo "lender" user (with a real auth.users row, required by the
// users.id FK) and reassigns ~half the items to them so the signed-in account has
// something it can actually request to borrow.
// Run with: npx tsx src/db/seed-lender.ts

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LENDER = {
  email: 'demo.lender@lendr.test',
  name: 'Maya Lender',
  campus: 'UCLA',
  avatar_url: 'https://i.pravatar.cc/150?img=47',
};

async function main() {
  // 1. Create (or find) the auth user
  let authId: string | undefined;
  const created = await supabase.auth.admin.createUser({
    email: LENDER.email,
    email_confirm: true,
    user_metadata: { full_name: LENDER.name, avatar_url: LENDER.avatar_url },
  });

  if (created.error) {
    // Likely already exists — look it up
    const list = await supabase.auth.admin.listUsers();
    if (list.error) throw list.error;
    authId = list.data.users.find(u => u.email === LENDER.email)?.id;
    if (!authId) throw created.error;
    console.log('• lender auth user already existed');
  } else {
    authId = created.data.user.id;
    console.log('✔ created lender auth user');
  }

  // 2. Upsert their profile row
  await pool.query(
    `INSERT INTO users (id, email, name, avatar_url, campus, rating_avg, rating_count)
     VALUES ($1, $2, $3, $4, $5, 4.8, 12)
     ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url,
           campus = EXCLUDED.campus, rating_avg = EXCLUDED.rating_avg,
           rating_count = EXCLUDED.rating_count`,
    [authId, LENDER.email, LENDER.name, LENDER.avatar_url, LENDER.campus]
  );
  console.log(`✔ lender profile ${LENDER.email} (${authId})`);

  // 3. Hand half the existing items to the lender so they're borrowable by others.
  //    Picks every other item by creation order.
  const { rows: items } = await pool.query(
    'SELECT id FROM items ORDER BY created_at ASC'
  );
  const toReassign = items.filter((_, i) => i % 2 === 0).map(r => r.id);

  if (toReassign.length) {
    await pool.query(
      `UPDATE items SET owner_id = $1, is_available = true WHERE id = ANY($2::uuid[])`,
      [authId, toReassign]
    );
  }
  console.log(`✔ reassigned ${toReassign.length} items to the lender`);

  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
