import React, { useState } from 'react';
import { TextInput, TextInputProps, View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSizes, Radius } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, focused && styles.focused, error && styles.errorBorder, style]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={Colors.textMuted}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: FontSizes.label,
    fontFamily: Fonts.displayMedium,
    color: Colors.textSecondary,
    marginBottom: 7,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: Radius.input,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: FontSizes.body,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  focused:     { borderColor: Colors.teal, borderWidth: 1.5 },
  errorBorder: { borderColor: Colors.error },
  errorText:   { fontSize: FontSizes.xs, fontFamily: Fonts.body, color: Colors.error, marginTop: 4 },
});
