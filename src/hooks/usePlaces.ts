import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { placesApi, PlaceFilters } from '../api/places';
import { Place } from '../types/models';

export const placeKeys = {
  all: (tripId: string) => ['places', tripId] as const,
  list: (tripId: string, filters?: PlaceFilters) => ['places', tripId, 'list', filters] as const,
  detail: (tripId: string, placeId: string) => ['places', tripId, placeId] as const,
};

export function useAllPlaces() {
  return useQuery({
    queryKey: ['places', 'all'],
    queryFn: () => placesApi.listAll(),
  });
}

export function usePlaces(tripId: string, filters?: PlaceFilters) {
  return useQuery({
    queryKey: placeKeys.list(tripId, filters),
    queryFn: () => placesApi.list(tripId, filters),
    enabled: !!tripId,
  });
}

export function useCreatePlace(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Place>) => placesApi.create(tripId, data),
    onSettled: () => qc.invalidateQueries({ queryKey: placeKeys.all(tripId) }),
  });
}

export function useUpdatePlace(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ placeId, data }: { placeId: string; data: Partial<Place> }) =>
      placesApi.update(tripId, placeId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: placeKeys.all(tripId) }),
  });
}

export function useDeletePlace(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (placeId: string) => placesApi.delete(tripId, placeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: placeKeys.all(tripId) }),
  });
}

export function useToggleHighlight(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ placeId, is_highlight }: { placeId: string; is_highlight: boolean }) =>
      placesApi.update(tripId, placeId, { is_highlight }),
    onSettled: () => qc.invalidateQueries({ queryKey: placeKeys.all(tripId) }),
  });
}
