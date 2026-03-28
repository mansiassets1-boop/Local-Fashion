'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface SendOTPPayload {
  phone: string;
}

interface VerifyOTPPayload {
  phone: string;
  otp: string;
}

interface AuthResponse {
  token: string;
  refresh_token: string;
  user: {
    id: string;
    phone: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export function useAuth() {
  const [otpSent, setOtpSent] = useState(false);
  const [phone, setPhone] = useState('');
  const router = useRouter();
  const { setUser, setToken, logout, isLoggedIn, user } = useAuthStore();

  const sendOTPMutation = useMutation({
    mutationFn: async (payload: SendOTPPayload) => {
      const { data } = await api.post('/auth/send-otp', payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      setOtpSent(true);
      setPhone(variables.phone);
      toast.success('OTP sent successfully!');
    },
    onError: () => {
      toast.error('Failed to send OTP. Please try again.');
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: async (payload: VerifyOTPPayload): Promise<AuthResponse> => {
      const { data } = await api.post<AuthResponse>('/auth/verify-otp', payload);
      return data;
    },
    onSuccess: (data) => {
      setToken(data.token, data.refresh_token);
      setUser(data.user);
      toast.success('Welcome to LocalFashion!');
      router.back();
    },
    onError: () => {
      toast.error('Invalid OTP. Please try again.');
    },
  });

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  return {
    otpSent,
    phone,
    setPhone,
    sendOTP: sendOTPMutation.mutate,
    verifyOTP: verifyOTPMutation.mutate,
    isSendingOTP: sendOTPMutation.isPending,
    isVerifyingOTP: verifyOTPMutation.isPending,
    handleLogout,
    isLoggedIn: isLoggedIn(),
    user,
  };
}
