import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/ai';
import { useParseStore } from '../store/parseStore';
import { placeKeys } from './usePlaces';
import { itineraryKeys } from './useItinerary';

export function useParseRawText(tripId: string) {
  const { setParsedResult } = useParseStore();
  return useMutation({
    mutationFn: (data: { raw_text: string; trip_start_date?: string }) =>
      aiApi.parse(tripId, data),
    onSuccess: (result) => setParsedResult(result),
  });
}

export function useConfirmParsed(tripId: string) {
  const qc = useQueryClient();
  const { clearParsedResult } = useParseStore();
  return useMutation({
    mutationFn: (data: Parameters<typeof aiApi.confirm>[1]) =>
      aiApi.confirm(tripId, data),
    onSuccess: () => {
      clearParsedResult();
      qc.invalidateQueries({ queryKey: placeKeys.list(tripId) });
      qc.invalidateQueries({ queryKey: itineraryKeys.list(tripId) });
    },
  });
}
