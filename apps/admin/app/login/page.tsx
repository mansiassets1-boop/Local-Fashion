'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shield, Phone, Lock, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const phoneSchema = z.object({
  phone: z.string().min(10).max(10).regex(/^\d{10}$/, 'Enter a valid 10-digit phone number'),
})

const otpSchema = z.object({
  otp: z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
})

type PhoneForm = z.infer<typeof phoneSchema>
type OtpForm = z.infer<typeof otpSchema>

export default function AdminLoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) })
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) })

  const sendOtp = async (data: PhoneForm) => {
    setLoading(true)
    try {
      await api.post('/auth/send-otp', { phone: data.phone, role: 'admin' })
      setPhone(data.phone)
      setStep('otp')
      toast.success('OTP sent')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (data: OtpForm) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp: data.otp, role: 'admin' })
      const { token, user } = res.data
      if (user.role !== 'admin') {
        toast.error('Access denied. Admin credentials required.')
        return
      }
      setAuth(user, token)
      toast.success('Welcome, Admin!')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-violet-950 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-900">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">LocalFashion Admin</h1>
          <p className="text-gray-400 mt-1 text-sm">Restricted access — authorized personnel only</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {step === 'phone' ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Admin Sign In</h2>
                <p className="text-gray-500 text-sm mt-1">Enter your admin phone number</p>
              </div>

              <form onSubmit={phoneForm.handleSubmit(sendOtp)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
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
                      className="flex-1 block w-full rounded-r-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  {phoneForm.formState.errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{phoneForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
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
            </>
          ) : (
            <>
              <div className="mb-6">
                <button onClick={() => setStep('phone')} className="text-sm text-violet-600 hover:underline mb-3 flex items-center gap-1">
                  ← Back
                </button>
                <h2 className="text-xl font-semibold text-gray-900">Verify OTP</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Code sent to <span className="font-medium text-gray-700">+91 {phone}</span>
                </p>
              </div>

              <form onSubmit={otpForm.handleSubmit(verifyOtp)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">OTP Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                    {...otpForm.register('otp')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center tracking-[0.5em] text-lg font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="text-red-500 text-xs mt-1">{otpForm.formState.errors.otp.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Lock className="h-4 w-4" /> Verify & Sign In</>}
                </button>
              </form>

              <button onClick={() => sendOtp({ phone })} className="w-full mt-3 text-sm text-gray-400 hover:text-violet-600">
                Resend OTP
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
