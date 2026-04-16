import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { useAllPlaces } from '../../../src/hooks/usePlaces';
import { Place } from '../../../src/types/models';
import { PlaceCard } from '../../../src/components/places/PlaceCard';
import { PlaceMap } from '../../../src/components/places/PlaceMap';
import { FilterSheet } from '../../../src/components/ui/FilterSheet';
import { Colors, Fonts } from '../../../src/theme';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { PlaceCardSkeleton } from '../../../src/components/ui/SkeletonLoader';

const PLACE_CATEGORIES = ['restaurant', 'bar', 'shop', 'hotel', 'activity', 'other'];

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: Colors.foodText,
  bar:        Colors.barText,
  shop:       Colors.shopText,
  hotel:      Colors.hotelText,
  activity:   Colors.activityText,
  other:      Colors.textSecondary,
};

function FilterIcon({ color }: { color: string }) {
  return (
    <View style={{ gap: 1.5 }}>
      <View style={{ width: 9, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 6, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 4, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

function MapIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 6, height: 6, borderRadius: 3, borderWidth: 1.5, borderColor: color }} />
  );
}

export default function PlacesGlobalScreen() {
  const { data: rawPlaces = [], isLoading } = useAllPlaces();
  const places = Array.isArray(rawPlaces) ? rawPlaces : [];
  const [showMap, setShowMap] = useState(true);
  const [activeFilters, setActiveFilters] = useState<{
    highlights: string[];
    types: string[];
    trips: string[];
    locations: string[];
  }>({ highlights: [], types: [], trips: [], locations: [] });
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const mapAnim = useRef(new Animated.Value(1)).current;
  const mapHeight = mapAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 280] });
  const mapOpacity = mapAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const handleMapToggle = () => {
    const toValue = showMap ? 0 : 1;
    setShowMap(!showMap);
    Animated.timing(mapAnim, {
      toValue,
      duration: 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const trips = useMemo(() => [...new Set(places.map((p) => p.trip_name))].sort(), [places]);
  const locations = useMemo(
    () => [...new Set(places.map((p) => p.trip_location).filter(Boolean))].sort() as string[],
    [places]
  );

  const availableTypes = useMemo(() =>
    PLACE_CATEGORIES.map(cat => ({
      label: cat,
      color: CATEGORY_COLORS[cat] ?? Colors.textSecondary,
      count: places.filter(p => p.category === cat).length,
    })),
    [places]
  );

  const filtered = useMemo(() => {
    return places.filter((p) => {
      if (activeFilters.highlights.includes('Starred') && !p.is_highlight) return false;
      if (activeFilters.types.length > 0 && !activeFilters.types.includes(p.category ?? '')) return false;
      if (activeFilters.trips.length > 0 && !activeFilters.trips.includes(p.trip_name)) return false;
      if (activeFilters.locations.length > 0 && !activeFilters.locations.includes(p.trip_location ?? '')) return false;
      return true;
    });
  }, [places, activeFilters]);

  const hasGeoPlaces = filtered.some((p) => p.lat != null && p.lng != null);

  const filterCount =
    activeFilters.highlights.length +
    activeFilters.types.length +
    activeFilters.trips.length +
    activeFilters.locations.length;
  const filtersActive = filterCount > 0;

  const hasFilters = filtersActive;

  type AllPlace = Place & { trip_name: string; trip_location: string };

  const renderPlace = useCallback(({ item }: { item: AllPlace }) => (
    <PlaceCard
      place={item}
      selected={item.id === selectedPlaceId}
      subtitle={item.trip_name}
      onPress={() => setSelectedPlaceId(item.id === selectedPlaceId ? null : item.id)}
    />
  ), [selectedPlaceId]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.heading}>All Places</Text>
      </View>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <View style={{ flex: 1 }} />

        {/* Map toggle */}
        {hasGeoPlaces && (
          <TouchableOpacity
            style={[styles.iconBtn, showMap && styles.iconBtnOn]}
            onPress={handleMapToggle}
            activeOpacity={0.8}
            accessibilityLabel={showMap ? 'Hide map' : 'Show map'}
            accessibilityRole="togglebutton"
            accessibilityState={{ checked: showMap }}
          >
            <MapIcon color={showMap ? Colors.white : Colors.primary} />
            <Text style={[styles.iconBtnText, showMap && styles.iconBtnTextOn]}>Map</Text>
          </TouchableOpacity>
        )}

        {/* Filter button */}
        <TouchableOpacity
          style={[styles.iconBtn, filtersActive && styles.iconBtnFilter]}
          onPress={() => setShowFilterSheet(true)}
          activeOpacity={0.8}
          accessibilityLabel={filtersActive ? `Open filters (${filterCount} active)` : 'Open filters'}
          accessibilityRole="button"
        >
          <FilterIcon color={filtersActive ? Colors.white : Colors.primary} />
          <Text style={[styles.iconBtnText, filtersActive && styles.iconBtnTextOn]}>Filter</Text>
          {filtersActive && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{filterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {hasGeoPlaces && (
          <Animated.View style={{ height: mapHeight, opacity: mapOpacity }}>
            <PlaceMap
              places={filtered}
              selectedPlaceId={selectedPlaceId}
              onMarkerPress={setSelectedPlaceId}
            />
          </Animated.View>
        )}

        {isLoading ? (
          <View style={styles.listContent}>
            {[1, 2, 3, 4].map(i => <PlaceCardSkeleton key={i} />)}
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(p) => p.id}
            contentContainerStyle={styles.listContent}
            renderItem={renderPlace}
            ListEmptyComponent={
              <EmptyState
                icon="📍"
                title={hasFilters ? 'No places match filters' : 'No places saved yet'}
                subtitle={
                  hasFilters
                    ? 'Try adjusting your filters above.'
                    : 'Save restaurants, hotels, and spots across all your trips.'
                }
              />
            }
          />
        )}
      </View>

      <FilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        availableTypes={availableTypes}
        activeFilters={activeFilters}
        availableTrips={trips}
        availableLocations={locations.length > 0 ? locations : undefined}
        onApply={(filters) => setActiveFilters(filters as typeof activeFilters)}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topBar: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  heading: { fontSize: 28, fontFamily: Fonts.displayBold, color: Colors.textPrimary },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 5,
    backgroundColor: Colors.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  container: { flex: 1 },
  listContent: { padding: 12, paddingBottom: 40 },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  iconBtnOn: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
  },
  iconBtnFilter: {
    backgroundColor: Colors.teal,
    borderWidth: 0,
  },
  iconBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.primary,
  },
  iconBtnTextOn: {
    color: Colors.white,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.teal,
    lineHeight: 10,
  },
});
