import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, addDays, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { itineraryApi } from '../api/itinerary';
import { ItineraryItem } from '../types/models';

export const itineraryKeys = {
  list: (tripId: string) => ['itinerary', tripId] as const,
};

// Returns the YYYY-MM-DD date key for an item, in the trip's timezone if provided
function getDateKey(item: ItineraryItem, tripStartDate?: string, tripTimezone?: string): string | null {
  if (item.start_time) {
    return tripTimezone
      ? formatInTimeZone(new Date(item.start_time), tripTimezone, 'yyyy-MM-dd')
      : item.start_time.slice(0, 10);
  }
  if (item.day_index != null && tripStartDate) {
    // day_index is 1-based
    return format(addDays(parseISO(tripStartDate), item.day_index - 1), 'yyyy-MM-dd');
  }
  return null;
}

function formatDateLabel(dateKey: string): string {
  const date = parseISO(dateKey);
  return format(date, 'EEE, MMM d'); // e.g. "Mon, Apr 7"
}

export function useItinerary(tripId: string, tripStartDate?: string, tripTimezone?: string) {
  return useQuery({
    queryKey: [...itineraryKeys.list(tripId), tripStartDate],
    queryFn: () => itineraryApi.list(tripId),
    enabled: !!tripId,
    select: (items) => {
      const dateMap = new Map<string, ItineraryItem[]>();
      const unscheduled: ItineraryItem[] = [];

      items.forEach((item) => {
        const key = getDateKey(item, tripStartDate, tripTimezone);
        if (key) {
          const arr = dateMap.get(key) ?? [];
          arr.push(item);
          dateMap.set(key, arr);
        } else {
          unscheduled.push(item);
        }
      });

      const sortItems = (arr: ItineraryItem[]) =>
        [...arr].sort((a, b) => {
          if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
          return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        });

      const grouped: { dateKey: string | null; label: string; items: ItineraryItem[] }[] = [];
      Array.from(dateMap.keys())
        .sort()
        .forEach((key) =>
          grouped.push({ dateKey: key, label: formatDateLabel(key), items: sortItems(dateMap.get(key)!) })
        );
      if (unscheduled.length) {
        grouped.push({ dateKey: null, label: 'Unscheduled', items: sortItems(unscheduled) });
      }
      return grouped;
    },
  });
}

export function useCreateItineraryItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof itineraryApi.create>[1]) =>
      itineraryApi.create(tripId, data),
    onSettled: () => qc?.invalidateQueries({ queryKey: itineraryKeys.list(tripId) }),
  });
}

export function useUpdateItineraryItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Partial<ItineraryItem> }) =>
      itineraryApi.update(tripId, itemId, data),
    onSuccess: (updatedItem) => {
      qc.setQueriesData<ItineraryItem[]>(
        { queryKey: itineraryKeys.list(tripId) },
        (old) => old?.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: itineraryKeys.list(tripId) }),
  });
}

export function useDeleteItineraryItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => itineraryApi.delete(tripId, itemId),
    onSettled: () => qc?.invalidateQueries({ queryKey: itineraryKeys.list(tripId) }),
  });
}
