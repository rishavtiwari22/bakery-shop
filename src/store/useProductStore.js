import { create } from 'zustand'
import { fetchItems } from '../services/firebase'

export const useProductStore = create((set, get) => ({
  products: [],
  loading: false,
  initialized: false,

  // Fetch all products once and cache them
  init: async (force = false) => {
    if (get().initialized && !force) return
    
    set({ loading: true })
    try {
      const data = await fetchItems() // Fetches all items
      set({ products: data, initialized: true })
    } catch (err) {
      console.error('Failed to init product store:', err)
    } finally {
      set({ loading: false })
    }
  },

  // Refresh data (called after admin changes)
  refresh: async () => {
    set({ loading: true })
    try {
      const data = await fetchItems()
      set({ products: data, initialized: true })
    } catch (err) {
      console.error('Failed to refresh products:', err)
    } finally {
      set({ loading: false })
    }
  },

  // Get filtered products locally (instant)
  getFilteredProducts: (tag, search = '') => {
    let filtered = [...get().products]
    
    if (tag) {
      filtered = filtered.filter(p => p.tags?.includes(tag))
    }
    
    if (search) {
      const s = search.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(s) || 
        p.desc?.toLowerCase().includes(s)
      )
    }
    
    return filtered
  }
}))
