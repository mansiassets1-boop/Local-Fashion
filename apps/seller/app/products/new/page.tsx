'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Upload,
  GripVertical,
  Star,
  Loader2,
  Tag,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import AuthGuard from '@/components/AuthGuard'
import api from '@/lib/api'

const basicSchema = z.object({
  name: z.string().min(3, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  tags: z.array(z.string()).optional(),
})

const pricingSchema = z.object({
  selling_price: z.coerce.number().min(1, 'Selling price required'),
  mrp: z.coerce.number().min(1, 'MRP required'),
})

const variantSchema = z.object({
  variants: z.array(
    z.object({
      size: z.string().min(1),
      color: z.string().min(1),
      stock_quantity: z.coerce.number().min(0),
      sku: z.string().optional(),
    })
  ),
})

type BasicForm = z.infer<typeof basicSchema>
type PricingForm = z.infer<typeof pricingSchema>
type VariantForm = z.infer<typeof variantSchema>

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

const STEPS = ['Basic Info', 'Pricing', 'Variants', 'Images']

interface ImageFile {
  file: File
  preview: string
  isPrimary: boolean
}

export default function NewProductPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [images, setImages] = useState<ImageFile[]>([])
  const [basicData, setBasicData] = useState<BasicForm | null>(null)
  const [pricingData, setPricingData] = useState<PricingForm | null>(null)

  const basicForm = useForm<BasicForm>({ resolver: zodResolver(basicSchema) })
  const pricingForm = useForm<PricingForm>({ resolver: zodResolver(pricingSchema) })
  const variantForm = useForm<VariantForm>({
    resolver: zodResolver(variantSchema),
    defaultValues: { variants: [{ size: 'M', color: 'Black', stock_quantity: 10, sku: '' }] },
  })

  const { fields, append, remove } = useFieldArray({
    control: variantForm.control,
    name: 'variants',
  })

  const createProduct = useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/sellers/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      toast.success('Product created successfully!')
      router.push('/products')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create product')
    },
  })

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag))

  const handleImageDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newImages = files.slice(0, 8 - images.length).map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: images.length === 0 && i === 0,
    }))
    setImages((prev) => [...prev, ...newImages])
  }

  const setPrimary = (index: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === index })))
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (prev[index].isPrimary && next.length > 0) {
        next[0].isPrimary = true
      }
      return next
    })
  }

  const handleSubmit = async (variantData: VariantForm) => {
    if (!basicData || !pricingData) return

    const formData = new FormData()
    formData.append('name', basicData.name)
    formData.append('category', basicData.category)
    if (basicData.brand) formData.append('brand', basicData.brand)
    formData.append('description', basicData.description)
    tags.forEach((t) => formData.append('tags[]', t))
    formData.append('selling_price', String(pricingData.selling_price))
    formData.append('mrp', String(pricingData.mrp))
    formData.append('variants', JSON.stringify(variantData.variants))

    images.forEach((img, i) => {
      formData.append('images', img.file)
      if (img.isPrimary) formData.append('primary_image_index', String(i))
    })

    createProduct.mutate(formData)
  }

  const sellingPrice = pricingForm.watch('selling_price')
  const mrp = pricingForm.watch('mrp')
  const discountPct = mrp && sellingPrice && mrp > sellingPrice
    ? Math.round(((mrp - sellingPrice) / mrp) * 100)
    : 0

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Add New Product</h1>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  i === step
                    ? 'bg-emerald-600 text-white'
                    : i < step
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  i === step ? 'bg-white text-emerald-600' : i < step ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>{i + 1}</span>
                {s}
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-gray-400" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          {/* Step 0: Basic Info */}
          {step === 0 && (
            <form onSubmit={basicForm.handleSubmit((d) => { setBasicData(d); setStep(1) })} className="space-y-5">
              <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
                <input
                  {...basicForm.register('name')}
                  placeholder="e.g. Floral Anarkali Kurta"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {basicForm.formState.errors.name && (
                  <p className="text-red-500 text-xs mt-1">{basicForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                  <select
                    {...basicForm.register('category')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  {basicForm.formState.errors.category && (
                    <p className="text-red-500 text-xs mt-1">{basicForm.formState.errors.category.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand</label>
                  <input
                    {...basicForm.register('brand')}
                    placeholder="Optional"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                <textarea
                  {...basicForm.register('description')}
                  rows={4}
                  placeholder="Describe your product, fabric, style, occasion..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
                {basicForm.formState.errors.description && (
                  <p className="text-red-500 text-xs mt-1">{basicForm.formState.errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}>
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
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm"
              >
                Next: Pricing <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Step 1: Pricing */}
          {step === 1 && (
            <form onSubmit={pricingForm.handleSubmit((d) => { setPricingData(d); setStep(2) })} className="space-y-5">
              <h2 className="text-base font-semibold text-gray-900">Pricing</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Selling Price (₹) *</label>
                  <input
                    type="number"
                    {...pricingForm.register('selling_price')}
                    placeholder="799"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {pricingForm.formState.errors.selling_price && (
                    <p className="text-red-500 text-xs mt-1">{pricingForm.formState.errors.selling_price.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">MRP (₹) *</label>
                  <input
                    type="number"
                    {...pricingForm.register('mrp')}
                    placeholder="999"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {pricingForm.formState.errors.mrp && (
                    <p className="text-red-500 text-xs mt-1">{pricingForm.formState.errors.mrp.message}</p>
                  )}
                </div>
              </div>

              {discountPct > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-emerald-800">
                    Discount Preview: {discountPct}% off
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Customers save ₹{(mrp - sellingPrice).toLocaleString('en-IN')} on this product
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4 inline mr-1" />
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm"
                >
                  Next: Variants <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Variants */}
          {step === 2 && (
            <form onSubmit={variantForm.handleSubmit(() => setStep(3))} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Variants</h2>
                <button
                  type="button"
                  onClick={() => append({ size: 'M', color: 'Black', stock_quantity: 10, sku: '' })}
                  className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Variant
                </button>
              </div>

              {/* Variant table */}
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="bg-gray-50 rounded-lg">
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
                          <select
                            {...variantForm.register(`variants.${i}.size`)}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {SIZES.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            {...variantForm.register(`variants.${i}.color`)}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {COLORS.map((c) => <option key={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            {...variantForm.register(`variants.${i}.stock_quantity`)}
                            className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            {...variantForm.register(`variants.${i}.sku`)}
                            placeholder="Optional"
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(i)}
                              className="text-red-400 hover:text-red-600 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4 inline mr-1" />
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm"
                >
                  Next: Images <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Images */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-gray-900">Product Images</h2>
              <p className="text-sm text-gray-500">Upload up to 8 images. Click the star to set as primary.</p>

              <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors ${
                images.length >= 8 ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 hover:border-emerald-500'
              }`}>
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {images.length >= 8 ? 'Maximum 8 images reached' : 'Click to upload images'}
                </span>
                <span className="text-xs text-gray-400 mt-1">{images.length}/8 images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={images.length >= 8}
                  onChange={handleImageDrop}
                />
              </label>

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                        <img
                          src={img.preview}
                          alt={`Product ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPrimary(i)}
                          className={`p-1.5 rounded-full ${img.isPrimary ? 'bg-yellow-400' : 'bg-white/80 hover:bg-yellow-400'}`}
                          title="Set as primary"
                        >
                          <Star className={`h-3.5 w-3.5 ${img.isPrimary ? 'text-white fill-white' : 'text-gray-700'}`} />
                        </button>
                        <button
                          onClick={() => removeImage(i)}
                          className="p-1.5 rounded-full bg-white/80 hover:bg-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-gray-700 hover:text-white" />
                        </button>
                      </div>
                      {img.isPrimary && (
                        <span className="absolute bottom-1 left-1 bg-yellow-400 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4 inline mr-1" />
                  Back
                </button>
                <button
                  onClick={() => variantForm.handleSubmit(handleSubmit)()}
                  disabled={createProduct.isPending || images.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createProduct.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Create Product'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
