'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Star,
  Loader2,
  Tag,
  X,
  Save,
} from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import AuthGuard from '@/components/AuthGuard'
import api from '@/lib/api'

const productSchema = z.object({
  name: z.string().min(3),
  category: z.string().min(1),
  brand: z.string().optional(),
  description: z.string().min(20),
  selling_price: z.coerce.number().min(1),
  mrp: z.coerce.number().min(1),
  variants: z.array(z.object({
    id: z.string().optional(),
    size: z.string().min(1),
    color: z.string().min(1),
    stock_quantity: z.coerce.number().min(0),
    sku: z.string().optional(),
  })),
})

type ProductForm = z.infer<typeof productSchema>

const CATEGORIES = [
  'Ethnic Wear', 'Western Wear', 'Kids Fashion', 'Footwear',
  'Accessories', 'Activewear', 'Formal Wear', 'Casual Wear',
]
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size',
  '6', '7', '8', '9', '10', '11', '12']
const COLORS = [
  'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink',
  'Purple', 'Orange', 'Brown', 'Grey', 'Navy', 'Maroon', 'Beige',
]

interface ExistingImage {
  url: string
  isPrimary: boolean
}

export default function EditProductPage() {
  const { id } = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [newImageFiles, setNewImageFiles] = useState<{ file: File; preview: string }[]>([])

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/sellers/products/${id}`).then((r) => r.data),
  })

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  })

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        category: product.category,
        brand: product.brand || '',
        description: product.description,
        selling_price: product.selling_price,
        mrp: product.mrp,
        variants: product.variants || [],
      })
      setTags(product.tags || [])
      setExistingImages(
        (product.images || []).map((img: any) => ({
          url: img.url,
          isPrimary: img.is_primary,
        }))
      )
    }
  }, [product, form])

  const updateProduct = useMutation({
    mutationFn: (formData: FormData) =>
      api.put(`/sellers/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['product', id] })
      toast.success('Product updated!')
      router.push('/products')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const totalImages = existingImages.length + newImageFiles.length
    const remaining = 8 - totalImages
    const newFiles = files.slice(0, remaining).map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
    }))
    setNewImageFiles((prev) => [...prev, ...newFiles])
  }

  const onSubmit = (data: ProductForm) => {
    const formData = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      if (k !== 'variants') formData.append(k, String(v))
    })
    formData.append('variants', JSON.stringify(data.variants))
    tags.forEach((t) => formData.append('tags[]', t))
    formData.append(
      'existing_images',
      JSON.stringify(existingImages)
    )
    newImageFiles.forEach(({ file }) => formData.append('new_images', file))
    updateProduct.mutate(formData)
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  const discountPct = (() => {
    const s = form.watch('selling_price')
    const m = form.watch('mrp')
    return m && s && m > s ? Math.round(((m - s) / m) * 100) : 0
  })()

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Edit Product</h1>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
                <input
                  {...form.register('name')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                  <select
                    {...form.register('category')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand</label>
                  <input
                    {...form.register('brand')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                <textarea
                  {...form.register('description')}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
                {form.formState.errors.description && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                      <Tag className="h-3 w-3" />
                      {tag}
                      <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                    placeholder="Add tag and press Enter"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button type="button" onClick={addTag} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Add</button>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Selling Price (₹) *</label>
                <input
                  type="number"
                  {...form.register('selling_price')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">MRP (₹) *</label>
                <input
                  type="number"
                  {...form.register('mrp')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            {discountPct > 0 && (
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-sm text-emerald-700 font-medium">{discountPct}% discount applied</p>
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Variants & Stock</h2>
              <button
                type="button"
                onClick={() => append({ size: 'M', color: 'Black', stock_quantity: 0, sku: '' })}
                className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Plus className="h-4 w-4" />
                Add Variant
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Size</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Color</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Stock</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fields.map((field, i) => (
                    <tr key={field.id}>
                      <td className="px-3 py-2">
                        <select {...form.register(`variants.${i}.size`)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                          {SIZES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select {...form.register(`variants.${i}.color`)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                          {COLORS.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} {...form.register(`variants.${i}.stock_quantity`)} className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" {...form.register(`variants.${i}.sku`)} placeholder="Optional" className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </td>
                      <td className="px-3 py-2">
                        {fields.length > 1 && (
                          <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Images</h2>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-emerald-500 mb-4">
              <Upload className="h-6 w-6 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Upload new images</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </label>
            <div className="grid grid-cols-4 gap-3">
              {existingImages.map((img, i) => (
                <div key={i} className="relative group aspect-square">
                  <img src={img.url} alt="" className={`w-full h-full object-cover rounded-lg border-2 ${img.isPrimary ? 'border-yellow-400' : 'border-gray-200'}`} />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center gap-2">
                    <button type="button" onClick={() => setExistingImages((prev) => prev.map((im, j) => ({ ...im, isPrimary: j === i })))} className={`p-1.5 rounded-full ${img.isPrimary ? 'bg-yellow-400' : 'bg-white/80'}`}>
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => setExistingImages((prev) => prev.filter((_, j) => j !== i))} className="p-1.5 rounded-full bg-white/80 hover:bg-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {img.isPrimary && <span className="absolute bottom-1 left-1 bg-yellow-400 text-white text-xs px-1.5 py-0.5 rounded-full">Primary</span>}
                </div>
              ))}
              {newImageFiles.map((img, i) => (
                <div key={`new-${i}`} className="relative group aspect-square">
                  <img src={img.preview} alt="" className="w-full h-full object-cover rounded-lg border-2 border-emerald-300" />
                  <button type="button" onClick={() => setNewImageFiles((prev) => prev.filter((_, j) => j !== i))} className="absolute top-1 right-1 p-1 bg-red-500 rounded-full">
                    <X className="h-3 w-3 text-white" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-emerald-500 text-white text-xs px-1.5 py-0.5 rounded-full">New</span>
                </div>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()} className="px-6 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProduct.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50"
            >
              {updateProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </DashboardLayout>
    </AuthGuard>
  )
}
