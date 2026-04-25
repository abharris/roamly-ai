import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Pool } from 'pg';

const MIGRATIONS = [
  {
    name: '001_create_users',
    sql: `
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      CREATE TABLE IF NOT EXISTS users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cognito_sub   VARCHAR(128) UNIQUE NOT NULL,
        username      VARCHAR(50)  UNIQUE NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        avatar_url    TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `,
  },
  {
    name: '002_create_friendships',
    sql: `
      DO $$ BEGIN
        CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'blocked');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      CREATE TABLE IF NOT EXISTS friendships (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        requester_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        addressee_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status        friendship_status NOT NULL DEFAULT 'pending',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (requester_id, addressee_id),
        CHECK (requester_id <> addressee_id)
      );
      CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
      CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
      CREATE INDEX IF NOT EXISTS idx_friendships_status    ON friendships(status);
    `,
  },
  {
    name: '003_create_trips',
    sql: `
      CREATE TABLE IF NOT EXISTS trips (
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
      CREATE INDEX IF NOT EXISTS idx_trips_owner ON trips(owner_id);
      DO $$ BEGIN
        CREATE TYPE trip_role AS ENUM ('owner', 'editor', 'viewer');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      CREATE TABLE IF NOT EXISTS trip_members (
        trip_id   UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role      trip_role NOT NULL DEFAULT 'viewer',
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (trip_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_trip_members_user ON trip_members(user_id);
    `,
  },
  {
    name: '004_create_places',
    sql: `
      CREATE TABLE IF NOT EXISTS places (
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
      CREATE INDEX IF NOT EXISTS idx_places_trip      ON places(trip_id);
      CREATE INDEX IF NOT EXISTS idx_places_user      ON places(added_by_user_id);
      CREATE INDEX IF NOT EXISTS idx_places_highlight ON places(trip_id, is_highlight) WHERE is_highlight = true;
    `,
  },
  {
    name: '005_create_itinerary',
    sql: `
      CREATE TABLE IF NOT EXISTS itinerary_items (
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
      CREATE INDEX IF NOT EXISTS idx_itinerary_trip       ON itinerary_items(trip_id);
      CREATE INDEX IF NOT EXISTS idx_itinerary_start_time ON itinerary_items(trip_id, start_time);
      CREATE INDEX IF NOT EXISTS idx_itinerary_day        ON itinerary_items(trip_id, day_index);
    `,
  },
  {
    name: '006_create_recommendations_reviews',
    sql: `
      CREATE TABLE IF NOT EXISTS recommendations (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        place_id   UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        trip_id    UUID REFERENCES trips(id) ON DELETE SET NULL,
        notes      TEXT,
        source     VARCHAR(100) NOT NULL DEFAULT 'manual',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, place_id, trip_id)
      );
      CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id);
      CREATE TABLE IF NOT EXISTS reviews (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        place_id   UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        rating     SMALLINT CHECK (rating BETWEEN 1 AND 5),
        body       TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, place_id)
      );
      CREATE INDEX IF NOT EXISTS idx_reviews_place ON reviews(place_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_user  ON reviews(user_id);
      CREATE TABLE IF NOT EXISTS raw_text_inputs (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id       UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id       UUID NOT NULL REFERENCES users(id),
        raw_text      TEXT NOT NULL,
        parsed_result JSONB,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: '007_add_timezone_to_trips',
    sql: `ALTER TABLE trips ADD COLUMN IF NOT EXISTS timezone VARCHAR(64);`,
  },
];

export async function handler(event: { query?: string } = {}) {
  const sm = new SecretsManagerClient({ region: process.env.AWS_REGION_NAME });
  const result = await sm.send(new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN }));
  const { password } = JSON.parse(result.SecretString!);

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  if (event.query) {
    const { rows } = await pool.query(event.query);
    await pool.end();
    return { rows };
  }

  const results: string[] = [];
  for (const migration of MIGRATIONS) {
    await pool.query(migration.sql);
    results.push(`✓ ${migration.name}`);
    console.log(`Ran migration: ${migration.name}`);
  }

  await pool.end();
  return { success: true, migrations: results };
}
