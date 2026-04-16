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
    const tripId = params.tripId!;

    // GET /v1/trips/:tripId/itinerary
    if (method === 'GET' && !params.itemId) {
      const items = await query(
        `SELECT ii.*, p.name AS place_name, p.lat AS place_lat, p.lng AS place_lng,
                p.google_place_url AS place_google_place_url
         FROM itinerary_items ii
         LEFT JOIN places p ON p.id = ii.place_id
         WHERE ii.trip_id = $1
         ORDER BY day_index NULLS LAST, start_time NULLS LAST, sort_order`,
        [tripId]
      );
      return ok(items);
    }

    // POST /v1/trips/:tripId/itinerary
    if (method === 'POST' && !params.itemId && !path.endsWith('/reorder')) {
      const { title, item_type, description, place_id, start_time, end_time, day_index } = body;
      if (!title) return error(400, 'title is required');
      const item = await queryOne(
        `INSERT INTO itinerary_items
           (trip_id, place_id, title, item_type, description, start_time, end_time, day_index, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,
           (SELECT COALESCE(MAX(sort_order),0)+1 FROM itinerary_items WHERE trip_id=$1))
         RETURNING *`,
        [tripId, place_id ?? null, title, item_type ?? 'other', description ?? null,
         start_time ?? null, end_time ?? null, day_index ?? null]
      );
      return created(item);
    }

    // POST /v1/trips/:tripId/itinerary/reorder
    if (method === 'POST' && path.endsWith('/reorder')) {
      const { items } = body as { items: { id: string; sort_order: number }[] };
      for (const { id, sort_order } of items) {
        await query('UPDATE itinerary_items SET sort_order=$1 WHERE id=$2 AND trip_id=$3', [sort_order, id, tripId]);
      }
      return ok({ reordered: items.length });
    }

    // PUT /v1/trips/:tripId/itinerary/:itemId
    if (method === 'PUT' && params.itemId) {
      const { title, item_type, description, start_time, end_time, day_index, place_id } = body;
      const item = await queryOne(
        `UPDATE itinerary_items SET
           title=COALESCE($1,title), item_type=COALESCE($2,item_type),
           description=$3, start_time=$4, end_time=$5, day_index=$6, place_id=$9,
           updated_at=NOW()
         WHERE id=$7 AND trip_id=$8 RETURNING *`,
        [title, item_type, description ?? null, start_time ?? null, end_time ?? null, day_index ?? null, params.itemId, tripId, place_id ?? null]
      );
      if (!item) return error(404, 'Item not found');
      return ok(item);
    }

    // DELETE /v1/trips/:tripId/itinerary/:itemId
    if (method === 'DELETE' && params.itemId) {
      await query('DELETE FROM itinerary_items WHERE id=$1 AND trip_id=$2', [params.itemId, tripId]);
      return noContent();
    }

    return error(404, 'Not found');
  } catch (e) {
    return handleError(e);
  }
}
