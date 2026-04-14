import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useGlobalSearchParams, router } from 'expo-router';
import { ROUTES } from '../../../../src/constants/routes';
import { useItinerary, useDeleteItineraryItem } from '../../../../src/hooks/useItinerary';
import { useTripDetail } from '../../../../src/hooks/useTrips';
import { ItineraryItemRow } from '../../../../src/components/itinerary/ItineraryItemRow';
import { AddItemModal } from '../../../../src/components/itinerary/AddItemModal';
import { EditItemModal } from '../../../../src/components/itinerary/EditItemModal';
import { ItineraryItem } from '../../../../src/types/models';
import { Colors, Fonts } from '../../../../src/theme';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { TripFilterBar } from '../../../../src/components/ui/TripFilterBar';
import { AddActionSheet } from '../../../../src/components/ui/AddActionSheet';
import { AddAIModal } from '../../../../src/components/ai/AddAIModal';
import { ItineraryItemSkeleton } from '../../../../src/components/ui/SkeletonLoader';
import { scheduleItineraryNotifications, cancelItemNotification } from '../../../../src/utils/notifications';

export default function ItineraryScreen() {
  const { tripId } = useGlobalSearchParams<{ tripId: string }>();
  const { data: trip } = useTripDetail(tripId);
  const { data: grouped = [], isLoading } = useItinerary(tripId, trip?.start_date, trip?.timezone);
  const deleteItem = useDeleteItineraryItem(tripId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const handleSegmentChange = (seg: 'places' | 'itinerary' | 'add') => {
    if (seg === 'places') {
      router.push(ROUTES.tripPlaces(tripId));
    } else if (seg === 'add') {
      setAddSheetVisible(true);
    }
  };

  const sections = grouped.map((g) => ({
    title: g.label,
    data: g.items,
  }));

  useEffect(() => {
    const allItems = grouped.flatMap((g) => g.items);
    scheduleItineraryNotifications(allItems);
  }, [grouped]);

  const renderItem = ({ item }: { item: ItineraryItem }) => (
    <ItineraryItemRow
      item={item}
      onPress={() => {}}
      onDelete={() => { cancelItemNotification(item.id); deleteItem.mutate(item.id); }}
      onEdit={() => setEditingItem(item)}
      timezone={trip?.timezone}
    />
  );

  const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  ), []);

  return (
    <SafeAreaView style={styles.safe}>
      <TripFilterBar
        activeSegment="itinerary"
        onSegmentChange={handleSegmentChange}
      />
      {isLoading ? (
        <View style={{ paddingTop: 8 }}>
          {[1, 2, 3, 4].map(i => <ItineraryItemSkeleton key={i} />)}
        </View>
      ) : (
        <SectionList
          sections={sections}
          extraData={grouped}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="🗓"
              title="No itinerary yet"
              subtitle={'Add items manually or use the Add tab to get started.'}
            />
          }
        />
      )}

      {showAddModal && <AddItemModal tripId={tripId} tripStartDate={trip?.start_date} tripTimezone={trip?.timezone} onClose={() => setShowAddModal(false)} />}
      {editingItem && <EditItemModal tripId={tripId} item={editingItem} tripTimezone={trip?.timezone} onClose={() => setEditingItem(null)} />}

      <AddActionSheet
        visible={addSheetVisible}
        tripName={trip?.name ?? ''}
        onAddManual={() => setShowAddModal(true)}
        onAddWithAI={() => setShowAIModal(true)}
        onClose={() => setAddSheetVisible(false)}
      />
      {showAIModal && <AddAIModal tripId={tripId} tripStartDate={trip?.start_date} onClose={() => setShowAIModal(false)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  listContent: { paddingBottom: 40 },
  sectionHeader: { backgroundColor: Colors.bgAlt, paddingHorizontal: 16, paddingVertical: 8 },
  sectionTitle: { fontSize: 12, fontFamily: Fonts.monoMedium, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
});
