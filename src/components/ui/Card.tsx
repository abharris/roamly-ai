import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    padding: 14,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
});
