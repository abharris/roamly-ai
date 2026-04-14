import { apiClient } from './client';
import { ItineraryItem, ItineraryItemType } from '../types/models';

export const itineraryApi = {
  list: (tripId: string) =>
    apiClient.get<ItineraryItem[]>(`/trips/${tripId}/itinerary`).then((r) => r.data),

  create: (
    tripId: string,
    data: {
      title: string;
      item_type: ItineraryItemType;
      description?: string;
      place_id?: string;
      start_time?: string;
      end_time?: string;
      day_index?: number;
    }
  ) => apiClient.post<ItineraryItem>(`/trips/${tripId}/itinerary`, data).then((r) => r.data),

  update: (tripId: string, itemId: string, data: Partial<ItineraryItem>) =>
    apiClient.put<ItineraryItem>(`/trips/${tripId}/itinerary/${itemId}`, data).then((r) => r.data),

  delete: (tripId: string, itemId: string) =>
    apiClient.delete(`/trips/${tripId}/itinerary/${itemId}`),

  reorder: (tripId: string, items: { id: string; sort_order: number }[]) =>
    apiClient.post(`/trips/${tripId}/itinerary/reorder`, { items }),
};
