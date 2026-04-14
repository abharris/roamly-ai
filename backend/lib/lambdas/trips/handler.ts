import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { query, queryOne } from '../shared/db';
import { getRequestUser } from '../shared/auth';
import { ok, created, noContent, handleError, error } from '../shared/response';

async function lookupTimezone(placeId: string): Promise<string | null> {
  try {
    const detailsRes = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
        'X-Goog-FieldMask': 'location',
      },
    });
    const details: any = await detailsRes.json();
    const lat = details.location?.latitude;
    const lng = details.location?.longitude;
    if (lat == null || lng == null) return null;

    const ts = Math.floor(Date.now() / 1000);
    const tzRes = await fetch(
      `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${ts}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    const tzData: any = await tzRes.json();
    return tzData.timeZoneId ?? null;
  } catch {
    return null;
  }
}

export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> {
  try {
    const method = event.requestContext.http.method;
    const path = event.requestContext.http.path;
    const user = await getRequestUser(event);
    const body = event.body ? JSON.parse(event.body) : {};
    const params = event.pathParameters ?? {};

    // GET /v1/trips
    if (method === 'GET' && path === '/v1/trips') {
      const trips = await query(
        `SELECT t.*,
          (SELECT COUNT(*) FROM places WHERE trip_id = t.id) AS places_count,
          (SELECT COUNT(*) FROM itinerary_items WHERE trip_id = t.id) AS itinerary_count,
          COALESCE(
            (SELECT json_agg(json_build_object('user_id', tm2.user_id, 'username', u.username, 'role', tm2.role))
             FROM trip_members tm2
             JOIN users u ON u.id = tm2.user_id
             WHERE tm2.trip_id = t.id),
            '[]'::json
          ) AS members
         FROM trips t
         JOIN trip_members tm ON tm.trip_id = t.id AND tm.user_id = $1
         ORDER BY t.created_at DESC`,
        [user.id]
      );
      return ok(trips);
    }

    // POST /v1/trips
    if (method === 'POST' && path === '/v1/trips') {
      const { name, location, notes, start_date, end_date, google_place_id } = body;
      if (!name || !location) return error(400, 'name and location are required');
      const timezone = google_place_id ? await lookupTimezone(google_place_id) : null;
      const [trip] = await query(
        `INSERT INTO trips (name, location, notes, start_date, end_date, owner_id, timezone)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [name, location, notes ?? null, start_date ?? null, end_date ?? null, user.id, timezone]
      );
      await query(
        `INSERT INTO trip_members (trip_id, user_id, role) VALUES ($1,$2,'owner')`,
        [trip.id, user.id]
      );
      return created(trip);
    }

    // GET /v1/trips/:tripId/members
    if (method === 'GET' && params.tripId && path.endsWith('/members')) {
      const members = await query(
        `SELECT tm.*, u.username, u.email FROM trip_members tm
         JOIN users u ON u.id = tm.user_id
         WHERE tm.trip_id = $1`,
        [params.tripId]
      );
      return ok(members);
    }

    // POST /v1/trips/:tripId/members
    if (method === 'POST' && params.tripId && path.endsWith('/members')) {
      const { user_id, role = 'viewer' } = body;
      const member = await queryOne(
        `INSERT INTO trip_members (trip_id, user_id, role) VALUES ($1,$2,$3)
         ON CONFLICT (trip_id, user_id) DO UPDATE SET role=$3 RETURNING *`,
        [params.tripId, user_id, role]
      );
      return created(member);
    }

    // DELETE /v1/trips/:tripId/members/:userId
    if (method === 'DELETE' && params.tripId && params.userId) {
      await query(
        `DELETE FROM trip_members WHERE trip_id=$1 AND user_id=$2`,
        [params.tripId, params.userId]
      );
      return noContent();
    }

    // GET /v1/trips/:tripId
    if (method === 'GET' && params.tripId) {
      const trip = await queryOne(
        `SELECT t.*,
          (SELECT COUNT(*) FROM places WHERE trip_id = t.id) AS places_count,
          (SELECT COUNT(*) FROM itinerary_items WHERE trip_id = t.id) AS itinerary_count
         FROM trips t
         JOIN trip_members tm ON tm.trip_id = t.id AND tm.user_id = $1
         WHERE t.id = $2`,
        [user.id, params.tripId]
      );
      if (!trip) return error(404, 'Trip not found');
      return ok(trip);
    }

    // PUT /v1/trips/:tripId
    if (method === 'PUT' && params.tripId) {
      const { name, location, notes, start_date, end_date } = body;
      const trip = await queryOne(
        `UPDATE trips SET name=COALESCE($1,name), location=COALESCE($2,location),
         notes=COALESCE($3,notes), start_date=COALESCE($4,start_date), end_date=COALESCE($5,end_date),
         updated_at=NOW()
         WHERE id=$6 AND owner_id=$7 RETURNING *`,
        [name, location, notes, start_date, end_date, params.tripId, user.id]
      );
      if (!trip) return error(404, 'Trip not found');
      return ok(trip);
    }

    // DELETE /v1/trips/:tripId
    if (method === 'DELETE' && params.tripId && !params.userId) {
      await query(`DELETE FROM trips WHERE id=$1 AND owner_id=$2`, [params.tripId, user.id]);
      return noContent();
    }

    return error(404, 'Not found');
  } catch (e) {
    return handleError(e);
  }
}
