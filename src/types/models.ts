export interface User {
  id: string;
  cognito_sub: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  // populated via JOIN
  requester?: User;
  addressee?: User;
  // flat columns returned by some API responses
  requester_username?: string;
  addressee_username?: string;
}

export interface Trip {
  id: string;
  name: string;
  location: string;
  notes?: string;
  start_date?: string;
  end_date?: string;
  timezone?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  // meta counts returned from API
  places_count?: number;
  itinerary_count?: number;
  members?: TripMember[];
}

export type TripRole = 'owner' | 'editor' | 'viewer';

export interface TripMember {
  trip_id: string;
  user_id: string;
  role: TripRole;
  joined_at: string;
  user?: User;
  // flat column returned by some API responses
  username?: string;
}

export interface Place {
  id: string;
  trip_id: string;
  added_by_user_id: string;
  name: string;
  google_place_id?: string;
  google_place_url?: string;
  address?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  is_highlight: boolean;
  category?: string;
  created_at: string;
  updated_at: string;
}

export type ItineraryItemType =
  | 'flight'
  | 'hotel'
  | 'activity'
  | 'restaurant'
  | 'bar'
  | 'shop'
  | 'transport'
  | 'other';

export interface ItineraryItem {
  id: string;
  trip_id: string;
  place_id?: string;
  place_name?: string;
  place_lat?: number | string;
  place_lng?: number | string;
  place_google_place_url?: string;
  title: string;
  description?: string | null;
  item_type: ItineraryItemType;
  start_time?: string | null;
  end_time?: string | null;
  day_index?: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  place?: Place;
}

export interface Recommendation {
  id: string;
  user_id: string;
  place_id: string;
  trip_id?: string;
  notes?: string;
  source: 'ai_parsed' | 'manual' | 'friend_share';
  created_at: string;
  place?: Place;
}

export interface Review {
  id: string;
  user_id: string;
  place_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body?: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

// AI Parse types
export interface ParsedPlace {
  name: string;
  address_hint?: string;
  notes?: string;
  category?: string;
  // enriched by Google Places
  google_place_id?: string;
  google_place_url?: string;
  lat?: number;
  lng?: number;
  address?: string;
}

export interface ParsedItineraryItem {
  title: string;
  item_type: ItineraryItemType;
  description?: string;
  start_time?: string;
  end_time?: string;
  day_index?: number;
}

export interface ParseResult {
  places: ParsedPlace[];
  itinerary_items: ParsedItineraryItem[];
  raw_input_id: string;
}

// Google Places autocomplete
export interface PlaceSuggestion {
  google_place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

export interface PlaceDetail {
  google_place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  google_place_url: string;
  category?: string;
}
