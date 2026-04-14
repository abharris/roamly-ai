import { apiClient } from './client';
import { Place, PlaceDetail, PlaceSuggestion } from '../types/models';

export interface PlaceFilters {
  highlight?: boolean;
  category?: string;
  sort?: 'name' | 'created_at';
}

export const placesApi = {
  listAll: () =>
    apiClient.get<(Place & { trip_name: string; trip_location: string })[]>('/places').then((r) => r.data),

  list: (tripId: string, filters?: PlaceFilters) =>
    apiClient.get<Place[]>(`/trips/${tripId}/places`, { params: filters }).then((r) => r.data),

  get: (tripId: string, placeId: string) =>
    apiClient.get<Place>(`/trips/${tripId}/places/${placeId}`).then((r) => r.data),

  create: (tripId: string, data: Partial<Place>) =>
    apiClient.post<Place>(`/trips/${tripId}/places`, data).then((r) => r.data),

  update: (tripId: string, placeId: string, data: Partial<Pick<Place, 'name' | 'notes' | 'is_highlight' | 'category'>>) =>
    apiClient.put<Place>(`/trips/${tripId}/places/${placeId}`, data).then((r) => r.data),

  delete: (tripId: string, placeId: string) =>
    apiClient.delete(`/trips/${tripId}/places/${placeId}`),

  // Google Places proxy — server hides the API key
  autocomplete: (query: string, sessiontoken: string) =>
    apiClient
      .get<PlaceSuggestion[]>('/places/autocomplete', { params: { q: query, sessiontoken } })
      .then((r) => r.data),

  details: (googlePlaceId: string) =>
    apiClient.get<PlaceDetail>(`/places/details/${googlePlaceId}`).then((r) => r.data),
};
