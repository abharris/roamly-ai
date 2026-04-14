import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Place } from '../../types/models';
import { Badge, BadgeColor } from '../ui/Badge';
import { Colors, Fonts, FontSizes, Radius, Spacing } from '../../theme';

interface PlaceCardProps {
  place: Place;
  selected?: boolean;
  onPress: () => void;
  onToggleHighlight?: () => void;
  subtitle?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

const CATEGORY_CONFIG: Record<string, { badge: BadgeColor; iconBg: string; iconText: string }> = {
  restaurant: { badge: 'amber',  iconBg: Colors.foodBg,      iconText: Colors.foodText },
  food:       { badge: 'amber',  iconBg: Colors.foodBg,      iconText: Colors.foodText },
  bar:        { badge: 'pink',   iconBg: Colors.barBg,       iconText: Colors.barText },
  coffee:     { badge: 'sky',    iconBg: Colors.coffeeBg,    iconText: Colors.coffeeText },
  cafe:       { badge: 'sky',    iconBg: Colors.coffeeBg,    iconText: Colors.coffeeText },
  hotel:      { badge: 'blue',   iconBg: Colors.hotelBg,     iconText: Colors.hotelText },
  activity:   { badge: 'purple', iconBg: Colors.activityBg,  iconText: Colors.activityText },
  shop:       { badge: 'green',  iconBg: Colors.shopBg,      iconText: Colors.shopText },
  nature:     { badge: 'teal',   iconBg: Colors.natureBg,    iconText: Colors.natureText },
  other:      { badge: 'gray',   iconBg: '#F2F1EE',          iconText: Colors.textSecondary },
};

const DEFAULT_CONFIG = { badge: 'teal' as BadgeColor, iconBg: Colors.iconTileBg, iconText: Colors.iconTileText };

function getCategoryConfig(category?: string) {
  if (!category) return DEFAULT_CONFIG;
  return CATEGORY_CONFIG[category.toLowerCase()] ?? DEFAULT_CONFIG;
}

export function PlaceCard({ place, selected, onPress, onToggleHighlight, subtitle, onEdit, onDelete }: PlaceCardProps) {
  const swipeRef = useRef<SwipeableMethods>(null);
  const cfg = getCategoryConfig(place.category);
  const initial = place.name?.[0]?.toUpperCase() ?? '?';

  const renderRightActions = () => (
    <View style={styles.actions}>
      {onEdit && (
        <TouchableOpacity
          style={styles.editAction}
          onPress={() => { swipeRef.current?.close(); onEdit(); }}
          accessibilityLabel={`Edit ${place.name}`}
          accessibilityRole="button"
        >
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
      )}
      {onDelete && (
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => { swipeRef.current?.close(); onDelete(); }}
          accessibilityLabel={`Delete ${place.name}`}
          accessibilityRole="button"
        >
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      renderRightActions={(onEdit || onDelete) ? renderRightActions : undefined}
      overshootRight={false}
      containerStyle={styles.swipeContainer}
    >
      <TouchableOpacity
        style={[styles.card, selected && styles.selected]}
        onPress={onPress}
        activeOpacity={0.82}
        accessibilityLabel={`View ${place.name}`}
        accessibilityRole="button"
      >
        <View style={styles.row}>
          {/* Icon tile */}
          <View style={[styles.iconTile, { backgroundColor: cfg.iconBg }]}>
            <Text style={[styles.iconLetter, { color: cfg.iconText }]}>{initial}</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
            {place.address && (
              <Text style={styles.address} numberOfLines={1}>{place.address}</Text>
            )}
            {subtitle && (
              <View style={styles.subtitleTag}>
                <Text style={styles.subtitleText}>{subtitle}</Text>
              </View>
            )}
            {place.category && (
              <Badge label={place.category} color={cfg.badge} style={styles.badge} />
            )}
            {place.notes && (
              <Text style={styles.notes} numberOfLines={2}>{place.notes}</Text>
            )}
          </View>

          {/* Star */}
          <TouchableOpacity
            onPress={onToggleHighlight}
            style={styles.star}
            hitSlop={10}
            disabled={!onToggleHighlight}
            accessibilityLabel={place.is_highlight ? 'Remove highlight' : 'Mark as highlight'}
            accessibilityRole="button"
          >
            <Text style={[styles.starIcon, place.is_highlight && styles.starFilled]}>
              {place.is_highlight ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  swipeContainer: { marginBottom: Spacing.cardGap },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  selected: {
    borderColor: Colors.teal,
    borderWidth: 1.5,
    backgroundColor: Colors.tealLight,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },

  // Icon tile
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: Radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  iconLetter: { fontSize: 16, fontFamily: Fonts.displaySemiBold },

  // Content
  content: { flex: 1, minWidth: 0 },
  name:    { fontSize: FontSizes.body, fontFamily: Fonts.displaySemiBold, color: Colors.textPrimary, letterSpacing: -0.1 },
  address: { fontSize: FontSizes.xs, fontFamily: Fonts.body, color: Colors.textSecondary, marginTop: 2 },
  badge:   { marginTop: 6 },
  notes:   { fontSize: FontSizes.small, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 5, fontStyle: 'italic' },

  // Subtitle tag (e.g. trip name)
  subtitleTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.chip,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 4,
  },
  subtitleText: { fontSize: FontSizes.label, fontFamily: Fonts.mono, color: Colors.primaryDark },

  // Star
  star:      { paddingLeft: 10, paddingTop: 1 },
  starIcon:  { fontSize: 18, color: Colors.textDisabled },
  starFilled:{ color: Colors.accent },

  // Swipe actions
  actions: { flexDirection: 'row' },
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
    borderTopRightRadius: Radius.card,
    borderBottomRightRadius: Radius.card,
  },
  actionText: { color: Colors.white, fontFamily: Fonts.displayMedium, fontSize: FontSizes.small },
});
