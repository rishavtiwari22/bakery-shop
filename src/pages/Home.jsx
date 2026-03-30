import { useState, useEffect, useMemo } from 'react'
import { Search, Filter, Loader2, ChefHat } from 'lucide-react'
import { fetchItems } from '../services/firebase'
import ItemCard from '../components/ItemCard'
import toast from 'react-hot-toast'

import { useProductStore } from '../store/useProductStore'

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Veg', value: 'veg' },
  { label: 'Non-Veg', value: 'non-veg' },
]

import { useSettingsStore } from '../store/useSettingsStore'
import bakeryData from '../data/bakeryData.json'

export default function Home() {
  const { products, loading: storeLoading, init } = useProductStore()
  const [activeFilter, setActiveFilter] = useState('')
  const [search, setSearch] = useState('')
  const settings = useSettingsStore(s => s.settings) || bakeryData

  useEffect(() => {
    init()
  }, [])

  const items = useMemo(() => {
    return useProductStore.getState().getFilteredProducts(activeFilter, search)
  }, [products, activeFilter, search])

  const loading = storeLoading && products.length === 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-8 mb-10 overflow-hidden text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-10 text-8xl">🎂</div>
          <div className="absolute bottom-2 right-32 text-5xl">🍞</div>
          <div className="absolute top-8 right-48 text-4xl">🧁</div>
        </div>
        <div className="relative">
          <p className="text-orange-100 text-sm font-medium mb-1">{settings.tagline}</p>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            {settings.name}, <br className="sm:hidden" />
            <span className="text-orange-100">Freshly Baked for You</span>
          </h1>
          <p className="text-orange-100 text-sm max-w-xs">
            {settings.description || settings.detailedDescription}
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cakes, breads, pastries..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 text-sm"
          />
        </div>
        <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setActiveFilter(f.value); setSearch('') }}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeFilter === f.value
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-orange-500" size={40} />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🍰</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No items found</h2>
          <p className="text-gray-400 text-sm">Try a different search or filter.</p>
          <button
            onClick={() => { setSearch(''); setActiveFilter('') }}
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{items.length} item{items.length !== 1 ? 's' : ''} available</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
