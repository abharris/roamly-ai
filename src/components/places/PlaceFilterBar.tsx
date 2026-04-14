import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ScrollView, View } from 'react-native';
import { Colors, Fonts, FontSizes, Radius, Spacing } from '../../theme';

const CATEGORIES = ['All', 'restaurant', 'bar', 'coffee', 'hotel', 'activity', 'shop', 'nature', 'other'];

interface PlaceFilterBarProps {
  selectedCategory: string;
  highlightOnly: boolean;
  onCategoryChange: (cat: string) => void;
  onToggleHighlight: () => void;
  showMap?: boolean;
  onToggleMap?: () => void;
  trips?: string[];
  selectedTrip?: string | null;
  onTripChange?: (trip: string | null) => void;
  locations?: string[];
  selectedLocation?: string | null;
  onLocationChange?: (loc: string | null) => void;
  onClearAll?: () => void;
}

export function PlaceFilterBar({
  selectedCategory,
  highlightOnly,
  onCategoryChange,
  onToggleHighlight,
  showMap,
  onToggleMap,
  trips,
  selectedTrip,
  onTripChange,
  locations,
  selectedLocation,
  onLocationChange,
  onClearAll,
}: PlaceFilterBarProps) {
  const hasActiveFilters =
    highlightOnly || selectedCategory !== 'All' || !!selectedTrip || !!selectedLocation;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {/* Map toggle */}
        {onToggleMap != null && (
          <Chip label="Map" active={!!showMap} onPress={onToggleMap} />
        )}

        {/* Highlights */}
        <Chip label="★ Highlights" active={highlightOnly} onPress={onToggleHighlight} />

        {/* Category chips */}
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            label={cat === 'All' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            active={selectedCategory === cat}
            onPress={() => onCategoryChange(cat)}
          />
        ))}

        {/* Trip chips */}
        {trips?.map((trip) => (
          <Chip
            key={trip}
            label={trip}
            active={selectedTrip === trip}
            onPress={() => onTripChange?.(selectedTrip === trip ? null : trip)}
          />
        ))}

        {/* Location chips */}
        {locations?.map((loc) => (
          <Chip
            key={loc}
            label={loc}
            active={selectedLocation === loc}
            onPress={() => onLocationChange?.(selectedLocation === loc ? null : loc)}
          />
        ))}

        {/* Clear */}
        {onClearAll && hasActiveFilters && (
          <TouchableOpacity style={styles.clearChip} onPress={onClearAll} accessibilityLabel="Clear all filters" accessibilityRole="button">
            <Text style={styles.clearText}>✕ Clear</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight },
  row: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenH,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: Radius.chip,
    backgroundColor: Colors.bgAlt,
    borderWidth: 0.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSizes.label,
    fontFamily: Fonts.mono,
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  chipTextActive: {
    color: Colors.white,
  },
  clearChip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: Radius.chip,
    backgroundColor: Colors.errorLight,
    borderWidth: 0.5,
    borderColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontSize: FontSizes.label,
    fontFamily: Fonts.mono,
    color: Colors.error,
  },
});
