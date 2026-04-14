import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { ROUTES } from '../../../src/constants/routes';
import { useTrips } from '../../../src/hooks/useTrips';
import { Trip } from '../../../src/types/models';
import { Card } from '../../../src/components/ui/Card';
import { format } from 'date-fns';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../../../src/theme';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { TripCardSkeleton } from '../../../src/components/ui/SkeletonLoader';
import { CreateTripModal } from '../../../src/components/trips/CreateTripModal';

const MAX_AVATARS = 4;

function TripProgressBar({ trip }: { trip: Trip }) {
  if (!trip.start_date || !trip.end_date) return null;
  const start = new Date(trip.start_date).getTime();
  const end = new Date(trip.end_date).getTime();
  const now = Date.now();
  if (now < start || now > end) return null;
  const progress = Math.min(1, (now - start) / (end - start));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
    </View>
  );
}

function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const dateStr =
    trip.start_date && trip.end_date
      ? `${format(new Date(trip.start_date), 'MMM d')} – ${format(new Date(trip.end_date), 'MMM d, yyyy')}`
      : trip.start_date
      ? `From ${format(new Date(trip.start_date), 'MMM d, yyyy')}`
      : null;

  const members = Array.isArray(trip.members) ? trip.members : [];
  const shown = members.slice(0, MAX_AVATARS);
  const overflow = members.length - MAX_AVATARS;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} accessibilityLabel={`Open ${trip.name} trip`} accessibilityRole="button">
      <Card style={styles.tripCard}>
        <Text style={styles.tripLocation}>{trip.location}</Text>
        <Text style={styles.tripName}>{trip.name}</Text>
        <TripProgressBar trip={trip} />
        <View style={styles.tripFooter}>
          <View style={styles.tripMeta}>
            {dateStr && <Text style={styles.metaText}>{dateStr}</Text>}
            {(trip.places_count != null && trip.places_count > 0) && (
              <Text style={styles.metaText}>{trip.places_count} places</Text>
            )}
          </View>
          {members.length > 0 && (
            <View style={styles.avatarRow}>
              {shown.map((m, i) => {
                const username = m.username ?? m.user?.username ?? '';
                return (
                  <View key={m.user_id ?? i} style={[styles.avatar, { marginLeft: i === 0 ? 0 : -8 }]}>
                    <Text style={styles.avatarText}>{username[0]?.toUpperCase() ?? '?'}</Text>
                  </View>
                );
              })}
              {overflow > 0 && (
                <View style={[styles.avatar, styles.avatarOverflow, { marginLeft: -8 }]}>
                  <Text style={styles.avatarOverflowText}>+{overflow}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function TripsScreen() {
  const { data: trips, isLoading, error } = useTrips();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (error) {
      // error is displayed inline via the errorText element below
    }
  }, [error]);

  const renderTrip = useCallback(({ item }: { item: Trip }) => (
    <TripCard trip={item} onPress={() => router.push(ROUTES.tripPlaces(item.id))} />
  ), []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>ROAMLY</Text>
          <Text style={styles.heading}>My Trips</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)} accessibilityLabel="Create new trip" accessibilityRole="button">
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>Failed to load trips.</Text>}

      {isLoading ? (
        <View style={styles.list}>
          {[1, 2, 3].map(i => <TripCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={trips ?? []}
          keyExtractor={(t) => t.id}
          renderItem={renderTrip}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="✈️"
              title="No trips yet"
              subtitle="Plan your next adventure. Tap '+ New' to get started."
              actionLabel="+ New Trip"
              onAction={() => setShowCreate(true)}
            />
          }
        />
      )}

      {showCreate && <CreateTripModal onClose={() => setShowCreate(false)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.screenH,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerLabel: {
    fontSize: FontSizes.label,
    fontFamily: Fonts.mono,
    color: Colors.primaryBorder,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heading: { fontSize: FontSizes.title, fontFamily: Fonts.displayBold, color: Colors.white },
  addBtn: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  addBtnText: { color: Colors.primary, fontFamily: Fonts.displayMedium, fontSize: FontSizes.small },
  list: { padding: 16, paddingBottom: 40 },
  tripCard: { marginBottom: 12 },
  tripLocation: { fontSize: 11, fontFamily: Fonts.displayMedium, color: Colors.primary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5 },
  tripName: { fontSize: 20, fontFamily: Fonts.displaySemiBold, color: Colors.textPrimary },
  tripMeta: { flexDirection: 'row', gap: 8, flex: 1 },
  metaText: { fontSize: 12, fontFamily: Fonts.body, color: Colors.textMuted },
  errorText: { fontFamily: Fonts.body, color: Colors.error, textAlign: 'center', marginTop: 20 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyText: { fontSize: 18, fontFamily: Fonts.displayMedium, color: Colors.textSecondary },
  emptySub: { fontSize: 14, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 4 },
  // trip card avatars
  tripFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  avatarRow: { flexDirection: 'row' },
  avatar: { width: 28, height: 28, borderRadius: Radius.avatar, backgroundColor: Colors.mint, borderWidth: 2, borderColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  avatarText: { fontSize: 11, fontFamily: Fonts.bodySemiBold, color: Colors.primary },
  avatarOverflow: { width: 28, height: 28, borderRadius: Radius.avatar, backgroundColor: Colors.bgAlt, borderWidth: 2, borderColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  avatarOverflowText: { fontSize: 11, fontFamily: Fonts.bodySemiBold, color: Colors.textMuted },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.pill,
    marginTop: 10,
    marginBottom: 2,
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.teal,
    borderRadius: Radius.pill,
  },
});
