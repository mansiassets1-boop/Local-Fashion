'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Map, Plus, Power, Loader2, ChevronRight,
  Store, ShoppingBag, Percent,
} from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/AdminLayout'
import AuthGuard from '@/components/AuthGuard'
import api from '@/lib/api'

const citySchema = z.object({
  name: z.string().min(2, 'City name required'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  delivery_radius_km: z.coerce.number().min(1).max(50),
  platform_fee_pct: z.coerce.number().min(0).max(40),
  launch_date: z.string().min(1, 'Launch date required'),
})

type CityForm = z.infer<typeof citySchema>

interface City {
  id: string
  name: string
  status: 'active' | 'inactive'
  sellers_count: number
  orders_today: number
  platform_fee_pct: number
  delivery_radius_km: number
  gmv_today: number
  launch_date: string
}

export default function CitiesPage() {
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<{ cities: City[] }>({
    queryKey: ['admin-cities'],
    queryFn: () => api.get('/admin/cities').then((r) => r.data),
  })

  const form = useForm<CityForm>({
    resolver: zodResolver(citySchema),
    defaultValues: { delivery_radius_km: 10, platform_fee_pct: 15 },
  })

  const createCity = useMutation({
    mutationFn: (data: CityForm) => api.post('/admin/cities', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-cities'] })
      toast.success('City added successfully!')
      setShowModal(false)
      form.reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add city'),
  })

  const toggleCity = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/cities/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-cities'] })
      toast.success('City status updated')
    },
    onError: () => toast.error('Failed to update city'),
  })

  const cities = data?.cities || []

  return (
    <AuthGuard>
      <AdminLayout>
        {/* Add City Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Add New City</h2>
              <form onSubmit={form.handleSubmit((d) => createCity.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">City Name *</label>
                    <input {...form.register('name')} placeholder="e.g. Pune" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    {form.formState.errors.name && <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
                    <input type="number" step="any" {...form.register('latitude')} placeholder="18.5204" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
                    <input type="number" step="any" {...form.register('longitude')} placeholder="73.8567" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Radius (km) *</label>
                    <input type="number" {...form.register('delivery_radius_km')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Platform Fee (%) *</label>
                    <input type="number" step="0.5" {...form.register('platform_fee_pct')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Launch Date *</label>
                    <input type="date" {...form.register('launch_date')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowModal(false); form.reset() }} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={createCity.isPending} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                    {createCity.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Add City'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Cities</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add City
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {['City', 'Status', 'Sellers', 'Orders Today', 'GMV Today', 'Fee %', 'Radius', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cities.map((city) => (
                  <tr key={city.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Map className="h-4 w-4 text-violet-500" />
                        <span className="text-sm font-semibold text-gray-900">{city.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        city.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {city.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Store className="h-3.5 w-3.5 text-gray-400" />
                        {city.sellers_count}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <ShoppingBag className="h-3.5 w-3.5 text-gray-400" />
                        {city.orders_today}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-900">
                      ₹{city.gmv_today.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Percent className="h-3.5 w-3.5 text-gray-400" />
                        {city.platform_fee_pct}%
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{city.delivery_radius_km} km</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            toggleCity.mutate({
                              id: city.id,
                              status: city.status === 'active' ? 'inactive' : 'active',
                            })
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            city.status === 'active'
                              ? 'border-red-300 text-red-600 hover:bg-red-50'
                              : 'border-green-300 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          <Power className="h-3.5 w-3.5" />
                          {city.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => router.push(`/cities/${city.id}`)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg"
                        >
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cities.length === 0 && (
              <div className="p-12 text-center">
                <Map className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">No cities configured</p>
              </div>
            )}
          </div>
        )}
      </AdminLayout>
    </AuthGuard>
  )
}
