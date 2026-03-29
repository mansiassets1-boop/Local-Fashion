import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { isValidIndianPhone } from '@/lib/utils';

type Step = 'phone' | 'otp';

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\s/g, '');
    if (!isValidIndianPhone(cleaned)) {
      setPhoneError('Enter a valid 10-digit mobile number');
      return;
    }
    setPhoneError('');
    setLoading(true);
    try {
      await authApi.sendOtp(cleaned);
      setStep('otp');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp(phone.replace(/\s/g, ''), otpString);
      await setAuth(data.user, data.token);
      if (data.user.role === 'delivery') {
        router.replace('/(delivery)');
      } else {
        router.replace('/(agent)');
      }
    } catch (err: any) {
      Alert.alert('Invalid OTP', err?.response?.data?.message ?? 'The OTP you entered is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePhone = () => {
    setStep('phone');
    setOtp(['', '', '', '', '', '']);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Tagline */}
          <View style={styles.logoSection}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>LF</Text>
            </View>
            <Text style={styles.appName}>LocalFashion Partner</Text>
            <Text style={styles.tagline}>Deliver dreams. Build futures.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {step === 'phone' ? (
              <>
                <Text style={styles.heading}>Welcome Back</Text>
                <Text style={styles.subheading}>
                  Enter your mobile number to receive a verification code.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mobile Number</Text>
                  <View style={[styles.phoneRow, phoneError ? styles.inputError : null]}>
                    <Text style={styles.countryCode}>+91</Text>
                    <TextInput
                      style={styles.phoneInput}
                      value={phone}
                      onChangeText={(t) => {
                        setPhone(t);
                        setPhoneError('');
                      }}
                      placeholder="98765 43210"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      maxLength={11}
                      autoFocus
                      returnKeyType="send"
                      onSubmitEditing={handleSendOtp}
                    />
                  </View>
                  {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.heading}>Verify OTP</Text>
                <Text style={styles.subheading}>
                  We sent a 6-digit code to{' '}
                  <Text style={styles.phoneHighlight}>+91 {phone}</Text>
                </Text>

                <View style={styles.otpRow}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                      value={digit}
                      onChangeText={(v) => handleOtpChange(v, index)}
                      onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      autoFocus={index === 0}
                      selectTextOnFocus
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Verify & Continue</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleChangePhone} style={styles.changePhoneBtn}>
                  <Text style={styles.changePhoneText}>Change phone number</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSendOtp} disabled={loading} style={styles.resendBtn}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.footer}>
            By continuing, you agree to LocalFashion's{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  phoneHighlight: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    height: 52,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
    paddingRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingLeft: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 8,
  },
  otpBox: {
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
  otpBoxFilled: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  primaryBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  changePhoneBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  changePhoneText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    color: '#6B7280',
    fontSize: 14,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  link: {
    color: '#4F46E5',
    fontWeight: '600',
  },
});
