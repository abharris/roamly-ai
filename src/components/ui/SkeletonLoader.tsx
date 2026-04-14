import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../theme';

function SkeletonBox({ width, height, style }: { width?: number | string; height: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.box, { width: width ?? '100%', height, opacity }, style]}
    />
  );
}

export function PlaceCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBox width={38} height={38} style={{ borderRadius: Radius.icon, marginRight: 12, flexShrink: 0 }} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBox height={14} width="65%" style={{ borderRadius: 4 }} />
        <SkeletonBox height={11} width="45%" style={{ borderRadius: 4 }} />
        <SkeletonBox height={22} width={64} style={{ borderRadius: Radius.chip }} />
      </View>
    </View>
  );
}

export function TripCardSkeleton() {
  return (
    <View style={styles.tripCard}>
      <SkeletonBox height={11} width="35%" style={{ borderRadius: 4, marginBottom: 8 }} />
      <SkeletonBox height={20} width="72%" style={{ borderRadius: 6, marginBottom: 14 }} />
      <SkeletonBox height={11} width="52%" style={{ borderRadius: 4 }} />
    </View>
  );
}

export function ItineraryItemSkeleton() {
  return (
    <View style={styles.itineraryRow}>
      <SkeletonBox width={48} height={28} style={{ borderRadius: 4, marginRight: 12 }} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBox height={15} width="70%" style={{ borderRadius: 4 }} />
        <SkeletonBox height={11} width="40%" style={{ borderRadius: 4 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: Colors.divider },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  tripCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  itineraryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.bg,
  },
});
