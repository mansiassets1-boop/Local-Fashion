'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, ArrowLeft, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OTPInput } from '@/components/auth/OTPInput';
import { useAuth } from '@/hooks/useAuth';

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, 'Enter a valid 10-digit phone number')
    .max(10, 'Enter a valid 10-digit phone number')
    .regex(/^\d{10}$/, 'Enter a valid 10-digit phone number'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

export default function LoginPage() {
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const {
    otpSent,
    phone,
    sendOTP,
    verifyOTP,
    isSendingOTP,
    isVerifyingOTP,
  } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const onPhoneSubmit = (data: PhoneFormData) => {
    sendOTP({ phone: data.phone });
    startResendTimer();
  };

  const handleVerify = () => {
    if (otp.length === 6) {
      verifyOTP({ phone, otp });
    }
  };

  const handleResend = () => {
    const currentPhone = getValues('phone') || phone;
    sendOTP({ phone: currentPhone });
    startResendTimer();
    setOtp('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-3xl font-black text-primary-600">
            Local<span className="text-fashion-rose">Fashion</span>
          </span>
          <p className="text-sm text-gray-400 mt-2">Hyperlocal fashion, fast delivery</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          {!otpSent ? (
            // Phone number step
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Welcome back! 👋</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your phone number to get started
                </p>
              </div>

              <form onSubmit={handleSubmit(onPhoneSubmit)} className="space-y-4">
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="9876543210"
                  inputMode="numeric"
                  maxLength={10}
                  leftAddon={
                    <span className="flex items-center gap-1 text-gray-500 text-sm border-r border-gray-200 pr-2 mr-1">
                      🇮🇳 +91
                    </span>
                  }
                  error={errors.phone?.message}
                  autoFocus
                  {...register('phone')}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={isSendingOTP}
                  leftIcon={<Phone className="h-4 w-4" />}
                >
                  Send OTP
                </Button>
              </form>

              <p className="text-xs text-gray-400 text-center mt-4">
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-primary-600 hover:underline">Terms</a> and{' '}
                <a href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</a>
              </p>
            </>
          ) : (
            // OTP step
            <>
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => {
                    // Reset to phone step — we'd need useAuth to expose reset
                    window.location.reload();
                  }}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <h1 className="text-xl font-bold text-gray-900">Enter OTP</h1>
                <p className="text-sm text-gray-500 mt-1">
                  We sent a 6-digit code to{' '}
                  <span className="font-medium text-gray-900">+91 {phone}</span>
                </p>
              </div>

              <div className="space-y-6">
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  autoFocus
                  disabled={isVerifyingOTP}
                />

                <Button
                  fullWidth
                  size="lg"
                  loading={isVerifyingOTP}
                  disabled={otp.length !== 6}
                  onClick={handleVerify}
                >
                  Verify & Login
                </Button>

                {/* Resend */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-400">
                      Resend OTP in{' '}
                      <span className="text-primary-600 font-medium">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 mx-auto transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          New to LocalFashion? No worries — we&apos;ll create your account automatically.
        </p>
      </div>
    </div>
  );
}
