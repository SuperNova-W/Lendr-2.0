-- Additional profile fields collected during the multi-step onboarding flow.
-- Run in: Supabase Dashboard → SQL Editor → New query

ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS dorm      VARCHAR(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone     VARCHAR(32);
