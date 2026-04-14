import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useParseStore } from '../../../../src/store/parseStore';
import { RawTextInput } from '../../../../src/components/ai/RawTextInput';
import { ParsedResultsReview } from '../../../../src/components/ai/ParsedResultsReview';
import { useTripDetail } from '../../../../src/hooks/useTrips';
import { Colors } from '../../../../src/theme';
import { ROUTES } from '../../../../src/constants/routes';

export default function AddRawScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { data: trip } = useTripDetail(tripId);
  const { parsedResult, clearParsedResult } = useParseStore();

  const handleConfirmed = () => {
    clearParsedResult();
    router.push(ROUTES.tripPlaces(tripId));
  };

  return (
    <SafeAreaView style={styles.safe}>
      {!parsedResult ? (
        <RawTextInput
          tripId={tripId}
          tripStartDate={trip?.start_date}
          onParsed={() => {}}
        />
      ) : (
        <ParsedResultsReview
          tripId={tripId}
          result={parsedResult}
          onConfirmed={handleConfirmed}
          onBack={clearParsedResult}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
});
