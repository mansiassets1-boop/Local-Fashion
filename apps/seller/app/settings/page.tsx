'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Upload, Loader2, Store, MapPin, Clock, CreditCard, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import AuthGuard from '@/components/AuthGuard'
import api from '@/lib/api'

const storeSchema = z.object({
  store_name: z.string().min(3),
  description: z.string().min(20),
  address_line: z.string().min(5),
  city: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  prep_time_minutes: z.coerce.number().min(5).max(120),
  return_policy_days: z.coerce.number().min(0).max(30),
})

const bankSchema = z.object({
  account_holder_name: z.string().min(3),
  account_number: z.string().min(9).max(18),
  ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC'),
})

type StoreForm = z.infer<typeof storeSchema>
type BankForm = z.infer<typeof bankSchema>

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai', 'Hyderabad', 'Ahmedabad', 'Kolkata']

const TABS = [
  { id: 'store', label: 'Store Info', icon: Store },
  { id: 'bank', label: 'Bank Account', icon: CreditCard },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('store')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data: storeData, isLoading } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => api.get('/sellers/store').then((r) => r.data),
  })

  const storeForm = useForm<StoreForm>({ resolver: zodResolver(storeSchema) })
  const bankForm = useForm<BankForm>({ resolver: zodResolver(bankSchema) })

  useEffect(() => {
    if (storeData) {
      storeForm.reset({
        store_name: storeData.store_name,
        description: storeData.description,
        address_line: storeData.address_line,
        city: storeData.city,
        pincode: storeData.pincode,
        prep_time_minutes: storeData.prep_time_minutes,
        return_policy_days: storeData.return_policy_days,
      })
      bankForm.reset({
        account_holder_name: storeData.bank?.account_holder_name || '',
        account_number: storeData.bank?.account_number || '',
        ifsc_code: storeData.bank?.ifsc_code || '',
      })
      if (storeData.logo_url) setLogoPreview(storeData.logo_url)
      if (storeData.banner_url) setBannerPreview(storeData.banner_url)
    }
  }, [storeData, storeForm, bankForm])

  const updateStore = useMutation({
    mutationFn: (formData: FormData) =>
      api.put('/sellers/store', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-settings'] })
      toast.success('Store settings saved!')
    },
    onError: () => toast.error('Failed to save settings'),
  })

  const updateBank = useMutation({
    mutationFn: (data: BankForm) => api.put('/sellers/store/bank', data),
    onSuccess: () => toast.success('Bank details updated!'),
    onError: () => toast.error('Failed to update bank details'),
  })

  const onStoreSubmit = (data: StoreForm) => {
    const formData = new FormData()
    Object.entries(data).forEach(([k, v]) => formData.append(k, String(v)))
    if (logoFile) formData.append('logo', logoFile)
    if (bannerFile) formData.append('banner', bannerFile)
    updateStore.mutate(formData)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setLogoFile(f)
      setLogoPreview(URL.createObjectURL(f))
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setBannerFile(f)
      setBannerPreview(URL.createObjectURL(f))
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Store Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
          </div>
        ) : (
          <>
            {activeTab === 'store' && (
              <form onSubmit={storeForm.handleSubmit(onStoreSubmit)} className="space-y-6 max-w-2xl">
                {/* Store Photos */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Store Photos
                  </h2>

                  <div className="space-y-4">
                    {/* Banner */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
                      <div className="relative h-32 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        {bannerPreview ? (
                          <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <p className="text-sm text-gray-400">No banner uploaded</p>
                          </div>
                        )}
                        <label className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-gray-700 text-xs px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 shadow">
                          <Upload className="h-3 w-3" />
                          Upload
                          <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                        </label>
                      </div>
                    </div>

                    {/* Logo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Store Logo</label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Store className="h-8 w-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer text-sm text-gray-700 hover:bg-gray-50">
                          <Upload className="h-4 w-4" />
                          Upload Logo
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Store Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Store Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Name *</label>
                      <input
                        {...storeForm.register('store_name')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {storeForm.formState.errors.store_name && (
                        <p className="text-red-500 text-xs mt-1">{storeForm.formState.errors.store_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                      <textarea
                        {...storeForm.register('description')}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      />
                      {storeForm.formState.errors.description && (
                        <p className="text-red-500 text-xs mt-1">{storeForm.formState.errors.description.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Address Line *</label>
                      <input
                        {...storeForm.register('address_line')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                      <select
                        {...storeForm.register('city')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {CITIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode *</label>
                      <input
                        {...storeForm.register('pincode')}
                        maxLength={6}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {storeForm.formState.errors.pincode && (
                        <p className="text-red-500 text-xs mt-1">{storeForm.formState.errors.pincode.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Operations */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Operations
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Prep Time (minutes) *</label>
                      <input
                        type="number"
                        min={5}
                        max={120}
                        {...storeForm.register('prep_time_minutes')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Return Policy (days) *</label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        {...storeForm.register('return_policy_days')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updateStore.isPending}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50"
                >
                  {updateStore.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Store Settings
                </button>
              </form>
            )}

            {activeTab === 'bank' && (
              <form onSubmit={bankForm.handleSubmit((d) => updateBank.mutate(d))} className="space-y-5 max-w-lg">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Bank Account Details
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Holder Name *</label>
                      <input
                        {...bankForm.register('account_holder_name')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {bankForm.formState.errors.account_holder_name && (
                        <p className="text-red-500 text-xs mt-1">{bankForm.formState.errors.account_holder_name.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Number *</label>
                      <input
                        {...bankForm.register('account_number')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {bankForm.formState.errors.account_number && (
                        <p className="text-red-500 text-xs mt-1">{bankForm.formState.errors.account_number.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">IFSC Code *</label>
                      <input
                        {...bankForm.register('ifsc_code')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {bankForm.formState.errors.ifsc_code && (
                        <p className="text-red-500 text-xs mt-1">{bankForm.formState.errors.ifsc_code.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updateBank.isPending}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50"
                >
                  {updateBank.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Update Bank Details
                </button>
              </form>
            )}
          </>
        )}
      </DashboardLayout>
    </AuthGuard>
  )
}
