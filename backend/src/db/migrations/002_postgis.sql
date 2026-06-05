-- PostGIS location support for item distance filtering.
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- (CREATE EXTENSION needs elevated privileges, so run it from the dashboard,
--  not the connection pooler.)

-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Raw coordinates captured when an item is listed
ALTER TABLE items ADD COLUMN IF NOT EXISTS latitude  double precision;
ALTER TABLE items ADD COLUMN IF NOT EXISTS longitude double precision;

-- 3. Generated geography point (lng, lat order) kept in sync automatically.
--    geography(Point,4326) gives distances in meters on the WGS84 globe.
ALTER TABLE items ADD COLUMN IF NOT EXISTS geog geography(Point, 4326)
  GENERATED ALWAYS AS (
    CASE
      WHEN latitude IS NOT NULL AND longitude IS NOT NULL
      THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
      ELSE NULL
    END
  ) STORED;

-- 4. Spatial index so ST_DWithin / nearest-first sort stay fast
CREATE INDEX IF NOT EXISTS idx_items_geog ON items USING GIST (geog);
