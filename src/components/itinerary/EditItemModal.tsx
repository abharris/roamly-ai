import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useUpdateItineraryItem } from '../../hooks/useItinerary';
import { usePlaces, useCreatePlace } from '../../hooks/usePlaces';
import { placesApi } from '../../api/places';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ItineraryItem, ItineraryItemType, Place } from '../../types/models';
import { Colors, Fonts, Radius } from '../../theme';
import { CalendarTimePicker } from './CalendarTimePicker';
import { ITEM_TYPES, LinkedPlace } from './AddItemModal';

interface EditItemModalProps {
  tripId: string;
  item: ItineraryItem;
  onClose: () => void;
  tripTimezone?: string;
}

export function EditItemModal({ tripId, item, onClose, tripTimezone }: EditItemModalProps) {
  const [title, setTitle] = useState(item.title);
  const [itemType, setItemType] = useState<ItineraryItemType>(item.item_type);
  const [dayIndex, setDayIndex] = useState(item.day_index != null ? String(item.day_index) : '');
  const [description, setDescription] = useState(item.description ?? '');
  const [startTime, setStartTime] = useState<string | undefined>(item.start_time ?? undefined);
  const [endTime, setEndTime] = useState<string | undefined>(item.end_time ?? undefined);
  const [hasEndTime, setHasEndTime] = useState(!!item.end_time);

  // Place linking — initialize from item's current place
  const initialLinkedPlace: LinkedPlace = item.place_id && item.place_name
    ? { type: 'existing', place: { id: item.place_id, name: item.place_name } as Place }
    : null;
  const [linkedPlace, setLinkedPlace] = useState<LinkedPlace>(initialLinkedPlace);
  const [placeSearch, setPlaceSearch] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suppressResults = useRef(false);
  const sessiontoken = useRef(Math.random().toString(36).slice(2)).current;

  const { data: existingPlaces = [] } = usePlaces(tripId);
  const createPlace = useCreatePlace(tripId);
  const updateItem = useUpdateItineraryItem(tripId);

  const handlePlaceSearch = async (text: string) => {
    suppressResults.current = false;
    setPlaceSearch(text);
    setLinkedPlace(null);
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
    setPlaceSearch(s.description);
    setSuggestions([]);
    try {
      const detail = await placesApi.details(s.google_place_id);
      setLinkedPlace({ type: 'new', data: detail });
    } catch {
      setLinkedPlace({ type: 'new', data: { name: s.main_text, address: s.description } });
    }
  };

  const clearPlace = () => {
    setLinkedPlace(null);
    setPlaceSearch('');
    setSuggestions([]);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    try {
      let placeId: string | null = null;
      if (linkedPlace?.type === 'existing') {
        placeId = linkedPlace.place.id;
      } else if (linkedPlace?.type === 'new') {
        const newPlace = await createPlace.mutateAsync(linkedPlace.data);
        placeId = (newPlace as any).id;
      }
      updateItem.mutate(
        {
          itemId: item.id,
          data: {
            title: title.trim(),
            item_type: itemType,
            day_index: dayIndex ? parseInt(dayIndex, 10) : null,
            description: description.trim() || null,
            start_time: startTime || null,
            end_time: hasEndTime ? (endTime || null) : null,
            place_id: placeId ?? undefined,
          },
        },
        {
          onSuccess: onClose,
          onError: (e: any) => {
            const msg = e?.response?.data?.error ?? e?.message ?? JSON.stringify(e);
            console.error('[EditItemModal] save error', e);
            Alert.alert('Failed to save', msg);
          },
        }
      );
    } catch (e: any) {
      Alert.alert('Failed to save', e?.message ?? 'Unknown error');
    }
  };

  const isPending = updateItem.isPending || createPlace.isPending;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} accessibilityViewIsModal={true}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.modalContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Item</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" accessibilityRole="button"><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>

          <Input label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Dinner at Le Bernardin" />

          <Text style={styles.fieldLabel}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={styles.typeRow}>
              {ITEM_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, itemType === t && styles.typeChipActive]}
                  onPress={() => setItemType(t)}
                  accessibilityLabel={t.charAt(0).toUpperCase() + t.slice(1)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: itemType === t }}
                >
                  <Text style={[styles.typeChipText, itemType === t && styles.typeChipTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Place section */}
          <View style={styles.placeLabelRow}>
            <Text style={styles.fieldLabel}>Place</Text>
            {linkedPlace && (
              <TouchableOpacity
                style={[styles.optionalToggle, styles.optionalToggleActive]}
                onPress={clearPlace}
                accessibilityLabel="Remove linked place"
                accessibilityRole="button"
              >
                <Text style={styles.optionalToggleTextActive}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>

          {linkedPlace ? (
            <View style={styles.linkedPlaceRow}>
              <Text style={styles.linkedPlaceName}>
                📍 {linkedPlace.type === 'existing' ? linkedPlace.place.name : linkedPlace.data.name}
              </Text>
            </View>
          ) : (
            <>
              {existingPlaces.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  <View style={styles.typeRow}>
                    {existingPlaces.map(p => (
                      <TouchableOpacity
                        key={p.id}
                        style={styles.placeChip}
                        onPress={() => { setLinkedPlace({ type: 'existing', place: p }); setPlaceSearch(''); setSuggestions([]); }}
                        accessibilityLabel={`Link ${p.name}`}
                        accessibilityRole="button"
                      >
                        <Text style={styles.placeChipText}>{p.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
              <Input
                label=""
                value={placeSearch}
                onChangeText={handlePlaceSearch}
                placeholder="Search to link a place..."
              />
              {loadingSuggestions && <ActivityIndicator style={{ marginBottom: 8 }} color={Colors.primary} />}
              {suggestions.map(s => (
                <TouchableOpacity
                  key={s.google_place_id}
                  style={styles.suggestion}
                  onPress={() => handleSelectSuggestion(s)}
                  accessibilityLabel={s.description}
                  accessibilityRole="button"
                >
                  <Text style={styles.suggestionMain}>{s.main_text}</Text>
                  <Text style={styles.suggestionSub}>{s.secondary_text}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          <Input label="Day (number)" value={dayIndex} onChangeText={setDayIndex}
            placeholder="1" keyboardType="number-pad" />

          <CalendarTimePicker label="Start Time" onChange={setStartTime} initialDate={item.start_time ?? undefined} timezone={tripTimezone} />

          <View style={styles.endTimeToggleRow}>
            <Text style={styles.fieldLabel}>End Time</Text>
            <TouchableOpacity
              style={[styles.optionalToggle, hasEndTime && styles.optionalToggleActive]}
              onPress={() => setHasEndTime(v => !v)}
              accessibilityLabel={hasEndTime ? 'Remove end time' : 'Add end time'}
              accessibilityRole="togglebutton"
              accessibilityState={{ checked: hasEndTime }}
            >
              <Text style={[styles.optionalToggleText, hasEndTime && styles.optionalToggleTextActive]}>
                {hasEndTime ? 'Remove' : '+ Add'}
              </Text>
            </TouchableOpacity>
          </View>
          {hasEndTime && <CalendarTimePicker label="" onChange={setEndTime} initialDate={item.end_time ?? undefined} timezone={tripTimezone} />}

          <Input label="Notes" value={description} onChangeText={setDescription}
            placeholder="Optional details..." multiline />

          <Button label="Save Changes" onPress={handleSave}
            loading={isPending} disabled={!title.trim()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontFamily: Fonts.displaySemiBold, color: Colors.textPrimary },
  closeBtn: { fontSize: 20, color: Colors.textMuted },
  fieldLabel: { fontSize: 14, fontFamily: Fonts.bodyMedium, color: Colors.textSecondary, marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.border },
  typeChipActive: { backgroundColor: Colors.mint, borderColor: Colors.primary },
  typeChipText: { fontSize: 13, fontFamily: Fonts.bodyMedium, color: Colors.textSecondary },
  typeChipTextActive: { color: Colors.primary },
  placeLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  linkedPlaceRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.mint, borderRadius: Radius.icon, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.primaryLight,
  },
  linkedPlaceName: { fontSize: 14, fontFamily: Fonts.bodySemiBold, color: Colors.primary, flex: 1 },
  placeChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.pill,
    backgroundColor: Colors.bgAlt, borderWidth: 1, borderColor: Colors.border,
  },
  placeChipText: { fontSize: 13, fontFamily: Fonts.bodyMedium, color: Colors.textSecondary },
  suggestion: {
    padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.white, borderRadius: 8, marginBottom: 2,
  },
  suggestionMain: { fontSize: 15, fontFamily: Fonts.bodySemiBold, color: Colors.textPrimary },
  suggestionSub: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 1 },
  endTimeToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  optionalToggle: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgAlt,
  },
  optionalToggleActive: { borderColor: Colors.error, backgroundColor: '#FEF2F2' },
  optionalToggleText: { fontSize: 13, fontFamily: Fonts.bodyMedium, color: Colors.textSecondary },
  optionalToggleTextActive: { color: Colors.error },
});
