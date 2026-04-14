CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'blocked');

CREATE TABLE friendships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        friendship_status NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_status    ON friendships(status);
