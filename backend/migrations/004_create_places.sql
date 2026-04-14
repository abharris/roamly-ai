CREATE TABLE places (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id           UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  added_by_user_id  UUID NOT NULL REFERENCES users(id),
  name              VARCHAR(255) NOT NULL,
  google_place_id   VARCHAR(255),
  google_place_url  TEXT,
  address           TEXT,
  lat               DECIMAL(10, 8),
  lng               DECIMAL(11, 8),
  notes             TEXT,
  is_highlight      BOOLEAN NOT NULL DEFAULT FALSE,
  category          VARCHAR(100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_places_trip ON places(trip_id);
CREATE INDEX idx_places_user ON places(added_by_user_id);
CREATE INDEX idx_places_highlight ON places(trip_id, is_highlight) WHERE is_highlight = true;
