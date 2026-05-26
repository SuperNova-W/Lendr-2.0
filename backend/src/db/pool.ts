import { Pool } from 'pg';

// Supabase provides a standard Postgres connection string.
// Find it in: Dashboard → Settings → Database → Connection string (URI)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Supabase
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error', err);
});
