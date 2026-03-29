import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      style,
      ...rest
    },
    ref,
  ) => {
    return (
      <View style={[styles.container, containerStyle]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={[styles.inputRow, error ? styles.errorBorder : styles.normalBorder]}>
          {leftIcon ? (
            <Ionicons name={leftIcon} size={20} color="#9CA3AF" style={styles.leftIcon} />
          ) : null}
          <TextInput
            ref={ref}
            style={[styles.input, leftIcon ? styles.inputWithLeft : null, style]}
            placeholderTextColor="#9CA3AF"
            {...rest}
          />
          {rightIcon ? (
            <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconBtn}>
              <Ionicons name={rightIcon} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {hint && !error ? <Text style={styles.hintText}>{hint}</Text> : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  normalBorder: {
    borderColor: '#D1D5DB',
  },
  errorBorder: {
    borderColor: '#EF4444',
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 12,
  },
  inputWithLeft: {
    paddingLeft: 0,
  },
  rightIconBtn: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  hintText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
});
