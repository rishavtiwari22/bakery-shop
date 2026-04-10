import { useEffect, useCallback } from 'react'
import { useProductStore } from '../store/useProductStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useAuth } from '../context/AuthContext'
import { useRecoveryStore } from '../store/recoveryStore'
import { placeOrderWithStockCheck } from '../services/firebase'
import toast from 'react-hot-toast'

export default function GlobalInitializer({ children }) {
  const initProducts = useProductStore((s) => s.init)
  const initSettings = useSettingsStore((s) => s.init)
  const { user, refreshProfile } = useAuth()
  const { pendingOrder, clear: clearRecovery } = useRecoveryStore()

  // --- RECOVERY LOGIC ---
  const attemptRecovery = useCallback(async () => {
    if (!pendingOrder || !pendingOrder.paymentId) return

    try {
      console.log('🔄 Attempting order recovery...', pendingOrder.paymentId)
      await placeOrderWithStockCheck({
        ...pendingOrder.payload,
        paymentId: pendingOrder.paymentId,
        recovered: true
      })
      
      clearRecovery()
      toast.success('Internet Restored! Your pending order has been placed. 🎉', { icon: '📡', duration: 6000 })
    } catch (err) {
      console.error('Recovery failed (likely still offline or out of stock):', err)
    }
  }, [pendingOrder, clearRecovery])

  useEffect(() => {
    // Check for recovery on mount and whenever connection returns
    attemptRecovery()
    window.addEventListener('online', attemptRecovery)
    return () => window.removeEventListener('online', attemptRecovery)
  }, [attemptRecovery])
  // ----------------------

  useEffect(() => {
    initSettings()
    initProducts()
  }, [initSettings, initProducts])

  useEffect(() => {
    if (user?.uid) {
      refreshProfile(user.uid)
    }
  }, [user, refreshProfile])

  return children
}
