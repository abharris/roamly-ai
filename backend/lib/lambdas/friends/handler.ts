import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { query, queryOne } from '../shared/db';
import { getRequestUser } from '../shared/auth';
import { ok, created, noContent, handleError, error } from '../shared/response';

export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> {
  try {
    const method = event.requestContext.http.method;
    const path = event.requestContext.http.path;
    const user = await getRequestUser(event);
    const body = event.body ? JSON.parse(event.body) : {};
    const params = event.pathParameters ?? {};

    // GET /v1/friends
    if (method === 'GET' && path === '/v1/friends') {
      const friends = await query(
        `SELECT f.*, r.username AS requester_username, a.username AS addressee_username,
           r.id AS requester_id_user, a.id AS addressee_id_user
         FROM friendships f
         JOIN users r ON r.id = f.requester_id
         JOIN users a ON a.id = f.addressee_id
         WHERE (f.requester_id = $1 OR f.addressee_id = $1) AND f.status = 'accepted'`,
        [user.id]
      );
      return ok(friends);
    }

    // GET /v1/friends/requests
    if (method === 'GET' && path === '/v1/friends/requests') {
      const requests = await query(
        `SELECT f.*, u.username AS requester_username, u.email AS requester_email
         FROM friendships f
         JOIN users u ON u.id = f.requester_id
         WHERE f.addressee_id = $1 AND f.status = 'pending'`,
        [user.id]
      );
      return ok(requests);
    }

    // POST /v1/friends/requests
    if (method === 'POST' && path === '/v1/friends/requests') {
      const { addressee_id } = body;
      if (!addressee_id) return error(400, 'addressee_id is required');
      if (addressee_id === user.id) return error(400, 'Cannot send request to yourself');
      const existing = await queryOne(
        `SELECT id FROM friendships WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)`,
        [user.id, addressee_id]
      );
      if (existing) return error(409, 'Friendship already exists or pending');
      const friendship = await queryOne(
        `INSERT INTO friendships (requester_id, addressee_id) VALUES ($1,$2) RETURNING *`,
        [user.id, addressee_id]
      );
      return created(friendship);
    }

    // PUT /v1/friends/requests/:requestId
    if (method === 'PUT' && params.requestId) {
      const { action } = body;
      if (!['accept', 'decline'].includes(action)) return error(400, 'action must be accept or decline');
      if (action === 'accept') {
        const f = await queryOne(
          `UPDATE friendships SET status='accepted', updated_at=NOW()
           WHERE id=$1 AND addressee_id=$2 RETURNING *`,
          [params.requestId, user.id]
        );
        if (!f) return error(404, 'Request not found');
        return ok(f);
      } else {
        await query(`DELETE FROM friendships WHERE id=$1 AND addressee_id=$2`, [params.requestId, user.id]);
        return noContent();
      }
    }

    // DELETE /v1/friends/:friendId
    if (method === 'DELETE' && params.friendId) {
      await query(
        `DELETE FROM friendships WHERE id=$1 AND (requester_id=$2 OR addressee_id=$2)`,
        [params.friendId, user.id]
      );
      return noContent();
    }

    return error(404, 'Not found');
  } catch (e) {
    return handleError(e);
  }
}
