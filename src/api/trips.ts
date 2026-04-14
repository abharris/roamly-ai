import { apiClient } from './client';
import { Trip, TripMember, TripRole } from '../types/models';

export const tripsApi = {
  list: () => apiClient.get<Trip[]>('/trips').then((r) => r.data),

  get: (tripId: string) => apiClient.get<Trip>(`/trips/${tripId}`).then((r) => r.data),

  create: (data: { name: string; location: string; start_date?: string; end_date?: string; notes?: string; google_place_id?: string }) =>
    apiClient.post<Trip>('/trips', data).then((r) => r.data),

  update: (tripId: string, data: Partial<Pick<Trip, 'name' | 'location' | 'notes' | 'start_date' | 'end_date'>>) =>
    apiClient.put<Trip>(`/trips/${tripId}`, data).then((r) => r.data),

  delete: (tripId: string) => apiClient.delete(`/trips/${tripId}`),

  listMembers: (tripId: string) =>
    apiClient.get<TripMember[]>(`/trips/${tripId}/members`).then((r) => r.data),

  addMember: (tripId: string, data: { user_id: string; role: TripRole }) =>
    apiClient.post<TripMember>(`/trips/${tripId}/members`, data).then((r) => r.data),

  removeMember: (tripId: string, userId: string) =>
    apiClient.delete(`/trips/${tripId}/members/${userId}`),
};
