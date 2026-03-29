import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: '#4F46E5' },
    text: { color: '#fff' },
  },
  secondary: {
    container: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#4F46E5' },
    text: { color: '#4F46E5' },
  },
  danger: {
    container: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#EF4444' },
    text: { color: '#EF4444' },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: '#4F46E5' },
  },
};

const sizeStyles: Record<Size, { container: ViewStyle; text: TextStyle }> = {
  sm: { container: { height: 40, paddingHorizontal: 16, borderRadius: 10 }, text: { fontSize: 14 } },
  md: { container: { height: 50, paddingHorizontal: 20, borderRadius: 12 }, text: { fontSize: 15 } },
  lg: { container: { height: 56, paddingHorizontal: 24, borderRadius: 14 }, text: { fontSize: 16 } },
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  disabled,
  ...rest
}: ButtonProps) {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        vStyle.container,
        sStyle.container,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#4F46E5'} size="small" />
      ) : (
        <Text style={[styles.text, vStyle.text, sStyle.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
