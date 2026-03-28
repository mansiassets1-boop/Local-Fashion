'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Store, Phone, Shield, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const phoneSchema = z.object({
  phone: z.string().min(10).max(10).regex(/^\d{10}$/, 'Enter a valid 10-digit phone number'),
})

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
})

type PhoneForm = z.infer<typeof phoneSchema>
type OtpForm = z.infer<typeof otpSchema>

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
  })

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
  })

  const sendOtp = async (data: PhoneForm) => {
    setLoading(true)
    try {
      await api.post('/auth/send-otp', { phone: data.phone, role: 'seller' })
      setPhone(data.phone)
      setStep('otp')
      toast.success('OTP sent to your phone')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (data: OtpForm) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/verify-otp', {
        phone,
        otp: data.otp,
        role: 'seller',
      })
      const { token, user } = res.data
      if (user.role !== 'seller') {
        toast.error('This portal is for sellers only')
        return
      }
      setAuth(user, token)
      toast.success('Welcome back!')
      if (user.store_status === undefined || user.store_status === null) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">LocalFashion</h1>
          <p className="text-gray-400 mt-1">Seller Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 'phone' ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Sign in to your store</h2>
                <p className="text-gray-500 text-sm mt-1">Enter your registered phone number</p>
              </div>

              <form onSubmit={phoneForm.handleSubmit(sendOtp)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="9876543210"
                      maxLength={10}
                      {...phoneForm.register('phone')}
                      className="flex-1 block w-full rounded-r-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  {phoneForm.formState.errors.phone && (
                    <p className="text-red-500 text-xs mt-1">
                      {phoneForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Phone className="h-4 w-4" />
                      Send OTP
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-gray-500">
                New seller?{' '}
                <a href="/onboarding" className="text-emerald-600 hover:underline font-medium">
                  Register your store
                </a>
              </p>
            </>
          ) : (
            <>
              <div className="mb-6">
                <button
                  onClick={() => setStep('phone')}
                  className="text-sm text-emerald-600 hover:underline mb-3 flex items-center gap-1"
                >
                  ← Back
                </button>
                <h2 className="text-xl font-semibold text-gray-900">Verify OTP</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Enter the 6-digit code sent to{' '}
                  <span className="font-medium text-gray-700">+91 {phone}</span>
                </p>
              </div>

              <form onSubmit={otpForm.handleSubmit(verifyOtp)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    OTP Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                    {...otpForm.register('otp')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-center tracking-[0.5em] text-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="text-red-500 text-xs mt-1">
                      {otpForm.formState.errors.otp.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Verify & Sign In
                    </>
                  )}
                </button>
              </form>

              <button
                onClick={() => sendOtp({ phone })}
                className="w-full mt-3 text-sm text-gray-500 hover:text-emerald-600 transition-colors"
              >
                Didn&apos;t receive OTP? Resend
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
