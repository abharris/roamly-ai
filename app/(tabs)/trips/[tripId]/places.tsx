import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  Modal,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ROUTES } from '../../../../src/constants/routes';
import { usePlaces, useCreatePlace, useUpdatePlace, useDeletePlace, useToggleHighlight } from '../../../../src/hooks/usePlaces';
import { Place } from '../../../../src/types/models';
import { PlaceCard } from '../../../../src/components/places/PlaceCard';
import { PlaceMap } from '../../../../src/components/places/PlaceMap';
import { TripFilterBar } from '../../../../src/components/ui/TripFilterBar';
import { FilterSheet } from '../../../../src/components/ui/FilterSheet';
import { AddActionSheet } from '../../../../src/components/ui/AddActionSheet';
import { useTripDetail } from '../../../../src/hooks/useTrips';
import { AddAIModal } from '../../../../src/components/ai/AddAIModal';
import { Button } from '../../../../src/components/ui/Button';
import { Input } from '../../../../src/components/ui/Input';
import { placesApi } from '../../../../src/api/places';
import { Colors, Fonts } from '../../../../src/theme';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { PlaceCardSkeleton } from '../../../../src/components/ui/SkeletonLoader';

const PLACE_CATEGORIES = ['restaurant', 'bar', 'shop', 'hotel', 'activity', 'other'];

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: Colors.foodText,
  bar:        Colors.barText,
  shop:       Colors.shopText,
  hotel:      Colors.hotelText,
  activity:   Colors.activityText,
  other:      Colors.textSecondary,
};

const MAP_HEIGHT = 280;

function AddPlaceModal({ tripId, onClose }: { tripId: string; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const createPlace = useCreatePlace(tripId);
  const sessiontoken = React.useRef(Math.random().toString(36).slice(2)).current;
  const suppressResults = React.useRef(false);

  const handleSearch = async (text: string) => {
    suppressResults.current = false;
    setQuery(text);
    setSelected(null);
    if (text.length < 2) { setSuggestions([]); return; }
    setLoadingSuggestions(true);
    try {
      const results = await placesApi.autocomplete(text, sessiontoken);
      if (!suppressResults.current) setSuggestions(results);
    } catch { if (!suppressResults.current) setSuggestions([]); }
    finally { setLoadingSuggestions(false); }
  };

  const handleSelectSuggestion = async (s: any) => {
    suppressResults.current = true;
    setQuery(s.description);
    setSuggestions([]);
    try {
      const detail = await placesApi.details(s.google_place_id);
      setSelected(detail);
    } catch { setSelected({ name: s.main_text, address: s.description }); }
  };

  const handleAdd = () => {
    if (!selected && !query.trim()) return;
    createPlace.mutate(
      {
        name: selected?.name ?? query.trim(),
        google_place_id: selected?.google_place_id,
        google_place_url: selected?.google_place_url,
        address: selected?.address,
        lat: selected?.lat,
        lng: selected?.lng,
        notes: notes || undefined,
        category: category || undefined,
      },
      {
        onSuccess: onClose,
        onError: (e: any) => console.error('[addPlace] error:', e?.response?.status, e?.response?.data, e?.message),
      }
    );
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} accessibilityViewIsModal={true}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.modalContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Place</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" accessibilityRole="button"><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>

          <Input label="Search for a place" value={query} onChangeText={handleSearch}
            placeholder="Restaurant name, landmark, hotel..." />
          {loadingSuggestions && <ActivityIndicator style={{ marginBottom: 8 }} color={Colors.primary} />}
          {suggestions.map((s) => (
            <TouchableOpacity key={s.google_place_id} style={styles.suggestion}
              onPress={() => handleSelectSuggestion(s)} accessibilityLabel={s.description} accessibilityRole="button">
              <Text style={styles.suggestionMain}>{s.main_text}</Text>
              <Text style={styles.suggestionSub}>{s.secondary_text}</Text>
            </TouchableOpacity>
          ))}
          {selected && (
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedName}>{selected.name}</Text>
              <Text style={styles.selectedAddress}>{selected.address}</Text>
            </View>
          )}
          <Text style={styles.categoryLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={styles.categoryRow}>
              {PLACE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => setCategory(category === cat ? '' : cat)}
                  accessibilityLabel={cat.charAt(0).toUpperCase() + cat.slice(1)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === cat }}
                >
                  <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Input label="Notes (optional)" value={notes} onChangeText={setNotes}
            placeholder="e.g. Book in advance, try the tasting menu" multiline />
          <Button
            label="Add to Trip"
            onPress={handleAdd}
            loading={createPlace.isPending}
            disabled={!selected && !query.trim()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EditPlaceModal({ tripId, place, onClose }: { tripId: string; place: Place; onClose: () => void }) {
  const [name, setName] = useState(place.name);
  const [category, setCategory] = useState(place.category ?? '');
  const [notes, setNotes] = useState(place.notes ?? '');
  const updatePlace = useUpdatePlace(tripId);

  const handleSave = () => {
    updatePlace.mutate(
      { placeId: place.id, data: { name: name.trim() || place.name, category: category || undefined, notes: notes || undefined } },
      { onSuccess: onClose, onError: (e: any) => Alert.alert('Failed to save', e?.message) }
    );
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} accessibilityViewIsModal={true}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.modalContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Place</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" accessibilityRole="button"><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>

          <Input label="Name" value={name} onChangeText={setName} placeholder="Place name" />

          <Text style={styles.categoryLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={styles.categoryRow}>
              {PLACE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => setCategory(category === cat ? '' : cat)}
                  accessibilityLabel={cat.charAt(0).toUpperCase() + cat.slice(1)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === cat }}
                >
                  <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Input label="Notes (optional)" value={notes} onChangeText={setNotes}
            placeholder="e.g. Book in advance, try the tasting menu" multiline />

          <Button
            label="Save Changes"
            onPress={handleSave}
            loading={updatePlace.isPending}
            disabled={!name.trim()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function PlacesScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { width } = useWindowDimensions();
  const isSplit = width >= 768;

  const [showMap, setShowMap] = useState(true);
  const [activeFilters, setActiveFilters] = useState<{ highlights: string[]; types: string[] }>({
    highlights: [],
    types: [],
  });
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);

  const mapAnim = useRef(new Animated.Value(1)).current;

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const { data: trip } = useTripDetail(tripId);
  const { data: allPlaces = [], isLoading } = usePlaces(tripId);
  const toggleHighlight = useToggleHighlight(tripId);
  const deletePlace = useDeletePlace(tripId);

  const filtered = useMemo(() => {
    return allPlaces.filter(p => {
      if (activeFilters.highlights.includes('Starred') && !p.is_highlight) return false;
      if (activeFilters.types.length > 0 && !activeFilters.types.includes(p.category ?? '')) return false;
      return true;
    });
  }, [allPlaces, activeFilters]);

  const availableTypes = useMemo(() => {
    return PLACE_CATEGORIES.map(cat => ({
      label: cat,
      color: CATEGORY_COLORS[cat] ?? Colors.textSecondary,
      count: allPlaces.filter(p => p.category === cat).length,
    }));
  }, [allPlaces]);

  const mapHeight = mapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, MAP_HEIGHT],
  });
  const mapOpacity = mapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

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

  const handleSegmentChange = (seg: 'places' | 'itinerary' | 'add') => {
    if (seg === 'itinerary') {
      router.push(ROUTES.tripItinerary(tripId));
    } else if (seg === 'add') {
      setAddSheetVisible(true);
    }
  };

  const handleDeletePlace = (place: Place) => {
    Alert.alert('Delete Place', `Remove "${place.name}" from this trip?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePlace.mutate(place.id) },
    ]);
  };

  const renderPlace = useCallback(({ item }: { item: Place }) => (
    <PlaceCard
      place={item}
      selected={item.id === selectedPlaceId}
      onPress={() => setSelectedPlaceId(item.id === selectedPlaceId ? null : item.id)}
      onToggleHighlight={() => toggleHighlight.mutate({ placeId: item.id, is_highlight: !item.is_highlight })}
      onEdit={() => setEditingPlace(item)}
      onDelete={() => handleDeletePlace(item)}
    />
  ), [selectedPlaceId, toggleHighlight, handleDeletePlace]);

  return (
    <View style={styles.container}>
      <TripFilterBar
        activeSegment="places"
        onSegmentChange={handleSegmentChange}
        mapVisible={showMap}
        onMapToggle={handleMapToggle}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
        availableTypes={availableTypes}
        onFilterPress={() => setShowFilterSheet(true)}
      />

      {/* Map — animated collapse/expand, never unmounted */}
      {!isSplit && (
        <Animated.View style={{ height: mapHeight, opacity: mapOpacity }}>
          <PlaceMap
            places={filtered}
            selectedPlaceId={selectedPlaceId}
            onMarkerPress={setSelectedPlaceId}
          />
        </Animated.View>
      )}

      {isSplit && (
        <View style={styles.mapPaneSplit}>
          <PlaceMap
            places={filtered}
            selectedPlaceId={selectedPlaceId}
            onMarkerPress={setSelectedPlaceId}
          />
        </View>
      )}

      {/* Place list */}
      <View style={[styles.listPane, isSplit && styles.listPaneSplit]}>
        {isLoading ? (
          <View style={styles.listContent}>
            {[1, 2, 3].map(i => <PlaceCardSkeleton key={i} />)}
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={p => p.id}
            renderItem={renderPlace}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon="📍"
                title="No places yet"
                subtitle="Use the + Add button above to save restaurants, hotels, and more."
              />
            }
          />
        )}
      </View>

      {showAddModal && <AddPlaceModal tripId={tripId} onClose={() => setShowAddModal(false)} />}
      {showAIModal && <AddAIModal tripId={tripId} tripStartDate={trip?.start_date} onClose={() => setShowAIModal(false)} />}
      {editingPlace && (
        <EditPlaceModal tripId={tripId} place={editingPlace} onClose={() => setEditingPlace(null)} />
      )}

      <FilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        availableTypes={availableTypes}
        activeFilters={activeFilters}
        onApply={(filters) => setActiveFilters(filters)}
      />

      <AddActionSheet
        visible={addSheetVisible}
        tripName={trip?.name ?? ''}
        onAddManual={() => setShowAddModal(true)}
        onAddWithAI={() => setShowAIModal(true)}
        onClose={() => setAddSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  listPane: { flex: 1 },
  listPaneSplit: { maxWidth: 380 },
  mapPaneSplit: { flex: 1 },
  listContent: { padding: 12, paddingBottom: 40 },
  modalContainer: { padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontFamily: Fonts.displaySemiBold, color: Colors.textPrimary },
  closeBtn: { fontSize: 20, color: Colors.textMuted },
  suggestion: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginBottom: 2,
  },
  suggestionMain: { fontSize: 15, fontFamily: Fonts.bodySemiBold, color: Colors.textPrimary },
  suggestionSub: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 1 },
  selectedInfo: {
    backgroundColor: Colors.mint,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  selectedName: { fontSize: 15, fontFamily: Fonts.bodySemiBold, color: Colors.primary },
  selectedAddress: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 2 },
  categoryLabel: { fontSize: 14, fontFamily: Fonts.bodyMedium, color: Colors.textSecondary, marginBottom: 8 },
  categoryRow: { flexDirection: 'row', gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.border },
  categoryChipActive: { backgroundColor: Colors.mint, borderColor: Colors.primary },
  categoryChipText: { fontSize: 13, fontFamily: Fonts.bodyMedium, color: Colors.textSecondary },
  categoryChipTextActive: { color: Colors.primary },
});
