import { Pool } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

let pool: Pool | null = null;

async function getPassword(): Promise<string> {
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION_NAME });
  const result = await client.send(new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN }));
  const secret = JSON.parse(result.SecretString!);
  return secret.password;
}

export async function getDb(): Promise<Pool> {
  if (pool) return pool;

  const password = await getPassword();

  pool = new Pool({
    host: process.env.DB_HOST,
    port: 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

  return pool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const db = await getDb();
  const result = await db.query(sql, params);
  return result.rows;
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
