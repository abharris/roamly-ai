import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useCreateTrip } from '../../hooks/useTrips';
import { useFriends } from '../../hooks/useFriends';
import { PlaceSuggestion } from '../../types/models';
import { tripsApi } from '../../api/trips';
import { usersApi } from '../../api/users';
import { placesApi } from '../../api/places';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Colors, Fonts, Radius } from '../../theme';

// Formats digit-only input into MM/DD/YYYY as the user types
function formatDateInput(digits: string): string {
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

// Converts MM/DD/YYYY → YYYY-MM-DD for the API
function toApiDate(val: string): string | undefined {
  if (val.length < 10) return undefined;
  const [m, d, y] = val.split('/');
  if (!m || !d || !y || y.length < 4) return undefined;
  return `${y}-${m}-${d}`;
}

interface CreateTripModalProps {
  onClose: () => void;
}

export function CreateTripModal({ onClose }: CreateTripModalProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [friendDropdownOpen, setFriendDropdownOpen] = useState(false);

  // Location autocomplete
  const [locationText, setLocationText] = useState('');
  const [locationPlaceId, setLocationPlaceId] = useState<string | undefined>();
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const sessionToken = useRef(Math.random().toString(36).slice(2));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (locationText.trim().length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const results = await placesApi.autocomplete(locationText, sessionToken.current);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [locationText]);

  const createTrip = useCreateTrip();
  const { data: friends = [] } = useFriends();
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: usersApi.getMe });

  const friendUsers = friends
    .filter(f => f.status === 'accepted')
    .map(f => {
      const isRequester = f.requester_id === me?.id;
      return {
        id: isRequester ? f.addressee_id : f.requester_id,
        username: isRequester
          ? f.addressee_username ?? f.addressee?.username
          : f.requester_username ?? f.requester?.username,
      };
    })
    .filter((u): u is { id: string; username: string } => !!u.username);

  const toggleFriend = (userId: string) => {
    setSelectedFriends(prev => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  const handleDateInput = (text: string, setter: (v: string) => void) => {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    setter(formatDateInput(digits));
  };

  const handleCreate = async () => {
    if (!name.trim() || !locationText.trim()) return;
    createTrip.mutate(
      {
        name: name.trim(),
        location: locationText.trim(),
        start_date: toApiDate(startDate),
        end_date: toApiDate(endDate),
        google_place_id: locationPlaceId,
      },
      {
        onSuccess: async (trip) => {
          await Promise.all(
            [...selectedFriends].map(userId => tripsApi.addMember(trip.id, { user_id: userId, role: 'editor' }))
          );
          onClose();
        },
      }
    );
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} accessibilityViewIsModal={true}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.modalContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Trip</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" accessibilityRole="button"><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>

          <Input label="Trip Name" value={name} onChangeText={setName} placeholder="e.g. Paris Spring 2025" />

          {/* Location autocomplete */}
          <View style={styles.autocompleteContainer}>
            <Text style={styles.inputLabel}>Destination</Text>
            <View style={styles.autocompleteInputRow}>
              <TextInput
                style={styles.autocompleteInput}
                value={locationText}
                onChangeText={t => { setLocationText(t); setShowSuggestions(true); }}
                placeholder="e.g. Paris, France"
                placeholderTextColor={Colors.textMuted}
                autoCorrect={false}
              />
              {loadingSuggestions && <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 10 }} />}
            </View>
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsList}>
                {suggestions.map(s => (
                  <TouchableOpacity
                    key={s.google_place_id}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setLocationText(s.description);
                      setLocationPlaceId(s.google_place_id);
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    accessibilityLabel={s.description}
                    accessibilityRole="button"
                  >
                    <Text style={styles.suggestionMain}>{s.main_text}</Text>
                    <Text style={styles.suggestionSub}>{s.secondary_text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Date inputs */}
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <TextInput
                style={styles.dateInput}
                value={startDate}
                onChangeText={t => handleDateInput(t, setStartDate)}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.inputLabel}>End Date</Text>
              <TextInput
                style={styles.dateInput}
                value={endDate}
                onChangeText={t => handleDateInput(t, setEndDate)}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          </View>

          {friendUsers.length > 0 && (
            <View style={styles.friendsSection}>
              <Text style={styles.friendsLabel}>Invite Friends</Text>
              <TouchableOpacity
                style={styles.friendDropdownBtn}
                onPress={() => setFriendDropdownOpen(v => !v)}
                activeOpacity={0.8}
                accessibilityLabel={friendDropdownOpen ? 'Close friend selector' : 'Select friends to invite'}
                accessibilityRole="togglebutton"
                accessibilityState={{ checked: friendDropdownOpen }}
              >
                <Text style={styles.friendDropdownBtnText}>
                  {selectedFriends.size > 0
                    ? `${selectedFriends.size} friend${selectedFriends.size > 1 ? 's' : ''} selected`
                    : 'Select friends to invite'}
                </Text>
                <Text style={styles.friendDropdownCaret}>{friendDropdownOpen ? '▴' : '▾'}</Text>
              </TouchableOpacity>
              {friendDropdownOpen && (
                <View style={styles.friendDropdownList}>
                  {friendUsers.map(user => {
                    const selected = selectedFriends.has(user.id);
                    return (
                      <TouchableOpacity
                        key={user.id}
                        style={[styles.friendDropdownItem, selected && styles.friendDropdownItemSelected]}
                        onPress={() => toggleFriend(user.id)}
                        activeOpacity={0.7}
                        accessibilityLabel={selected ? `Remove ${user.username}` : `Invite ${user.username}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                      >
                        <Text style={[styles.friendDropdownItemText, selected && styles.friendDropdownItemTextSelected]}>
                          {user.username}
                        </Text>
                        {selected && <Text style={styles.friendDropdownCheck}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          <Button
            label="Create Trip"
            onPress={handleCreate}
            loading={createTrip.isPending}
            disabled={!name.trim() || !locationText.trim()}
            style={{ marginTop: 16 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontFamily: Fonts.displaySemiBold, color: Colors.textPrimary },
  closeBtn: { fontSize: 20, color: Colors.textMuted, padding: 4 },
  friendsSection: { marginTop: 16, marginBottom: 8 },
  friendsLabel: { fontSize: 13, fontFamily: Fonts.bodySemiBold, color: Colors.textSecondary, marginBottom: 10 },
  friendDropdownBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.input,
    backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 12,
  },
  friendDropdownBtnText: { fontSize: 15, fontFamily: Fonts.body, color: Colors.textSecondary },
  friendDropdownCaret: { fontSize: 11, color: Colors.textMuted },
  friendDropdownList: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.input,
    backgroundColor: Colors.white, marginTop: 4,
  },
  friendDropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  friendDropdownItemSelected: { backgroundColor: Colors.mint },
  friendDropdownItemText: { fontSize: 15, fontFamily: Fonts.body, color: Colors.textPrimary },
  friendDropdownItemTextSelected: { color: Colors.primary, fontFamily: Fonts.bodySemiBold },
  friendDropdownCheck: { fontSize: 15, color: Colors.primary, fontFamily: Fonts.bodySemiBold },
  // autocomplete
  autocompleteContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontFamily: Fonts.bodySemiBold, color: Colors.textSecondary, marginBottom: 6 },
  autocompleteInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.input, backgroundColor: Colors.white },
  autocompleteInput: { flex: 1, fontSize: 15, fontFamily: Fonts.body, color: Colors.textPrimary, paddingHorizontal: 14, paddingVertical: 12 },
  suggestionsList: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.input, backgroundColor: Colors.white, marginTop: 4 },
  suggestionItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  suggestionMain: { fontSize: 14, fontFamily: Fonts.bodySemiBold, color: Colors.textPrimary },
  suggestionSub: { fontSize: 12, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 1 },
  // dates
  dateRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  dateField: { flex: 1 },
  dateInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.input, backgroundColor: Colors.white, fontSize: 15, fontFamily: Fonts.body, color: Colors.textPrimary, paddingHorizontal: 14, paddingVertical: 12 },
});
