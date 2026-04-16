import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { ItineraryItem } from '../../types/models';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Badge } from '../ui/Badge';
import { Colors, Fonts } from '../../theme';


const TYPE_COLORS: Record<string, 'blue' | 'teal' | 'amber' | 'red' | 'gray' | 'sky' | 'pink' | 'purple' | 'orange' | 'green'> = {
  flight: 'sky',
  hotel: 'blue',
  activity: 'purple',
  restaurant: 'amber',
  bar: 'pink',
  shop: 'green',
  transport: 'orange',
  other: 'gray',
};

interface ItineraryItemRowProps {
  item: ItineraryItem;
  onPress: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  timezone?: string;
}

function openInMaps(item: ItineraryItem) {
  if (item.place_google_place_url) {
    Linking.openURL(item.place_google_place_url);
    return;
  }
  const lat = Number(item.place_lat);
  const lng = Number(item.place_lng);
  const name = item.place_name ?? item.title;
  if (!isNaN(lat) && !isNaN(lng) && lat !== 0) {
    Linking.openURL(`https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(name)}`);
  } else {
    Linking.openURL(`https://maps.apple.com/?q=${encodeURIComponent(name)}`);
  }
}

export function ItineraryItemRow({ item, onPress, onDelete, onEdit, timezone }: ItineraryItemRowProps) {
  const swipeRef = useRef<SwipeableMethods>(null);
  const formatTime = (iso?: string | null) => {
    if (!iso) return null;
    return timezone ? formatInTimeZone(new Date(iso), timezone, 'h:mm a') : format(new Date(iso), 'h:mm a');
  };
  const startStr = formatTime(item.start_time);
  const endStr = formatTime(item.end_time);
  const hasPlace = !!item.place_name;

  const handlePress = () => {
    if (hasPlace) openInMaps(item);
    else onPress();
  };

  const renderRightActions = () => (
    <View style={styles.actions}>
      {onEdit && (
        <TouchableOpacity
          style={styles.editAction}
          onPress={() => { swipeRef.current?.close(); onEdit(); }}
          accessibilityLabel={`Edit ${item.title}`}
          accessibilityRole="button"
        >
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => { swipeRef.current?.close(); onDelete(); }}
        accessibilityLabel={`Delete ${item.title}`}
        accessibilityRole="button"
      >
        <Text style={styles.actionText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
    >
      <TouchableOpacity style={styles.row} onPress={handlePress} activeOpacity={0.8} accessibilityLabel={hasPlace ? `Open ${item.title} in maps` : `Edit ${item.title}`} accessibilityRole="button">
        <View style={styles.timeCol}>
          {startStr && <Text style={styles.time}>{startStr}</Text>}
          {endStr && <Text style={styles.timeEnd}>{endStr}</Text>}
        </View>
        <View style={styles.line} />
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          </View>
          {hasPlace && (
            <Text style={styles.placeName} numberOfLines={1}>{item.place_name}</Text>
          )}
          {item.description && (
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          )}
          <Badge label={item.item_type} color={TYPE_COLORS[item.item_type] ?? 'gray'} style={styles.badge} />
        </View>
      </TouchableOpacity>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: Colors.bg },
  timeCol: { width: 56, alignItems: 'flex-end', paddingRight: 10 },
  time: { fontSize: 12, fontFamily: Fonts.mono, color: Colors.textSecondary },
  timeEnd: { fontSize: 11, fontFamily: Fonts.mono, color: Colors.textMuted },
  line: { width: 1.5, backgroundColor: Colors.border, marginRight: 12, borderRadius: 1 },
  content: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: { fontSize: 15 },
  title: { flex: 1, fontSize: 15, fontFamily: Fonts.displaySemiBold, color: Colors.textPrimary },
  placeName: { fontSize: 12, fontFamily: Fonts.mono, color: Colors.primary, marginTop: 3 },
  description: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 4 },
  badge: { marginTop: 6 },
  actions: { flexDirection: 'row', alignItems: 'stretch' },
  editAction: {
    width: 72,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAction: {
    width: 72,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: Colors.white, fontFamily: Fonts.displayMedium, fontSize: 13 },
});
