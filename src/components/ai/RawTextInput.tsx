import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Button } from '../ui/Button';
import { useParseRawText } from '../../hooks/useAIParse';
import { Colors, Fonts } from '../../theme';

interface RawTextInputProps {
  tripId: string;
  tripStartDate?: string;
  onParsed: () => void;
}

export function RawTextInput({ tripId, tripStartDate, onParsed }: RawTextInputProps) {
  const [text, setText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const parseMutation = useParseRawText(tripId);

  const handleParse = () => {
    if (!text.trim()) return;
    setErrorMsg(null);
    parseMutation.mutate(
      { raw_text: text, trip_start_date: tripStartDate },
      {
        onSuccess: onParsed,
        onError: (e: any) => {
          const raw = e?.response?.data?.error ?? e?.message ?? '';
          if (raw.includes('credit balance') || raw.includes('billing')) {
            setErrorMsg('AI parsing is unavailable — the API account is out of credits.');
          } else {
            setErrorMsg('Something went wrong. Please try again.');
          }
        },
      }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Add Places & Itinerary</Text>
      <Text style={styles.sub}>
        Paste anything — recommendations, a list of restaurants, flight details, hotel info.
        AI will sort it out.
      </Text>

      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={12}
        placeholder={
          'e.g.\n\n' +
          'Dinner at Le Bernardin on Tuesday at 7pm\n' +
          'Flight: AA 101 JFK→CDG departs 10:30pm Wed\n' +
          'Must try: Buvette, L\'Ami Jean, Septime\n' +
          'Hotel: Le Bristol check-in Thursday\n' +
          'Eiffel Tower – morning visit'
        }
        placeholderTextColor={Colors.textMuted}
        value={text}
        onChangeText={setText}
        textAlignVertical="top"
      />

      {parseMutation.isPending && (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.amber} />
          <Text style={styles.loadingText}>AI is parsing your list…</Text>
        </View>
      )}

      {errorMsg && (
        <Text style={styles.error}>{errorMsg}</Text>
      )}

      <Button
        label="✦ Parse with AI"
        onPress={handleParse}
        loading={parseMutation.isPending}
        disabled={!text.trim()}
        style={styles.btn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  heading: { fontSize: 20, fontFamily: Fonts.displaySemiBold, color: Colors.textPrimary, marginBottom: 6 },
  sub: { fontSize: 14, fontFamily: Fonts.body, color: Colors.textMuted, marginBottom: 16, lineHeight: 20 },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.bg,
    minHeight: 220,
    marginBottom: 16,
  },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  loadingText: { fontFamily: Fonts.body, color: Colors.textMuted, fontSize: 14 },
  error: { fontFamily: Fonts.body, color: Colors.error, fontSize: 14, marginBottom: 12 },
  btn: { marginTop: 4, backgroundColor: Colors.amber },
});
