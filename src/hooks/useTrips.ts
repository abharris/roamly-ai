import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tripsApi } from '../api/trips';
import { Trip, TripRole } from '../types/models';

export const tripKeys = {
  all: ['trips'] as const,
  detail: (id: string) => ['trips', id] as const,
  members: (id: string) => ['trips', id, 'members'] as const,
};

export function useTrips() {
  return useQuery({ queryKey: tripKeys.all, queryFn: tripsApi.list });
}

export function useTripDetail(tripId: string) {
  return useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: () => tripsApi.get(tripId),
    enabled: !!tripId,
  });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

export function useUpdateTrip(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Trip>) => tripsApi.update(tripId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      qc.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

export function useTripMembers(tripId: string) {
  return useQuery({
    queryKey: tripKeys.members(tripId),
    queryFn: () => tripsApi.listMembers(tripId),
    enabled: !!tripId,
  });
}

export function useAddMember(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { user_id: string; role: TripRole }) => tripsApi.addMember(tripId, data),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: tripKeys.members(tripId) });
      qc.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

export function useRemoveMember(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => tripsApi.removeMember(tripId, userId),
    onSettled: () => qc.invalidateQueries({ queryKey: tripKeys.members(tripId) }),
  });
}
