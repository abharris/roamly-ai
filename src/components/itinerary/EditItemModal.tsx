import React, { useState } from 'react';
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
} from 'react-native';
import { useUpdateItineraryItem } from '../../hooks/useItinerary';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ItineraryItem, ItineraryItemType } from '../../types/models';
import { Colors, Fonts, Radius } from '../../theme';
import { CalendarTimePicker } from './CalendarTimePicker';
import { ITEM_TYPES } from './AddItemModal';

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
  const updateItem = useUpdateItineraryItem(tripId);

  const handleSave = () => {
    if (!title.trim()) return;
    const data = {
      title: title.trim(),
      item_type: itemType,
      day_index: dayIndex ? parseInt(dayIndex, 10) : null,
      description: description.trim() || null,
      start_time: startTime || null,
      end_time: hasEndTime ? (endTime || null) : null,
    };
    updateItem.mutate(
      { itemId: item.id, data },
      {
        onSuccess: onClose,
        onError: (e: any) => {
          const msg = e?.response?.data?.error ?? e?.message ?? JSON.stringify(e);
          console.error('[EditItemModal] save error', e);
          Alert.alert('Failed to save', msg);
        },
      }
    );
  };

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
            loading={updateItem.isPending} disabled={!title.trim()} />
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
  endTimeToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  optionalToggle: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgAlt,
  },
  optionalToggleActive: { borderColor: Colors.error, backgroundColor: '#FEF2F2' },
  optionalToggleText: { fontSize: 13, fontFamily: Fonts.bodyMedium, color: Colors.textSecondary },
  optionalToggleTextActive: { color: Colors.error },
});
