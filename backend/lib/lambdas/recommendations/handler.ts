import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { query, queryOne } from '../shared/db';
import { getRequestUser } from '../shared/auth';
import { ok, created, noContent, handleError, error } from '../shared/response';

export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> {
  try {
    const method = event.requestContext.http.method;
    const user = await getRequestUser(event);
    const body = event.body ? JSON.parse(event.body) : {};
    const params = event.pathParameters ?? {};

    // GET /v1/recommendations
    if (method === 'GET') {
      const recs = await query(
        `SELECT r.*, p.name AS place_name, p.address, p.lat, p.lng, p.category
         FROM recommendations r
         JOIN places p ON p.id = r.place_id
         WHERE r.user_id = $1
         ORDER BY r.created_at DESC`,
        [user.id]
      );
      return ok(recs);
    }

    // POST /v1/recommendations
    if (method === 'POST') {
      const { place_id, trip_id, notes } = body;
      if (!place_id) return error(400, 'place_id is required');
      const rec = await queryOne(
        `INSERT INTO recommendations (user_id, place_id, trip_id, notes, source)
         VALUES ($1,$2,$3,$4,'manual')
         ON CONFLICT (user_id, place_id, trip_id) DO UPDATE SET notes=EXCLUDED.notes
         RETURNING *`,
        [user.id, place_id, trip_id ?? null, notes ?? null]
      );
      return created(rec);
    }

    // DELETE /v1/recommendations/:recId
    if (method === 'DELETE' && params.recId) {
      await query('DELETE FROM recommendations WHERE id=$1 AND user_id=$2', [params.recId, user.id]);
      return noContent();
    }

    return error(404, 'Not found');
  } catch (e) {
    return handleError(e);
  }
}
