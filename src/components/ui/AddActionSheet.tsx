import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { Colors, Fonts } from '../../theme';

interface AddActionSheetProps {
  visible: boolean;
  tripName: string;
  onAddManual: () => void;
  onAddWithAI: () => void;
  onClose: () => void;
}

function AIIconTile() {
  return (
    <View style={styles.aiTile}>
      <View style={styles.dotsGrid}>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, { backgroundColor: Colors.accent }]} />
          <View style={[styles.dot, { backgroundColor: 'rgba(239,159,39,0.35)' }]} />
        </View>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, { backgroundColor: 'rgba(239,159,39,0.35)' }]} />
          <View style={[styles.dot, { backgroundColor: Colors.accent }]} />
        </View>
      </View>
    </View>
  );
}

function ManualIconTile() {
  return (
    <View style={styles.manualTile}>
      <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={styles.plusH} />
      </View>
      <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={styles.plusV} />
      </View>
    </View>
  );
}

export function AddActionSheet({
  visible,
  tripName,
  onAddManual,
  onAddWithAI,
  onClose,
}: AddActionSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const aiScale = useRef(new Animated.Value(1)).current;
  const aiOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const handleAIPressIn = () => {
    Animated.parallel([
      Animated.timing(aiScale, { toValue: 0.99, duration: 120, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(aiOpacity, { toValue: 0.88, duration: 120, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  };

  const handleAIPressOut = () => {
    Animated.parallel([
      Animated.timing(aiScale, { toValue: 1, duration: 120, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.timing(aiOpacity, { toValue: 1, duration: 120, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} accessibilityViewIsModal={true}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} accessibilityLabel="Close" accessibilityRole="button" />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Handle */}
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        {/* Label */}
        <Text style={styles.sheetLabel}>Add to {tripName}</Text>

        {/* Option 1 — Add with AI */}
        <Animated.View style={{ transform: [{ scale: aiScale }], opacity: aiOpacity, marginBottom: 10 }}>
          <TouchableOpacity
            style={styles.aiOption}
            onPress={() => { onAddWithAI(); onClose(); }}
            onPressIn={handleAIPressIn}
            onPressOut={handleAIPressOut}
            activeOpacity={1}
            accessibilityLabel="Add with AI"
            accessibilityRole="button"
          >
            <AIIconTile />
            <View style={styles.optionText}>
              <Text style={styles.aiTitle}>Add with AI</Text>
              <Text style={styles.aiSubtitle}>Describe what you're looking for — AI picks the best spots</Text>
            </View>
            <Text style={styles.aiChevron}>›</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Option 2 — Add manually */}
        <Pressable
          style={({ pressed }) => [styles.manualOption, pressed && styles.manualOptionPressed]}
          onPress={() => { onAddManual(); onClose(); }}
          accessibilityLabel="Add manually"
          accessibilityRole="button"
        >
          <ManualIconTile />
          <View style={styles.optionText}>
            <Text style={styles.manualTitle}>Add manually</Text>
            <Text style={styles.manualSubtitle}>Search or browse to find and add a place yourself</Text>
          </View>
          <Text style={styles.manualChevron}>›</Text>
        </Pressable>

        {/* Cancel */}
        <Pressable
          style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
          onPress={onClose}
          accessibilityLabel="Cancel"
          accessibilityRole="button"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45,50,80,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },
  handleWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  handle: {
    width: 32,
    height: 4,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
  },
  sheetLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.88,
    marginBottom: 14,
  },
  // AI option
  aiOption: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  aiTile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsGrid: {
    gap: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  aiTitle: {
    fontFamily: Fonts.displaySemiBold,
    fontSize: 15,
    color: Colors.textOnDark,
    marginBottom: 3,
  },
  aiSubtitle: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.cardBorder,
    lineHeight: 16.5,
  },
  aiChevron: {
    fontSize: 18,
    color: Colors.cardBorder,
    opacity: 0.7,
  },
  // Manual option
  manualOption: {
    backgroundColor: Colors.bg,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  manualOptionPressed: {
    backgroundColor: Colors.bgAlt,
  },
  manualTile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.tealLight,
  },
  plusH: {
    width: 16,
    height: 2.5,
    backgroundColor: Colors.teal,
    borderRadius: 1.5,
  },
  plusV: {
    width: 2.5,
    height: 16,
    backgroundColor: Colors.teal,
    borderRadius: 1.5,
  },
  manualTitle: {
    fontFamily: Fonts.displaySemiBold,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  manualSubtitle: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16.5,
  },
  manualChevron: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  // Shared
  optionText: {
    flex: 1,
  },
  // Cancel
  cancelBtn: {
    marginTop: 4,
    backgroundColor: Colors.bg,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelBtnPressed: {
    backgroundColor: Colors.bgAlt,
  },
  cancelText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
