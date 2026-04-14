CREATE TABLE itinerary_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id       UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  place_id      UUID REFERENCES places(id) ON DELETE SET NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  item_type     VARCHAR(50) NOT NULL DEFAULT 'other',
  start_time    TIMESTAMPTZ,
  end_time      TIMESTAMPTZ,
  day_index     INTEGER,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_itinerary_trip       ON itinerary_items(trip_id);
CREATE INDEX idx_itinerary_start_time ON itinerary_items(trip_id, start_time);
CREATE INDEX idx_itinerary_day        ON itinerary_items(trip_id, day_index);
