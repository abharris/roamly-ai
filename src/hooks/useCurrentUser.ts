import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';

export const userKeys = { me: ['user', 'me'] as const };

export function useCurrentUser() {
  return useQuery({ queryKey: userKeys.me, queryFn: usersApi.getMe });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.me }),
  });
}
