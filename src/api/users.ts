import { apiClient } from './client';
import { User } from '../types/models';

export const usersApi = {
  getMe: () => apiClient.get<User>('/users/me').then((r) => r.data),

  updateMe: (data: Partial<Pick<User, 'username' | 'avatar_url'>>) =>
    apiClient.put<User>('/users/me', data).then((r) => r.data),

  createProfile: (data: { username: string }) =>
    apiClient.post<User>('/users/profile', data).then((r) => r.data),

  getUser: (userId: string) =>
    apiClient.get<User>(`/users/${userId}`).then((r) => r.data),
};
