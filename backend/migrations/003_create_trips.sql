CREATE TABLE trips (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  location      VARCHAR(255) NOT NULL,
  notes         TEXT,
  start_date    DATE,
  end_date      DATE,
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trips_owner ON trips(owner_id);

CREATE TYPE trip_role AS ENUM ('owner', 'editor', 'viewer');

CREATE TABLE trip_members (
  trip_id   UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      trip_role NOT NULL DEFAULT 'viewer',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (trip_id, user_id)
);

CREATE INDEX idx_trip_members_user ON trip_members(user_id);
