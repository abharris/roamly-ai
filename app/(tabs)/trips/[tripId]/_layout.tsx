import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Tabs, router, useLocalSearchParams } from 'expo-router';
import { ROUTES } from '../../../../src/constants/routes';
import { useQuery } from '@tanstack/react-query';
import { useTripDetail, useTrips, useUpdateTrip, useTripMembers, useAddMember, useRemoveMember } from '../../../../src/hooks/useTrips';
import { useFriends } from '../../../../src/hooks/useFriends';
import { usersApi } from '../../../../src/api/users';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';
import { placesApi } from '../../../../src/api/places';
import { Trip, PlaceSuggestion } from '../../../../src/types/models';
import { Colors, Fonts, FontSizes } from '../../../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

function InnerTabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 10 }}>
      <Text style={{
        fontFamily: Fonts.mono,
        fontSize: FontSizes.label,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: focused ? Colors.primary : '#B4B2A9',
      }}>
        {label}
      </Text>
      <View style={{
        height: 2,
        width: 20,
        borderRadius: 1,
        backgroundColor: focused ? Colors.teal : 'transparent',
        marginTop: 4,
      }} />
    </View>
  );
}

// MM/DD/YYYY → YYYY-MM-DD
function toApiDate(val: string): string | undefined {
  if (val.length < 10) return undefined;
  const [m, d, y] = val.split('/');
  if (!m || !d || !y || y.length < 4) return undefined;
  return `${y}-${m}-${d}`;
}

// YYYY-MM-DD → MM/DD/YYYY
function fromApiDate(val?: string): string {
  if (!val) return '';
  const [y, m, d] = val.split('-');
  return `${m}/${d}/${y}`;
}

function formatDateInput(digits: string): string {
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function EditTripModal({ trip, tripId, onClose }: { trip: Trip; tripId: string; onClose: () => void }) {
  const [name, setName] = useState(trip.name);
  const [locationText, setLocationText] = useState(trip.location);
  const [startDate, setStartDate] = useState(fromApiDate(trip.start_date));
  const [endDate, setEndDate] = useState(fromApiDate(trip.end_date));
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationLocked, setLocationLocked] = useState(true); // true = user selected a value, don't search
  const [loadingSugg, setLoadingSugg] = useState(false);
  const [friendDropdownOpen, setFriendDropdownOpen] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());
  const sessionToken = useRef(Math.random().toString(36).slice(2));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateTrip = useUpdateTrip(tripId);
  const { data: trips } = useTrips();
  const tripFromList = trips?.find((t) => t.id === tripId);
  const { data: membersData, isLoading: membersLoading } = useTripMembers(tripId);
  // Fall back to members embedded in the trips list if the members endpoint returns wrong data
  const members = Array.isArray(membersData)
    ? membersData
    : (tripFromList?.members ?? []);
  const addMember = useAddMember(tripId);
  const removeMember = useRemoveMember(tripId);
  const { data: friendsData } = useFriends();
  const friends = Array.isArray(friendsData) ? friendsData : [];
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: usersApi.getMe });

  // Derive friend User objects from flat API response
  const friendUsers = friends
    .filter((f) => f.status === 'accepted')
    .map((f) => {
      const isRequester = f.requester_id === me?.id;
      return {
        id: isRequester ? f.addressee_id : f.requester_id,
        username: isRequester
          ? f.addressee_username ?? f.addressee?.username
          : f.requester_username ?? f.requester?.username,
      };
    })
    .filter((u) => u.username);

  // Friends not already in the trip
  const memberIds = new Set(members.map((m) => m.user_id));
  const addableFriends = friendUsers.filter((u) => !memberIds.has(u.id));

  useEffect(() => {
    if (locationLocked) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (locationText.trim().length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoadingSugg(true);
      try {
        const results = await placesApi.autocomplete(locationText, sessionToken.current);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
      finally { setLoadingSugg(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [locationText, locationLocked]);

  const handleDateInput = (text: string, setter: (v: string) => void) => {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    setter(formatDateInput(digits));
  };

  const handleSave = async () => {
    if (!name.trim() || !locationText.trim()) return;
    try {
      await new Promise<void>((resolve, reject) =>
        updateTrip.mutate(
          {
            name: name.trim(),
            location: locationText.trim(),
            start_date: toApiDate(startDate) ?? trip.start_date,
            end_date: toApiDate(endDate) ?? trip.end_date,
          },
          { onSuccess: () => resolve(), onError: reject }
        )
      );
      await Promise.all(
        [...selectedFriendIds].map((userId) =>
          addMember.mutateAsync({ user_id: userId, role: 'editor' })
        )
      );
      onClose();
    } catch (e: any) {
      Alert.alert('Failed to save', e?.response?.data?.error ?? e?.message ?? 'Something went wrong');
    }
  };

  const handleRemoveMember = (userId: string, username: string) => {
    Alert.alert('Remove member', `Remove ${username} from this trip?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeMember.mutate(userId) },
    ]);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} accessibilityViewIsModal={true}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.modalContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Trip</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" accessibilityRole="button"><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>

          <Input label="Trip Name" value={name} onChangeText={setName} placeholder="e.g. Paris Spring 2025" />

          {/* Location autocomplete */}
          <View style={styles.autocompleteContainer}>
            <Text style={styles.fieldLabel}>Destination</Text>
            <View style={styles.autocompleteRow}>
              <TextInput
                style={styles.autocompleteInput}
                value={locationText}
                onChangeText={(t) => { setLocationText(t); setLocationLocked(false); setShowSuggestions(true); }}
                placeholder="e.g. Paris, France"
                placeholderTextColor={Colors.textMuted}
                autoCorrect={false}
              />
              {loadingSugg && <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 10 }} />}
            </View>
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsList}>
                {suggestions.map((s) => (
                  <TouchableOpacity
                    key={s.google_place_id}
                    style={styles.suggestionItem}
                    onPress={() => { setLocationText(s.description); setSuggestions([]); setShowSuggestions(false); setLocationLocked(true); }}
                    accessibilityLabel={s.description}
                    accessibilityRole="button"
                  >
                    <Text style={styles.suggMain}>{s.main_text}</Text>
                    <Text style={styles.suggSub}>{s.secondary_text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Dates */}
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>Start Date</Text>
              <TextInput
                style={styles.dateInput}
                value={startDate}
                onChangeText={(t) => handleDateInput(t, setStartDate)}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>End Date</Text>
              <TextInput
                style={styles.dateInput}
                value={endDate}
                onChangeText={(t) => handleDateInput(t, setEndDate)}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          </View>

          {/* Current members */}
          <Text style={styles.sectionLabel}>Members</Text>
          {membersLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginBottom: 12 }} />
          ) : (
            <View style={styles.membersList}>
              {members.map((m) => {
                const username = m.username ?? m.user?.username ?? m.user_id;
                const isOwner = m.role === 'owner';
                const isMe = m.user_id === me?.id;
                return (
                  <View key={m.user_id} style={styles.memberRow}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberInitial}>{username?.[0]?.toUpperCase() ?? '?'}</Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{username}{isMe ? ' (you)' : ''}</Text>
                      <Text style={styles.memberRole}>{m.role}</Text>
                    </View>
                    {!isOwner && !isMe && (
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleRemoveMember(m.user_id, username)}
                        accessibilityLabel={`Remove ${username} from trip`}
                        accessibilityRole="button"
                      >
                        <Text style={styles.removeBtnText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Add friends dropdown */}
          {addableFriends.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Add Friends</Text>
              <TouchableOpacity
                style={styles.friendDropdownBtn}
                onPress={() => setFriendDropdownOpen((v) => !v)}
                activeOpacity={0.8}
                accessibilityLabel={friendDropdownOpen ? 'Close friend selector' : 'Select friends to add'}
                accessibilityRole="togglebutton"
                accessibilityState={{ checked: friendDropdownOpen }}
              >
                <Text style={styles.friendDropdownBtnText}>
                  {selectedFriendIds.size > 0
                    ? `${selectedFriendIds.size} friend${selectedFriendIds.size > 1 ? 's' : ''} selected`
                    : 'Select friends to add'}
                </Text>
                <Text style={styles.friendDropdownCaret}>{friendDropdownOpen ? '▴' : '▾'}</Text>
              </TouchableOpacity>
              {friendDropdownOpen && (
                <View style={styles.friendDropdownList}>
                  {addableFriends.map((u) => {
                    const selected = selectedFriendIds.has(u.id);
                    return (
                      <TouchableOpacity
                        key={u.id}
                        style={[styles.friendDropdownItem, selected && styles.friendDropdownItemAdded]}
                        onPress={() => {
                          setSelectedFriendIds((prev) => {
                            const next = new Set(prev);
                            selected ? next.delete(u.id) : next.add(u.id);
                            return next;
                          });
                        }}
                        activeOpacity={0.7}
                        accessibilityLabel={selected ? `Remove ${u.username}` : `Add ${u.username}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                      >
                        <Text style={[styles.friendDropdownItemText, selected && styles.friendDropdownItemTextAdded]}>
                          {u.username}
                        </Text>
                        {selected && <Text style={styles.friendDropdownCheck}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}

          <Button
            label="Save Changes"
            onPress={handleSave}
            loading={updateTrip.isPending || addMember.isPending}
            disabled={!name.trim() || !locationText.trim()}
            style={{ marginTop: 24 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function TripDetailLayout() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { data: trip } = useTripDetail(tripId);
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: Colors.white, borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight } as any,
          headerTitleStyle: { fontFamily: Fonts.displaySemiBold, fontSize: FontSizes.body, color: Colors.textPrimary },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace(ROUTES.trips)} style={{ paddingLeft: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }} accessibilityLabel="Go back to Trips" accessibilityRole="button">
              <Ionicons name="chevron-back" size={18} color={Colors.primary} />
              <Text style={{ fontSize: FontSizes.small, fontFamily: Fonts.displayMedium, color: Colors.primary }}>Trips</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowEdit(true)} style={{ paddingRight: 16 }} accessibilityLabel="Edit trip" accessibilityRole="button">
              <Text style={{ fontSize: FontSizes.small, fontFamily: Fonts.mono, color: Colors.primary, letterSpacing: 0.3 }}>Edit</Text>
            </TouchableOpacity>
          ),
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen
          name="places"
          options={{
            title: trip?.name ?? 'Trip',
            tabBarLabel: ({ focused }) => <InnerTabLabel label="Places" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="itinerary"
          options={{
            title: trip?.name ?? 'Trip',
            tabBarLabel: ({ focused }) => <InnerTabLabel label="Itinerary" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="add-raw"
          options={{
            title: trip?.name ?? 'Trip',
            tabBarLabel: ({ focused }) => <InnerTabLabel label="Add" focused={focused} />,
          }}
        />
      </Tabs>

      {showEdit && trip && (
        <EditTripModal trip={trip} tripId={tripId} onClose={() => setShowEdit(false)} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: { padding: 24, paddingBottom: 48 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontFamily: Fonts.displaySemiBold, color: Colors.textPrimary },
  closeBtn: { fontSize: 20, color: Colors.textMuted, padding: 4 },
  fieldLabel: { fontSize: 13, fontFamily: Fonts.bodySemiBold, color: Colors.textSecondary, marginBottom: 6 },
  autocompleteContainer: { marginBottom: 16 },
  autocompleteRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 12, backgroundColor: Colors.white },
  autocompleteInput: { flex: 1, fontSize: 15, fontFamily: Fonts.body, color: Colors.textPrimary, paddingHorizontal: 14, paddingVertical: 12 },
  suggestionsList: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, backgroundColor: Colors.white, marginTop: 4 },
  suggestionItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  suggMain: { fontSize: 14, fontFamily: Fonts.bodySemiBold, color: Colors.textPrimary },
  suggSub: { fontSize: 12, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 1 },
  dateRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  dateField: { flex: 1 },
  dateInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, backgroundColor: Colors.white, fontSize: 15, fontFamily: Fonts.body, color: Colors.textPrimary, paddingHorizontal: 14, paddingVertical: 12 },
  sectionLabel: { fontSize: 13, fontFamily: Fonts.bodySemiBold, color: Colors.textSecondary, marginBottom: 10, marginTop: 4 },
  membersList: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, backgroundColor: Colors.white, marginBottom: 20 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  memberInitial: { fontSize: 16, fontFamily: Fonts.displaySemiBold, color: Colors.primary },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontFamily: Fonts.bodyMedium, color: Colors.textPrimary },
  memberRole: { fontSize: 11, fontFamily: Fonts.mono, color: Colors.textMuted, textTransform: 'uppercase', marginTop: 1 },
  removeBtn: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Colors.errorLight, borderRadius: 8 },
  removeBtnText: { fontSize: 12, fontFamily: Fonts.bodyMedium, color: Colors.errorDark },
  friendDropdownBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4,
  },
  friendDropdownBtnText: { fontSize: 15, fontFamily: Fonts.body, color: Colors.textSecondary },
  friendDropdownCaret: { fontSize: 11, color: Colors.textMuted },
  friendDropdownList: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    backgroundColor: Colors.white, marginBottom: 8,
  },
  friendDropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  friendDropdownItemText: { fontSize: 15, fontFamily: Fonts.body, color: Colors.textPrimary },
  friendDropdownItemAdded: { backgroundColor: Colors.mint },
  friendDropdownItemTextAdded: { color: Colors.primary, fontFamily: Fonts.bodySemiBold },
  friendDropdownCheck: { fontSize: 15, color: Colors.primary, fontFamily: Fonts.bodySemiBold },
});
