'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Package,
  Edit,
  Eye,
  EyeOff,
  AlertTriangle,
  Search,
  Filter,
} from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import AuthGuard from '@/components/AuthGuard'
import api from '@/lib/api'

interface Product {
  id: string
  name: string
  category: string
  brand?: string
  selling_price: number
  mrp: number
  status: 'active' | 'inactive' | 'pending'
  primary_image?: string
  total_stock: number
  low_stock_threshold?: number
  variants_count: number
  orders_count?: number
}

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
}

const CATEGORIES = [
  'All', 'Ethnic Wear', 'Western Wear', 'Kids Fashion', 'Footwear',
  'Accessories', 'Activewear', 'Formal Wear', 'Casual Wear',
]

export default function ProductsPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['products', { search, category, statusFilter }],
    queryFn: () =>
      api
        .get('/sellers/products', {
          params: {
            search: search || undefined,
            category: category !== 'All' ? category : undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
          },
        })
        .then((r) => r.data),
  })

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/sellers/products/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product updated')
    },
    onError: () => toast.error('Failed to update product'),
  })

  const products = data?.products || []

  const discount = (mrp: number, price: number) =>
    Math.round(((mrp - price) / mrp) * 100)

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500 mt-0.5">{products.length} product(s) total</p>
          </div>
          <button
            onClick={() => router.push('/products/new')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending Review</option>
          </select>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <Package className="h-14 w-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No products found</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">
              {search ? 'Try a different search term' : 'Start adding products to your store'}
            </p>
            {!search && (
              <button
                onClick={() => router.push('/products/new')}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Add Your First Product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => {
              const isLowStock = product.total_stock <= (product.low_stock_threshold || 5)
              const disc = discount(product.mrp, product.selling_price)
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-100">
                    {product.primary_image ? (
                      <img
                        src={product.primary_image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    {/* Status badge */}
                    <span
                      className={clsx(
                        'absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium',
                        STATUS_COLORS[product.status]
                      )}
                    >
                      {product.status}
                    </span>
                    {/* Discount badge */}
                    {disc > 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {disc}% OFF
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                    {product.brand && (
                      <p className="text-xs text-gray-400 mt-0.5">{product.brand}</p>
                    )}
                    <p className="text-xs text-gray-400">{product.category}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-base font-bold text-gray-900">
                        ₹{product.selling_price.toLocaleString('en-IN')}
                      </span>
                      {product.mrp > product.selling_price && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{product.mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Stock */}
                    <div className="mt-2">
                      {isLowStock ? (
                        <div className="flex items-center gap-1 text-orange-600">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Low stock: {product.total_stock} left</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">{product.total_stock} in stock</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => router.push(`/products/${product.id}/edit`)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-emerald-600 border border-gray-200 hover:border-emerald-300 py-1.5 rounded-lg transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          toggleStatus.mutate({
                            id: product.id,
                            status: product.status === 'active' ? 'inactive' : 'active',
                          })
                        }
                        className={clsx(
                          'flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg border transition-colors',
                          product.status === 'active'
                            ? 'text-red-600 border-red-200 hover:bg-red-50'
                            : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                        )}
                      >
                        {product.status === 'active' ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            Activate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  )
}
