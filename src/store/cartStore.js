import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ id, name, price, photoUrl, qty, stockQty }]
      orderNotes: '',
      isCartOpen: false,

      // ─── Cart actions ─────────────────────────────────────────────
      addItem: (product, qty = 1) => {
        set((state) => {
          const finalPrice = product.offer > 0 
            ? Math.round(product.price * (1 - product.offer / 100)) 
            : product.price

          const existing = state.items.find((i) => i.id === product.id)
          if (existing) {
            const newQty = Math.min(existing.qty + qty, product.stockQty)
            return {
              items: state.items.map((i) =>
                i.id === product.id ? { ...i, qty: newQty, price: finalPrice, originalPrice: product.price } : i
              ),
            }
          }
          return {
            items: [...state.items, { ...product, price: finalPrice, originalPrice: product.price, qty: Math.min(qty, product.stockQty) }],
          }
        })
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQty: (id, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, qty: Math.max(1, qty) } : i
          ),
        })),

      setOrderNotes: (notes) => set({ orderNotes: notes }),

      clearCart: () => set({ items: [], orderNotes: '' }),

      // ─── Cart visibility ──────────────────────────────────────────
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((s) => ({ isCartOpen: !s.isCartOpen })),

      // ─── Computed helpers (not reactive – call inline) ────────────
      getTotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.qty, 0),

      getCount: () =>
        get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    {
      name: 'sweetbites-cart',
      partialize: (state) => ({ items: state.items, orderNotes: state.orderNotes }),
    }
  )
)
