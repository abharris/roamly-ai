import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ParsedPlace, ParsedItineraryItem, ParseResult } from '../../types/models';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useConfirmParsed } from '../../hooks/useAIParse';
import { Colors, Fonts } from '../../theme';

interface ParsedResultsReviewProps {
  tripId: string;
  result: ParseResult;
  onConfirmed: () => void;
  onBack: () => void;
}

export function ParsedResultsReview({ tripId, result, onConfirmed, onBack }: ParsedResultsReviewProps) {
  const [places, setPlaces] = useState<ParsedPlace[]>(result.places);
  const [items, setItems] = useState<ParsedItineraryItem[]>(result.itinerary_items);
  const confirmMutation = useConfirmParsed(tripId);

  const removePlace = (index: number) => setPlaces((p) => p.filter((_, i) => i !== index));
  const removeItem = (index: number) => setItems((it) => it.filter((_, i) => i !== index));

  const handleConfirm = () => {
    confirmMutation.mutate(
      { places, itinerary_items: items, raw_input_id: result.raw_input_id },
      { onSuccess: onConfirmed }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Review Parsed Results</Text>
      <Text style={styles.sub}>Remove anything that doesn't look right before saving.</Text>

      {places.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>📍 Places ({places.length})</Text>
          {places.map((place, i) => (
            <View key={i} style={styles.resultCard}>
              <View style={styles.cardRow}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{place.name}</Text>
                  {place.address && <Text style={styles.cardSub}>{place.address}</Text>}
                  {place.category && <Badge label={place.category} color="teal" style={{ marginTop: 4 }} />}
                  {place.notes && <Text style={styles.cardNotes}>{place.notes}</Text>}
                </View>
                <TouchableOpacity onPress={() => removePlace(i)} hitSlop={8} accessibilityLabel={`Remove ${place.name}`} accessibilityRole="button">
                  <Text style={styles.remove}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}

      {items.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>🗓 Itinerary Items ({items.length})</Text>
          {items.map((item, i) => (
            <View key={i} style={styles.resultCard}>
              <View style={styles.cardRow}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.title}</Text>
                  <Badge label={item.item_type} color="amber" style={{ marginTop: 4 }} />
                  {item.start_time && (
                    <Text style={styles.cardSub}>
                      {item.start_time}{item.end_time ? ` → ${item.end_time}` : ''}
                    </Text>
                  )}
                  {item.description && <Text style={styles.cardNotes}>{item.description}</Text>}
                </View>
                <TouchableOpacity onPress={() => removeItem(i)} hitSlop={8} accessibilityLabel={`Remove ${item.title}`} accessibilityRole="button">
                  <Text style={styles.remove}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}

      {places.length === 0 && items.length === 0 && (
        <Text style={styles.empty}>Nothing to add. Go back and try different text.</Text>
      )}

      <View style={styles.actions}>
        <Button label="Back" onPress={onBack} variant="secondary" style={{ flex: 1 }} />
        <Button
          label="Add to Trip"
          onPress={handleConfirm}
          loading={confirmMutation.isPending}
          disabled={places.length === 0 && items.length === 0}
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  heading: { fontSize: 20, fontFamily: Fonts.displaySemiBold, color: Colors.textPrimary, marginBottom: 6 },
  sub: { fontSize: 14, fontFamily: Fonts.body, color: Colors.textMuted, marginBottom: 20, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontFamily: Fonts.displayMedium, color: Colors.textSecondary, marginBottom: 10 },
  resultCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontFamily: Fonts.bodySemiBold, color: Colors.textPrimary },
  cardSub: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 2 },
  cardNotes: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  remove: { fontSize: 16, color: Colors.textMuted, paddingLeft: 8 },
  empty: { textAlign: 'center', fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 40, fontSize: 15 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
});
