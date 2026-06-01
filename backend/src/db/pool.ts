import { Pool } from 'pg';

// Use the Supabase *transaction pooler* (Supavisor) connection string — the
// direct db.<ref>.supabase.co host is IPv6-only and unreachable from Lambda.
// Dashboard → Connect → Transaction pooler (host: aws-0-<region>.pooler.supabase.com:6543)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Supabase
  // Each Lambda instance handles one request at a time, so a small pool is enough.
  max: 2,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error', err);
});
