import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Colors, Fonts } from '../../theme';

interface TypeOption {
  label: string;
  color: string;
  count: number;
}

interface ActiveFilters {
  highlights: string[];
  types: string[];
  trips?: string[];
  locations?: string[];
}

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  availableTypes: TypeOption[];
  activeFilters: ActiveFilters;
  onApply: (filters: ActiveFilters) => void;
  availableTrips?: string[];
  availableLocations?: string[];
}

const HIGHLIGHT_OPTIONS = ['Starred'];

export function FilterSheet({
  visible,
  onClose,
  availableTypes,
  activeFilters,
  onApply,
  availableTrips,
  availableLocations,
}: FilterSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [pending, setPending] = useState<ActiveFilters>(activeFilters);

  // Sync pending state when sheet opens
  useEffect(() => {
    if (visible) {
      setPending(activeFilters);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const toggleHighlight = (label: string) => {
    setPending(prev => ({
      ...prev,
      highlights: prev.highlights.includes(label)
        ? prev.highlights.filter(h => h !== label)
        : [...prev.highlights, label],
    }));
  };

  const toggleType = (label: string) => {
    setPending(prev => ({
      ...prev,
      types: prev.types.includes(label)
        ? prev.types.filter(t => t !== label)
        : [...prev.types, label],
    }));
  };

  const toggleTrip = (label: string) => {
    setPending(prev => ({
      ...prev,
      trips: (prev.trips ?? []).includes(label)
        ? (prev.trips ?? []).filter(t => t !== label)
        : [...(prev.trips ?? []), label],
    }));
  };

  const toggleLocation = (label: string) => {
    setPending(prev => ({
      ...prev,
      locations: (prev.locations ?? []).includes(label)
        ? (prev.locations ?? []).filter(l => l !== label)
        : [...(prev.locations ?? []), label],
    }));
  };

  const pendingCount =
    pending.highlights.length +
    pending.types.length +
    (pending.trips?.length ?? 0) +
    (pending.locations?.length ?? 0);
  const applyLabel = pendingCount > 0 ? 'Apply filters' : 'Clear filters';

  const handleApply = () => {
    onApply(pending);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} accessibilityViewIsModal={true}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close filters" accessibilityRole="button" />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Handle */}
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Highlights */}
          <Text style={styles.sectionLabel}>HIGHLIGHTS</Text>
          <View style={styles.chipsRow}>
            {HIGHLIGHT_OPTIONS.map(opt => {
              const active = pending.highlights.includes(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleHighlight(opt)}
                  activeOpacity={0.75}
                  accessibilityLabel={opt}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Types */}
          {availableTypes.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>TYPE</Text>
              {availableTypes.map(t => {
                const active = pending.types.includes(t.label);
                return (
                  <TouchableOpacity
                    key={t.label}
                    style={styles.typeRow}
                    onPress={() => toggleType(t.label)}
                    activeOpacity={0.75}
                    accessibilityLabel={`${t.label}, ${t.count} places`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <View style={[styles.typeDot, { backgroundColor: t.color }]} />
                    <Text style={styles.typeLabel}>{t.label}</Text>
                    <Text style={styles.typeCount}>{t.count}</Text>
                    <View style={[styles.checkbox, active && styles.checkboxActive]}>
                      {active && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* Trips */}
          {availableTrips && availableTrips.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>TRIP</Text>
              {availableTrips.map(trip => {
                const active = (pending.trips ?? []).includes(trip);
                return (
                  <TouchableOpacity
                    key={trip}
                    style={styles.typeRow}
                    onPress={() => toggleTrip(trip)}
                    activeOpacity={0.75}
                    accessibilityLabel={trip}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.typeLabel, { marginLeft: 0 }]}>{trip}</Text>
                    <View style={[styles.checkbox, active && styles.checkboxActive]}>
                      {active && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* Locations */}
          {availableLocations && availableLocations.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>LOCATION</Text>
              {availableLocations.map(loc => {
                const active = (pending.locations ?? []).includes(loc);
                return (
                  <TouchableOpacity
                    key={loc}
                    style={styles.typeRow}
                    onPress={() => toggleLocation(loc)}
                    activeOpacity={0.75}
                    accessibilityLabel={loc}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={styles.typeLabel}>{loc}</Text>
                    <View style={[styles.checkbox, active && styles.checkboxActive]}>
                      {active && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85} accessibilityLabel={applyLabel} accessibilityRole="button">
          <Text style={styles.applyBtnText}>{applyLabel}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45,50,80,0.35)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 10,
    maxHeight: '70%',
  },
  handleWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  handle: {
    width: 32,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
  },
  chipText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.primary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.bg,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeLabel: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  typeCount: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textMuted,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  checkmark: {
    fontSize: 10,
    color: Colors.white,
    lineHeight: 12,
  },
  applyBtn: {
    marginTop: 14,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  applyBtnText: {
    fontFamily: Fonts.displaySemiBold,
    fontSize: 14,
    color: Colors.white,
  },
});
