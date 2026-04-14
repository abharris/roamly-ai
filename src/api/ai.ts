import { apiClient } from './client';
import { ParseResult, ParsedPlace, ParsedItineraryItem } from '../types/models';

export const aiApi = {
  parse: (tripId: string, data: { raw_text: string; trip_start_date?: string }) =>
    apiClient.post<ParseResult>(`/trips/${tripId}/parse`, data).then((r) => r.data),

  confirm: (
    tripId: string,
    data: {
      places: ParsedPlace[];
      itinerary_items: ParsedItineraryItem[];
      raw_input_id: string;
    }
  ) => apiClient.post(`/trips/${tripId}/parse/confirm`, data).then((r) => r.data),
};
