import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import Anthropic from '@anthropic-ai/sdk';
import { queryOne } from '../shared/db';
import { getRequestUser } from '../shared/auth';
import { ok, handleError, error } from '../shared/response';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BASE_SYSTEM_PROMPT = `You are a travel assistant that parses free-form trip notes into structured data.

Your job is to read unstructured text and extract every place recommendation or itinerary item mentioned, then return them as a JSON object.

Classification Rules
Place (recommendation):
A standalone location, restaurant, activity, or attraction that is NOT anchored to a specific date or time. It may include cuisine type, notes, or emphasis markers (e.g., **).

Examples:

Glorietta (Italian) — maybe without Potts if she doesn't stay as long
Snake River Grill (fancy)
FIGS (middle eastern / med) **
Itinerary Item:
An activity or place that IS tied to a specific date and/or time, or appears as a step within a day-by-day schedule.

Examples:

Wednesday 6/19 — Breakfast on way to Yellowstone
Drive to Geysers
Upper Geyser Basin and Old Faithful Trail
Output Format
Return a single JSON object with two keys: "places" and "itinerary_items".

Place schema

{
  "name": "string",
  "google_place_id": "string | omit if unknown",
  "google_place_url": "string | omit if unknown",
  "address": "string | omit if unknown",
  "lat": "number | omit if unknown",
  "lng": "number | omit if unknown",
  "notes": "string | omit if none",
  "is_highlight": "boolean",
  "category": "Restaurant | Bar | Shop | Hotel | Activity | Other"
}
Itinerary Item schema

{
  "title": "string",
  "description": "string | omit if none",
  "item_type": "flight | hotel | activity | restaurant | bar | shop | transport | other",
  "start_time": "ISO 8601 time string | omit if not provided",
  "end_time": "ISO 8601 time string | omit if not provided",
  "day_index": "number | omit if no date context",
  "place_index": "number (0-based index of the associated place in the places array) | omit if not a specific named place"
}
Rules
Shared
Omit any optional field entirely rather than setting it to null or "".
Do not invent or infer any information not present in the input.
Return only the raw JSON object — no explanation, preamble, or markdown fences.
Places
Set is_highlight to true if the item is marked with ** or similar emphasis; otherwise false.
Strip formatting markers like ** from name; preserve their meaning via is_highlight.
Infer category from context (e.g., cuisine mentions → Restaurant; tavern, bar → Bar).
Capture caveats, cuisine types, or descriptors in notes (e.g., "Italian; maybe without Potts if she doesn't stay as long").
For every named place, look it up on Google Maps and populate google_place_id, google_place_url, address, lat, and lng from the Google Maps result. Use the most specific and accurate match. If a place cannot be confidently matched on Google Maps, omit those fields rather than guessing.
Itinerary Items
If a date header (e.g., Wednesday 6/19) applies to multiple items below it, apply that date's day_index to each item until a new date header appears.
Assign day_index as an integer relative to the first date of the trip. The first day of the trip is day_index: 1, the second day is day_index: 2, and so on. If dates are not contiguous (e.g., there is a gap), count the actual calendar days between the first date and the current date (e.g., if day 1 is June 19 and the next date is June 21, that is day_index: 3).
Infer item_type from context: travel verbs like "drive", "fly" → transport or flight; named restaurants → restaurant; hikes, parks, tours → activity; etc.
If the itinerary item refers to a specific named place that appears in the places array, set place_index to that place's 0-based position in the array.`;

async function enrichWithGooglePlaces(places: any[]) {
  const enriched = await Promise.all(
    places.map(async (place) => {
      // Skip enrichment if Claude already resolved Google Places data
      if (place.google_place_id) return place;

      try {
        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri',
          },
          body: JSON.stringify({ textQuery: place.name, maxResultCount: 1 }),
        });

        const data: any = await res.json();
        const found = data.places?.[0];
        if (found) {
          return {
            ...place,
            google_place_id: found.id,
            google_place_url: found.googleMapsUri,
            address: found.formattedAddress,
            lat: found.location?.latitude,
            lng: found.location?.longitude,
            name: found.displayName?.text ?? place.name,
          };
        }
      } catch (e) {
        console.warn(`Google Places enrichment failed for "${place.name}":`, e);
      }
      return place;
    })
  );
  return enriched;
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
    const tripId = params.tripId!;

    // POST /v1/trips/:tripId/parse
    if (method === 'POST' && path.endsWith('/parse') && !path.endsWith('/parse/confirm')) {
      const { raw_text, trip_start_date } = body;
      if (!raw_text?.trim()) return error(400, 'raw_text is required');
      if (raw_text.length > 10_000) return error(400, 'raw_text exceeds 10,000 character limit');

      const systemPrompt = trip_start_date
        ? `${BASE_SYSTEM_PROMPT}\n\nThe trip starts on ${trip_start_date}. Use this to resolve relative dates like "next Tuesday" into day_index values.`
        : BASE_SYSTEM_PROMPT;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: raw_text }],
      });

      const textBlock = response.content.find(
        (b): b is Anthropic.TextBlock => b.type === 'text'
      );
      if (!textBlock) return error(500, 'AI did not return a response');

      let parsed: { places: any[]; itinerary_items: any[] };
      try {
        parsed = JSON.parse(textBlock.text);
      } catch {
        return error(500, 'AI returned invalid JSON');
      }

      // Enrich any places Claude couldn't resolve via Google Places API
      const enrichedPlaces = await enrichWithGooglePlaces(parsed.places ?? []);

      // Save raw input for audit trail
      const rawInput = await queryOne(
        `INSERT INTO raw_text_inputs (trip_id, user_id, raw_text, parsed_result)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [tripId, user.id, raw_text, JSON.stringify({ places: enrichedPlaces, itinerary_items: parsed.itinerary_items })]
      );

      return ok({
        places: enrichedPlaces,
        itinerary_items: parsed.itinerary_items,
        raw_input_id: rawInput!.id,
      });
    }

    // POST /v1/trips/:tripId/parse/confirm
    if (method === 'POST' && path.endsWith('/parse/confirm')) {
      const { places, itinerary_items } = body as {
        places: any[];
        itinerary_items: any[];
      };

      const createdPlaces: any[] = [];
      for (const p of places ?? []) {
        const place = await queryOne(
          `INSERT INTO places (trip_id, added_by_user_id, name, google_place_id, google_place_url,
            address, lat, lng, notes, is_highlight, category)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
          [tripId, user.id, p.name, p.google_place_id ?? null, p.google_place_url ?? null,
           p.address ?? null, p.lat ?? null, p.lng ?? null, p.notes ?? null,
           p.is_highlight ?? false, p.category ?? null]
        );
        createdPlaces.push(place);
      }

      const createdItems: any[] = [];
      for (const item of itinerary_items ?? []) {
        const placeId = item.place_index != null ? (createdPlaces[item.place_index]?.id ?? null) : null;
        const itItem = await queryOne(
          `INSERT INTO itinerary_items (trip_id, place_id, title, item_type, description, start_time, end_time, day_index, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,
             (SELECT COALESCE(MAX(sort_order),0)+1 FROM itinerary_items WHERE trip_id=$1))
           RETURNING *`,
          [tripId, placeId, item.title, item.item_type ?? 'other', item.description ?? null,
           item.start_time ?? null, item.end_time ?? null, item.day_index ?? null]
        );
        createdItems.push(itItem);
      }

      return ok({
        places_created: createdPlaces.length,
        itinerary_items_created: createdItems.length,
      });
    }

    return error(404, 'Not found');
  } catch (e) {
    return handleError(e);
  }
}
