import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { query, queryOne } from '../shared/db';
import { getCognitoSub, getRequestUser } from '../shared/auth';
import { ok, created, handleError, error } from '../shared/response';

export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> {
  try {
    const method = event.requestContext.http.method;
    const path = event.requestContext.http.path;
    const body = event.body ? JSON.parse(event.body) : {};
    const params = event.pathParameters ?? {};
    const qs = event.queryStringParameters ?? {};

    // GET /v1/health
    if (path === '/v1/health') return ok({ status: 'ok' });

    // POST /v1/users/profile — called once after Cognito sign-up
    if (method === 'POST' && path === '/v1/users/profile') {
      const sub = getCognitoSub(event);
      const claims = event.requestContext.authorizer.jwt.claims;
      const email = claims['email'] as string;
      const { username } = body;
      if (!username) return error(400, 'username is required');
      const existing = await queryOne('SELECT id FROM users WHERE cognito_sub=$1', [sub]);
      if (existing) return ok(existing);
      const user = await queryOne(
        `INSERT INTO users (cognito_sub, username, email) VALUES ($1,$2,$3) RETURNING *`,
        [sub, username, email]
      );
      return created(user);
    }

    // GET /v1/users/me
    if (method === 'GET' && path === '/v1/users/me') {
      const user = await getRequestUser(event);
      return ok(user);
    }

    // PUT /v1/users/me
    if (method === 'PUT' && path === '/v1/users/me') {
      const user = await getRequestUser(event);
      const { username, avatar_url } = body;
      const updated = await queryOne(
        `UPDATE users SET username=COALESCE($1,username), avatar_url=COALESCE($2,avatar_url), updated_at=NOW()
         WHERE id=$3 RETURNING *`,
        [username, avatar_url, user.id]
      );
      return ok(updated);
    }

    // GET /v1/users/search?q=...
    if (method === 'GET' && path === '/v1/users/search') {
      const user = await getRequestUser(event);
      if (!qs.q) return error(400, 'q is required');
      const results = await query(
        `SELECT id, username, email FROM users WHERE username ILIKE $1 AND id != $2 LIMIT 20`,
        [`${qs.q}%`, user.id]
      );
      return ok(results);
    }

    // GET /v1/users/:userId
    if (method === 'GET' && params.userId) {
      const result = await queryOne('SELECT id, username FROM users WHERE id=$1', [params.userId]);
      if (!result) return error(404, 'User not found');
      return ok(result);
    }

    return error(404, 'Not found');
  } catch (e) {
    return handleError(e);
  }
}
