import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Fonts, FontSizes, Radius } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, style }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.white : Colors.primary} size="small" />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label` as keyof typeof styles] as TextStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primary:   { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.tealLight, borderWidth: 0.5, borderColor: Colors.border },
  ghost:     { backgroundColor: 'transparent' },
  danger:    { backgroundColor: Colors.error },
  disabled:  { opacity: 0.45 },
  label:         { fontSize: FontSizes.body, fontFamily: Fonts.displayMedium, letterSpacing: 0.1 },
  primaryLabel:  { color: Colors.white },
  secondaryLabel:{ color: Colors.tealDark },
  ghostLabel:    { color: Colors.textSecondary },
  dangerLabel:   { color: Colors.white },
});
