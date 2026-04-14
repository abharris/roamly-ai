export const ROUTES = {
  auth: '/(auth)' as const,
  trips: '/(tabs)/trips' as const,
  tripPlaces: (tripId: string) => `/(tabs)/trips/${tripId}/places` as const,
  tripItinerary: (tripId: string) => `/(tabs)/trips/${tripId}/itinerary` as const,
} as const;
