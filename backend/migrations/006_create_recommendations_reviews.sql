CREATE TABLE recommendations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  place_id   UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  trip_id    UUID REFERENCES trips(id) ON DELETE SET NULL,
  notes      TEXT,
  source     VARCHAR(100) NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, place_id, trip_id)
);

CREATE INDEX idx_recommendations_user ON recommendations(user_id);

CREATE TABLE reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  place_id   UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  rating     SMALLINT CHECK (rating BETWEEN 1 AND 5),
  body       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, place_id)
);

CREATE INDEX idx_reviews_place ON reviews(place_id);
CREATE INDEX idx_reviews_user  ON reviews(user_id);

CREATE TABLE raw_text_inputs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id       UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id),
  raw_text      TEXT NOT NULL,
  parsed_result JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
