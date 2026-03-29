'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Store,
  MapPin,
  Building2,
  CreditCard,
  FileText,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Upload,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const storeInfoSchema = z.object({
  store_name: z.string().min(3, 'Store name must be at least 3 characters'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  address_line: z.string().min(5, 'Address is required'),
  city: z.string().min(1, 'Please select a city'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
})

const businessSchema = z.object({
  gst_number: z.string().optional(),
  prep_time_minutes: z.coerce.number().min(5).max(120),
  return_policy_days: z.coerce.number().min(0).max(30),
})

const bankSchema = z.object({
  account_number: z.string().min(9).max(18, 'Invalid account number'),
  ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
  account_holder_name: z.string().min(3, 'Account holder name is required'),
})

type StoreInfoForm = z.infer<typeof storeInfoSchema>
type BusinessForm = z.infer<typeof businessSchema>
type BankForm = z.infer<typeof bankSchema>

const CATEGORIES = [
  'Ethnic Wear', 'Western Wear', 'Kids Fashion', 'Footwear',
  'Accessories', 'Activewear', 'Formal Wear', 'Casual Wear',
]

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai', 'Hyderabad', 'Ahmedabad', 'Kolkata']

const steps = [
  { id: 1, label: 'Store Info', icon: Store },
  { id: 2, label: 'Business', icon: Building2 },
  { id: 3, label: 'Bank Account', icon: CreditCard },
  { id: 4, label: 'Documents', icon: FileText },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, setAuth, token } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [idProofFile, setIdProofFile] = useState<File | null>(null)
  const [storePhotos, setStorePhotos] = useState<File[]>([])

  const [storeData, setStoreData] = useState<StoreInfoForm | null>(null)
  const [businessData, setBusinessData] = useState<BusinessForm | null>(null)
  const [bankData, setBankData] = useState<BankForm | null>(null)

  const storeForm = useForm<StoreInfoForm>({ resolver: zodResolver(storeInfoSchema) })
  const businessForm = useForm<BusinessForm>({
    resolver: zodResolver(businessSchema),
    defaultValues: { prep_time_minutes: 30, return_policy_days: 7 },
  })
  const bankForm = useForm<BankForm>({ resolver: zodResolver(bankSchema) })

  const getGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        toast.success('Location captured!')
      },
      () => toast.error('Could not get location')
    )
  }

  const handleStep1 = (data: StoreInfoForm) => {
    setStoreData(data)
    setStep(2)
  }

  const handleStep2 = (data: BusinessForm) => {
    setBusinessData(data)
    setStep(3)
  }

  const handleStep3 = (data: BankForm) => {
    setBankData(data)
    setStep(4)
  }

  const handleSubmit = async () => {
    if (!idProofFile) {
      toast.error('Please upload your ID proof')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      if (storeData) {
        Object.entries(storeData).forEach(([k, v]) => formData.append(k, v))
      }
      if (businessData) {
        Object.entries(businessData).forEach(([k, v]) =>
          formData.append(k, String(v))
        )
      }
      if (bankData) {
        Object.entries(bankData).forEach(([k, v]) => formData.append(k, v))
      }
      if (location) {
        formData.append('latitude', String(location.lat))
        formData.append('longitude', String(location.lng))
      }
      formData.append('id_proof', idProofFile)
      storePhotos.forEach((f) => formData.append('store_photos', f))

      const res = await api.post('/sellers/onboard', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (user && token) {
        setAuth({ ...user, store_status: 'pending', store_name: storeData?.store_name }, token)
      }
      setSubmitted(true)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-500 mb-6">
            Your store is under review. We'll notify you within 24-48 hours once approved.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium text-yellow-800">What happens next?</p>
            <ul className="mt-2 space-y-1 text-sm text-yellow-700 list-disc list-inside">
              <li>Our team will review your documents</li>
              <li>You'll receive an SMS on approval</li>
              <li>You can then start adding products</li>
            </ul>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl mb-3">
            <Store className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Register Your Store</h1>
          <p className="text-gray-400 text-sm mt-1">Complete all steps to get started</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center mb-6 gap-2">
          {steps.map((s, i) => {
            const Icon = s.icon
            const isActive = step === s.id
            const isDone = step > s.id
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isActive
                      ? 'bg-white text-gray-900'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.id}</span>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                )}
              </div>
            )
          })}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Store Info */}
          {step === 1 && (
            <form onSubmit={storeForm.handleSubmit(handleStep1)} className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Priya's Boutique"
                    {...storeForm.register('store_name')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {storeForm.formState.errors.store_name && (
                    <p className="text-red-500 text-xs mt-1">{storeForm.formState.errors.store_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                  <select
                    {...storeForm.register('category')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {storeForm.formState.errors.category && (
                    <p className="text-red-500 text-xs mt-1">{storeForm.formState.errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                  <select
                    {...storeForm.register('city')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select city</option>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {storeForm.formState.errors.city && (
                    <p className="text-red-500 text-xs mt-1">{storeForm.formState.errors.city.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                  <textarea
                    rows={3}
                    placeholder="Tell customers what your store offers..."
                    {...storeForm.register('description')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                  {storeForm.formState.errors.description && (
                    <p className="text-red-500 text-xs mt-1">{storeForm.formState.errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address *</label>
                  <input
                    type="text"
                    placeholder="Shop no, Building, Area"
                    {...storeForm.register('address_line')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {storeForm.formState.errors.address_line && (
                    <p className="text-red-500 text-xs mt-1">{storeForm.formState.errors.address_line.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode *</label>
                  <input
                    type="text"
                    placeholder="400001"
                    maxLength={6}
                    {...storeForm.register('pincode')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {storeForm.formState.errors.pincode && (
                    <p className="text-red-500 text-xs mt-1">{storeForm.formState.errors.pincode.message}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={getGPS}
                className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <MapPin className="h-4 w-4" />
                {location ? `Location captured (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : 'Use my current location'}
              </button>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
              >
                Next: Business Details
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Step 2: Business Details */}
          {step === 2 && (
            <form onSubmit={businessForm.handleSubmit(handleStep2)} className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  GST Number <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="22AAAAA0000A1Z5"
                  {...businessForm.register('gst_number')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Preparation Time (minutes) *
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  {...businessForm.register('prep_time_minutes')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-400 mt-1">Time to prepare an order for pickup</p>
                {businessForm.formState.errors.prep_time_minutes && (
                  <p className="text-red-500 text-xs mt-1">{businessForm.formState.errors.prep_time_minutes.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Return Policy (days) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  {...businessForm.register('return_policy_days')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-400 mt-1">0 = no returns accepted</p>
                {businessForm.formState.errors.return_policy_days && (
                  <p className="text-red-500 text-xs mt-1">{businessForm.formState.errors.return_policy_days.message}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
                >
                  Next: Bank Account
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Bank Account */}
          {step === 3 && (
            <form onSubmit={bankForm.handleSubmit(handleStep3)} className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bank Account Details</h2>
              <p className="text-sm text-gray-500 -mt-2 mb-4">
                Your payouts will be sent to this account
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  placeholder="As per bank records"
                  {...bankForm.register('account_holder_name')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {bankForm.formState.errors.account_holder_name && (
                  <p className="text-red-500 text-xs mt-1">{bankForm.formState.errors.account_holder_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Number *</label>
                <input
                  type="text"
                  placeholder="Enter account number"
                  {...bankForm.register('account_number')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {bankForm.formState.errors.account_number && (
                  <p className="text-red-500 text-xs mt-1">{bankForm.formState.errors.account_number.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">IFSC Code *</label>
                <input
                  type="text"
                  placeholder="SBIN0001234"
                  {...bankForm.register('ifsc_code')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                />
                {bankForm.formState.errors.ifsc_code && (
                  <p className="text-red-500 text-xs mt-1">{bankForm.formState.errors.ifsc_code.message}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
                >
                  Next: Documents
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ID Proof * <span className="text-gray-400">(Aadhaar / PAN / Voter ID)</span>
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-emerald-500 transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  {idProofFile ? (
                    <span className="text-sm text-emerald-600 font-medium">{idProofFile.name}</span>
                  ) : (
                    <>
                      <span className="text-sm text-gray-600">Click to upload ID proof</span>
                      <span className="text-xs text-gray-400 mt-1">JPG, PNG or PDF up to 5MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => setIdProofFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Store Photos <span className="text-gray-400">(Optional, up to 5)</span>
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-emerald-500 transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  {storePhotos.length > 0 ? (
                    <span className="text-sm text-emerald-600 font-medium">{storePhotos.length} photo(s) selected</span>
                  ) : (
                    <>
                      <span className="text-sm text-gray-600">Click to upload store photos</span>
                      <span className="text-xs text-gray-400 mt-1">JPG or PNG, up to 5 files</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).slice(0, 5)
                      setStorePhotos(files)
                    }}
                  />
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !idProofFile}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
