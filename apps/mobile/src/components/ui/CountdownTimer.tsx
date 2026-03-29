import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CountdownTimerProps {
  seconds: number;
  onExpire: () => void;
  size?: number;
  strokeWidth?: number;
}

export function CountdownTimer({
  seconds: totalSeconds,
  onExpire,
  size = 100,
  strokeWidth = 8,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const hasExpired = useRef(false);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / totalSeconds;
  const strokeDashoffset = circumference * (1 - progress);

  const strokeColor = remaining > 30 ? '#10B981' : remaining > 10 ? '#F59E0B' : '#EF4444';

  useEffect(() => {
    hasExpired.current = false;
    setRemaining(totalSeconds);

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!hasExpired.current) {
            hasExpired.current = true;
            onExpire();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [totalSeconds]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={[styles.timerText, { color: strokeColor }]}>{remaining}</Text>
        <Text style={styles.secLabel}>sec</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 28,
  },
  secLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
