import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { query, queryOne } from '../shared/db';
import { getRequestUser } from '../shared/auth';
import { ok, created, noContent, handleError, error } from '../shared/response';

async function googleAutocomplete(q: string, sessiontoken: string) {
  const url = new URL('https://places.googleapis.com/v1/places:autocomplete');
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
    },
    body: JSON.stringify({ input: q, sessionToken: sessiontoken }),
  });
  const data: any = await res.json();
  return (data.suggestions ?? []).map((s: any) => ({
    google_place_id: s.placePrediction?.placeId,
    description: s.placePrediction?.text?.text,
    main_text: s.placePrediction?.structuredFormat?.mainText?.text,
    secondary_text: s.placePrediction?.structuredFormat?.secondaryText?.text,
  }));
}

async function googlePlaceDetails(placeId: string) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,googleMapsUri',
    },
  });
  const data: any = await res.json();
  return {
    google_place_id: data.id,
    name: data.displayName?.text,
    address: data.formattedAddress,
    lat: data.location?.latitude,
    lng: data.location?.longitude,
    google_place_url: data.googleMapsUri,
  };
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
    const qs = event.queryStringParameters ?? {};

    // GET /v1/places/autocomplete
    if (method === 'GET' && path.includes('/places/autocomplete')) {
      if (!qs.q) return error(400, 'q is required');
      const results = await googleAutocomplete(qs.q, qs.sessiontoken ?? '');
      return ok(results);
    }

    // GET /v1/places/details/:googlePlaceId
    if (method === 'GET' && path.includes('/places/details/')) {
      const detail = await googlePlaceDetails(params.googlePlaceId!);
      return ok(detail);
    }

    // GET /v1/places — all places across the user's trips
    if (method === 'GET' && path.endsWith('/places') && !params.tripId) {
      const places = await query(
        `SELECT p.*, t.name AS trip_name, t.location AS trip_location
         FROM places p
         JOIN trips t ON t.id = p.trip_id
         JOIN trip_members tm ON tm.trip_id = t.id AND tm.user_id = $1
         ORDER BY p.created_at DESC`,
        [user.id]
      );
      return ok(places);
    }

    const tripId = params.tripId!;

    // GET /v1/trips/:tripId/places
    if (method === 'GET' && !params.placeId) {
      let sql = 'SELECT * FROM places WHERE trip_id = $1';
      const args: any[] = [tripId];
      if (qs.highlight === 'true') { sql += ` AND is_highlight = true`; }
      if (qs.category) { sql += ` AND category = $${args.length + 1}`; args.push(qs.category); }
      sql += qs.sort === 'name' ? ' ORDER BY name' : ' ORDER BY created_at DESC';
      const places = await query(sql, args);
      return ok(places);
    }

    // POST /v1/trips/:tripId/places
    if (method === 'POST' && !params.placeId) {
      const { name, google_place_id, google_place_url, address, lat, lng, notes, category } = body;
      if (!name) return error(400, 'name is required');
      const place = await queryOne(
        `INSERT INTO places (trip_id, added_by_user_id, name, google_place_id, google_place_url,
          address, lat, lng, notes, category)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [tripId, user.id, name, google_place_id ?? null, google_place_url ?? null,
         address ?? null, lat ?? null, lng ?? null, notes ?? null, category ?? null]
      );
      return created(place);
    }

    // GET /v1/trips/:tripId/places/:placeId
    if (method === 'GET' && params.placeId) {
      const place = await queryOne('SELECT * FROM places WHERE id=$1 AND trip_id=$2', [params.placeId, tripId]);
      if (!place) return error(404, 'Place not found');
      return ok(place);
    }

    // PUT /v1/trips/:tripId/places/:placeId
    if (method === 'PUT' && params.placeId) {
      const { name, notes, is_highlight, category } = body;
      const place = await queryOne(
        `UPDATE places SET name=COALESCE($1,name), notes=COALESCE($2,notes),
          is_highlight=COALESCE($3,is_highlight), category=COALESCE($4,category), updated_at=NOW()
         WHERE id=$5 AND trip_id=$6 RETURNING *`,
        [name, notes, is_highlight, category, params.placeId, tripId]
      );
      if (!place) return error(404, 'Place not found');
      return ok(place);
    }

    // DELETE /v1/trips/:tripId/places/:placeId
    if (method === 'DELETE' && params.placeId) {
      await query('DELETE FROM places WHERE id=$1 AND trip_id=$2', [params.placeId, tripId]);
      return noContent();
    }

    return error(404, 'Not found');
  } catch (e) {
    return handleError(e);
  }
}
