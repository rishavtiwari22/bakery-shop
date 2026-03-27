import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { addItem, updateItem, uploadPhoto } from '../services/firebase'
import { Loader2, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminItemForm({ item = null, onSuccess }) {
  const isEdit = !!item
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: item || { name: '', price: '', desc: '', stockQty: '', tags: [] },
  })
  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(item?.photoUrl || null)

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      let photoUrl = item?.photoUrl || ''
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile)
      }

      const payload = {
        name: data.name,
        price: Number(data.price),
        desc: data.desc,
        stockQty: Number(data.stockQty),
        isOutOfStock: Number(data.stockQty) === 0,
        tags: data.isVeg ? ['veg'] : ['non-veg'],
        photoUrl,
      }

      if (isEdit) {
        await updateItem(item.id, payload)
        toast.success('Item updated!')
      } else {
        await addItem(payload)
        toast.success('Item added!')
        reset()
        setPhotoPreview(null)
        setPhotoFile(null)
      }
      onSuccess?.()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Photo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Photo</label>
        <div className="flex items-center gap-4">
          {photoPreview ? (
            <div className="relative">
              <img src={photoPreview} alt="preview" className="w-24 h-24 object-cover rounded-xl border border-orange-200" />
              <button type="button" onClick={() => { setPhotoPreview(null); setPhotoFile(null) }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 flex items-center justify-center text-3xl">🍰</div>
          )}
          <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 hover:border-orange-400 px-4 py-2.5 rounded-xl text-sm text-gray-600 transition-colors">
            <Upload size={16} /> Upload Photo
            <input type="file" className="hidden" accept="image/*" onChange={handlePhoto} />
          </label>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
        <input
          {...register('name', { required: 'Name is required' })}
          className="w-full border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none rounded-xl px-4 py-2.5 text-sm"
          placeholder="e.g. Chocolate Truffle Cake"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      {/* Price + Stock */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹) *</label>
          <input
            type="number"
            {...register('price', { required: true, min: 1 })}
            className="w-full border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none rounded-xl px-4 py-2.5 text-sm"
            placeholder="299"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Qty *</label>
          <input
            type="number"
            {...register('stockQty', { required: true, min: 0 })}
            className="w-full border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none rounded-xl px-4 py-2.5 text-sm"
            placeholder="10"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea
          {...register('desc')}
          rows={3}
          className="w-full border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none rounded-xl px-4 py-2.5 text-sm resize-none"
          placeholder="Describe this delicious item..."
        />
      </div>

      {/* Veg toggle */}
      <div className="flex items-center gap-3">
        <input type="checkbox" id="isVeg" {...register('isVeg')} className="w-4 h-4 accent-green-500" defaultChecked={item?.tags?.includes('veg')} />
        <label htmlFor="isVeg" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm border-2 border-green-500 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          </span>
          Mark as Vegetarian
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-all"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {isEdit ? 'Update Item' : 'Add Item'}
      </button>
    </form>
  )
}
