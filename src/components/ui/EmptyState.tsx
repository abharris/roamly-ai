import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { Colors, Fonts, FontSizes, Radius } from '../../theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconTile}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} style={styles.cta} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginTop: 64, paddingHorizontal: 32 },
  iconTile: {
    width: 64,
    height: 64,
    borderRadius: Radius.card,
    backgroundColor: Colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: { fontSize: 28 },
  title: {
    fontSize: FontSizes.subhead,
    fontFamily: Fonts.displaySemiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: FontSizes.small,
    fontFamily: Fonts.body,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  cta: { marginTop: 20 },
});
