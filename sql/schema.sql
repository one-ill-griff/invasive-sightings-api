CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS sightings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_common TEXT NOT NULL,
  species_scientific TEXT,
  category TEXT NOT NULL,
  severity SMALLINT NOT NULL CHECK (severity BETWEEN 1 AND 5),
  observed_at TIMESTAMPTZ NOT NULL,
  observer TEXT,
  notes TEXT,
  geom geometry(Point, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sightings_geom_gist
  ON sightings USING GIST (geom);

CREATE INDEX IF NOT EXISTS sightings_species_idx
  ON sightings (species_common);

CREATE INDEX IF NOT EXISTS sightings_observed_at_idx
  ON sightings (observed_at);
