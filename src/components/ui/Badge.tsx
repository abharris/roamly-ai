import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Fonts, FontSizes, Radius } from '../../theme';

export type BadgeColor =
  | 'teal' | 'blue' | 'green' | 'amber' | 'red' | 'gray'
  | 'sky' | 'pink' | 'purple' | 'orange';

interface BadgeProps {
  label: string;
  color?: BadgeColor;
  style?: ViewStyle;
}

const colorMap: Record<BadgeColor, { bg: string; text: string }> = {
  teal:   { bg: Colors.natureBg,    text: Colors.natureText },
  green:  { bg: Colors.shopBg,      text: Colors.shopText },
  amber:  { bg: Colors.foodBg,      text: Colors.foodText },
  sky:    { bg: Colors.coffeeBg,    text: Colors.coffeeText },
  blue:   { bg: Colors.hotelBg,     text: Colors.hotelText },
  pink:   { bg: Colors.barBg,       text: Colors.barText },
  purple: { bg: Colors.activityBg,  text: Colors.activityText },
  orange: { bg: Colors.transportBg, text: Colors.transportText },
  red:    { bg: Colors.errorLight,  text: Colors.error },
  gray:   { bg: '#F2F1EE',          text: Colors.textSecondary },
};

export function Badge({ label, color = 'gray', style }: BadgeProps) {
  const { bg, text } = colorMap[color];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.chip,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSizes.label,
    fontFamily: Fonts.mono,
    letterSpacing: 0.2,
  },
});
