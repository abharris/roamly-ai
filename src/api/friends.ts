import { apiClient } from './client';
import { Friendship, User } from '../types/models';

export const friendsApi = {
  list: () => apiClient.get<Friendship[]>('/friends').then((r) => r.data),

  listRequests: () => apiClient.get<Friendship[]>('/friends/requests').then((r) => r.data),

  sendRequest: (addressee_id: string) =>
    apiClient.post<Friendship>('/friends/requests', { addressee_id }).then((r) => r.data),

  respondToRequest: (requestId: string, action: 'accept' | 'decline') =>
    apiClient.put<Friendship>(`/friends/requests/${requestId}`, { action }).then((r) => r.data),

  unfriend: (friendId: string) => apiClient.delete(`/friends/${friendId}`),

  searchUsers: (query: string) =>
    apiClient.get<User[]>('/users/search', { params: { q: query } }).then((r) => r.data),
};
