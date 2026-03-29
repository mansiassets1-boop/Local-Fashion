import React, { useRef } from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';

interface OTPInputProps {
  value: string[];
  onChange: (otp: string[]) => void;
  length?: number;
  containerStyle?: ViewStyle;
  autoFocus?: boolean;
}

export function OTPInput({
  value,
  onChange,
  length = 6,
  containerStyle,
  autoFocus = false,
}: OTPInputProps) {
  const refs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...value];
    newOtp[index] = digit;
    onChange(newOtp);
    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={[styles.row, containerStyle]}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(el) => (refs.current[index] = el)}
          style={[styles.box, value[index] ? styles.boxFilled : null]}
          value={value[index]}
          onChangeText={(t) => handleChange(t, index)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
          autoFocus={autoFocus && index === 0}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  boxFilled: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
});
