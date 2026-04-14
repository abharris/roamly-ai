import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { RawTextInput } from './RawTextInput';
import { ParsedResultsReview } from './ParsedResultsReview';
import { useParseStore } from '../../store/parseStore';
import { Colors, Fonts } from '../../theme';

interface AddAIModalProps {
  tripId: string;
  tripStartDate?: string;
  onClose: () => void;
}

export function AddAIModal({ tripId, tripStartDate, onClose }: AddAIModalProps) {
  const { parsedResult, clearParsedResult } = useParseStore();

  const handleConfirmed = () => {
    clearParsedResult();
    onClose();
  };

  const handleClose = () => {
    clearParsedResult();
    onClose();
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose} accessibilityViewIsModal={true}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>Add with AI</Text>
          <TouchableOpacity onPress={handleClose} accessibilityLabel="Close" accessibilityRole="button">
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>
        {!parsedResult ? (
          <RawTextInput tripId={tripId} tripStartDate={tripStartDate} onParsed={() => {}} />
        ) : (
          <ParsedResultsReview
            tripId={tripId}
            result={parsedResult}
            onConfirmed={handleConfirmed}
            onBack={clearParsedResult}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.displaySemiBold,
    color: Colors.textPrimary,
  },
  closeBtn: {
    fontSize: 20,
    color: Colors.textMuted,
  },
});
