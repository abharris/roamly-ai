import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { friendsApi } from '../api/friends';

export const friendKeys = {
  list: ['friends'] as const,
  requests: ['friends', 'requests'] as const,
  search: (q: string) => ['users', 'search', q] as const,
};

export function useFriends() {
  return useQuery({ queryKey: friendKeys.list, queryFn: friendsApi.list });
}

export function useFriendRequests() {
  return useQuery({ queryKey: friendKeys.requests, queryFn: friendsApi.listRequests });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: friendKeys.search(query),
    queryFn: () => friendsApi.searchUsers(query),
    enabled: query.trim().length >= 2,
  });
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (addressee_id: string) => friendsApi.sendRequest(addressee_id),
    onSuccess: () => qc.invalidateQueries({ queryKey: friendKeys.list }),
  });
}

export function useRespondToFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'accept' | 'decline' }) =>
      friendsApi.respondToRequest(requestId, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: friendKeys.list });
      qc.invalidateQueries({ queryKey: friendKeys.requests });
    },
  });
}

export function useUnfriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendId: string) => friendsApi.unfriend(friendId),
    onSuccess: () => qc.invalidateQueries({ queryKey: friendKeys.list }),
  });
}
