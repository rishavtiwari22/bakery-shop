import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Specialized store to handle "In-Flight" orders.
 * If a payment succeeds but the internet dies, this store
 * holds the order payload for auto-recovery.
 */
export const useRecoveryStore = create(
  persist(
    (set, get) => ({
      pendingOrder: null, // { payload, paymentId, timestamp }
      
      // Stage the order before Razorpay opens
      stageOrder: (payload) => {
        set({ 
          pendingOrder: { 
            payload, 
            paymentId: null, 
            timestamp: Date.now() 
          } 
        })
      },

      // Add payment ID after Razorpay success
      addPaymentId: (paymentId) => {
        const current = get().pendingOrder
        if (current) {
          set({ 
            pendingOrder: { ...current, paymentId } 
          })
        }
      },

      // Clear after successful sync to Firestore
      clear: () => {
        set({ pendingOrder: null })
      }
    }),
    {
      name: 'bakery-recovery-storage',
    }
  )
)
