import 'dotenv/config';
import { pool } from './pool';

// One-off seed: ensures the signed-in user exists in public.users and
// populates a handful of demo items owned by them.
// Run with: npx tsx src/db/seed.ts

const USER = {
  id: 'c6de8cd8-7684-4f3a-b851-70978f9e1c09',
  email: 'yash.ponnaganti@gmail.com',
  name: 'Yashwant Ponnaganti',
  avatar_url:
    'https://lh3.googleusercontent.com/a/ACg8ocJ2kyDjmm5zXyGeLSwN5GDDlD3vYECUzTP_-C2MK3JX-a9t2e0=s96-c',
  campus: 'UCLA',
};

// Mirrors frontend/src/data/dummyData.ts (FEATURED + LISTINGS), priced as numbers.
const ITEMS: {
  title: string;
  description: string;
  category: string;
  price_per_day: number;
  photos: string[];
}[] = [
  { title: 'Campus Bike', description: 'Lightweight, lock included', category: 'Outdoors', price_per_day: 5, photos: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80&auto=format&fit=crop'] },
  { title: 'Sony A7 III', description: 'Great for class projects', category: 'Tech', price_per_day: 22, photos: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80&auto=format&fit=crop'] },
  { title: 'Mini Projector', description: 'BenQ 1080p, dorm-ready', category: 'Tech', price_per_day: 10, photos: ['https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=600&q=80&auto=format&fit=crop'] },
  { title: 'TI-84 Plus CE Graphing Calculator (Like New)', description: 'Graphing calculator for Calc I–III and Stats. Comes with charger.', category: 'Tech', price_per_day: 3, photos: ['https://images.unsplash.com/photo-1564939558297-fc396f18e5c7?w=400&q=80&auto=format&fit=crop'] },
  { title: 'Suit Jacket (M)', description: 'Navy blazer — great for career fairs or interviews.', category: 'Formal', price_per_day: 8, photos: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80&auto=format&fit=crop'] },
  { title: 'Organic Chem Textbook', description: 'Clayden 2nd Ed. Saves $200+ vs. the campus bookstore.', category: 'Textbooks', price_per_day: 4, photos: ['https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&q=80&auto=format&fit=crop'] },
  { title: 'Instant Pot Duo', description: '6-quart pressure cooker, perfect for the dorm kitchen.', category: 'Dorm', price_per_day: 4, photos: ['https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=400&q=80&auto=format&fit=crop'] },
  { title: 'Tennis Racket Set', description: 'Two Wilson rackets + balls. Rec center courts are free!', category: 'Sports', price_per_day: 5, photos: ['https://images.unsplash.com/photo-1617083277720-12dd5fdbf73c?w=400&q=80&auto=format&fit=crop'] },
  { title: 'Camping Tent (4-person)', description: 'Waterproof with stakes, poles, and carry bag.', category: 'Outdoors', price_per_day: 12, photos: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&q=80&auto=format&fit=crop'] },
  { title: 'iPad Pro + Pencil', description: 'M2 iPad Pro 11" with Apple Pencil for notes or design work.', category: 'Tech', price_per_day: 15, photos: ['https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&q=80&auto=format&fit=crop'] },
  { title: 'Formal Dress (S)', description: 'Floor-length navy gown, perfect for formals or Greek events.', category: 'Formal', price_per_day: 12, photos: ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&q=80&auto=format&fit=crop'] },
];

async function main() {
  await pool.query(
    `INSERT INTO users (id, email, name, avatar_url, campus)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url, campus = EXCLUDED.campus`,
    [USER.id, USER.email, USER.name, USER.avatar_url, USER.campus]
  );
  console.log(`✔ user ${USER.email}`);

  // Idempotent: clear this user's items first so re-running doesn't duplicate.
  await pool.query('DELETE FROM items WHERE owner_id = $1', [USER.id]);

  for (const it of ITEMS) {
    await pool.query(
      `INSERT INTO items (owner_id, title, description, category, price_per_day, photos, campus)
       VALUES ($1,$2,$3,$4::item_category,$5,$6,$7)`,
      [USER.id, it.title, it.description, it.category, it.price_per_day, it.photos, USER.campus]
    );
  }
  console.log(`✔ seeded ${ITEMS.length} items`);

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
