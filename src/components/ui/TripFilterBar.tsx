import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../../theme';

interface TypeOption {
  label: string;
  color: string;
  count: number;
}

interface TripFilterBarProps {
  activeSegment: 'places' | 'itinerary' | 'add';
  onSegmentChange: (s: 'places' | 'itinerary' | 'add') => void;
  mapVisible?: boolean;
  onMapToggle?: () => void;
  activeFilters?: { highlights: string[]; types: string[] };
  onFiltersChange?: (filters: { highlights: string[]; types: string[] }) => void;
  availableTypes?: TypeOption[];
  onFilterPress?: () => void;
}

const SEGMENTS: { key: 'places' | 'itinerary' | 'add'; label: string }[] = [
  { key: 'places', label: 'Places' },
  { key: 'itinerary', label: 'Itinerary' },
  { key: 'add', label: '+ Add' },
];

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
    <View style={{
      width: 6,
      height: 6,
      borderRadius: 3,
      borderWidth: 1.5,
      borderColor: color,
    }} />
  );
}

export function TripFilterBar({
  activeSegment,
  onSegmentChange,
  mapVisible,
  onMapToggle,
  activeFilters,
  onFilterPress,
}: TripFilterBarProps) {
  const filterCount = (activeFilters?.highlights.length ?? 0) + (activeFilters?.types.length ?? 0);
  const filtersActive = filterCount > 0;

  return (
    <View style={styles.wrapper}>
      {/* Segmented control */}
      <View style={styles.track}>
        {SEGMENTS.map(({ key, label }) => {
          const active = activeSegment === key;
          const isAdd = key === 'add';
          return (
            <TouchableOpacity
              key={key}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => onSegmentChange(key)}
              activeOpacity={0.75}
              accessibilityLabel={label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[
                styles.segmentText,
                isAdd && styles.segmentTextAdd,
                active && (isAdd ? styles.segmentTextAddActive : styles.segmentTextActive),
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Map toggle — only rendered when handler is provided */}
      {onMapToggle != null && (
        <TouchableOpacity
          style={[styles.iconBtn, mapVisible && styles.iconBtnOn]}
          onPress={onMapToggle}
          activeOpacity={0.8}
          accessibilityLabel={mapVisible ? 'Hide map' : 'Show map'}
          accessibilityRole="togglebutton"
          accessibilityState={{ checked: mapVisible }}
        >
          <MapIcon color={mapVisible ? Colors.white : Colors.primary} />
          <Text style={[styles.iconBtnText, mapVisible && styles.iconBtnTextOn]}>Map</Text>
        </TouchableOpacity>
      )}

      {/* Filter button — only rendered when handler is provided */}
      {onFilterPress != null && (
        <TouchableOpacity
          style={[styles.iconBtn, filtersActive && styles.iconBtnFilter]}
          onPress={onFilterPress}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 5,
    backgroundColor: Colors.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  track: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.segmentTrack,
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: Colors.white,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  segmentText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.primary,
    fontFamily: Fonts.monoMedium,
  },
  segmentTextAdd: {
    color: Colors.teal,
    fontFamily: Fonts.monoMedium,
  },
  segmentTextAddActive: {
    color: Colors.teal,
    fontFamily: Fonts.monoMedium,
  },
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
