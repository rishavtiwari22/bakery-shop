import { Link } from 'react-router-dom'
import { ShoppingCart, Star } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { optimizeImage } from '../services/imageUtils'
import toast from 'react-hot-toast'
import { useSettingsStore } from '../store/useSettingsStore'

const VEG_BADGE = () => (
  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-300">
    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
    VEG
  </span>
)

const NON_VEG_BADGE = () => (
  <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-300">
    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
    NON-VEG
  </span>
)

export default function ItemCard({ item }) {
  const addItem = useCartStore((s) => s.addItem)
  const currency = useSettingsStore((s) => s.settings.currency)

  const handleAdd = (e) => {
    e.preventDefault()
    if (item.isOutOfStock || item.stockQty === 0) return
    addItem(item, 1)
    toast.success(`${item.name} added to cart! 🛒`)
  }

  const isVeg = item.tags?.includes('veg')
  const isOutOfStock = item.isOutOfStock || item.stockQty === 0

  return (
    <Link to={`/item/${item.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-orange-100/50">
        {/* Image */}
        <div className="relative overflow-hidden h-48">
          {item.photoUrl ? (
            <img
              src={optimizeImage(item.photoUrl, 400)}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-5xl">
              🍰
            </div>
          )}
          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                Out of Stock
              </span>
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {isVeg ? <VEG_BADGE /> : <NON_VEG_BADGE />}
            {item.offer > 0 && !isOutOfStock && (
              <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-orange-200 border border-orange-400 uppercase tracking-widest animate-pulse">
                {item.offer}% OFF
              </span>
            )}
          </div>
          {/* Low stock badge */}
          {!isOutOfStock && item.stockQty > 0 && item.stockQty <= 5 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-300 shadow-sm animate-pulse">
              Only {item.stockQty} Left!
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-base leading-tight truncate flex-1">{item.name}</h3>
            <div className="flex flex-col items-end">
              <span className="text-orange-600 font-bold text-sm whitespace-nowrap">{currency}{(item.price * (1 - (item.offer || 0) / 100)).toFixed(0)}</span>
              {item.offer > 0 && (
                <span className="text-[10px] text-gray-400 line-through font-medium">{currency}{item.price}</span>
              )}
            </div>
          </div>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center text-amber-500">
              <Star size={12} fill="currentColor" />
            </div>
            <span className="text-[11px] font-bold text-gray-600">
              {item.avgRating ? item.avgRating.toFixed(1) : 'New'}
            </span>
            {item.reviewCount > 0 && (
              <span className="text-[10px] text-gray-400 font-medium">({item.reviewCount})</span>
            )}
          </div>

          <p className="text-gray-500 text-xs line-clamp-2 mb-3">{item.desc}</p>


          {/* Add to cart button */}
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 active:scale-95 text-white shadow-sm shadow-orange-200'
            }`}
          >
            <ShoppingCart size={15} />
            {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  )
}
