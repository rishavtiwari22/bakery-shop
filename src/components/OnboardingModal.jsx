import { useState, useEffect } from 'react'
import { Phone, ArrowRight, Loader2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { updateUserProfile } from '../services/firebase'
import toast from 'react-hot-toast'

export default function OnboardingModal() {
  const { user, profile, refreshProfile } = useAuth()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [skipped, setSkipped] = useState(false)

  useEffect(() => {
    const isSkipped = sessionStorage.getItem('onboarding_skipped')
    if (isSkipped) setSkipped(true)
  }, [])

  const handleSkip = () => {
    sessionStorage.setItem('onboarding_skipped', 'true')
    setSkipped(true)
  }

  // Show only if logged in, phone is missing, and not skipped in this session
  if (!user || skipped || (profile && profile.phone)) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (phone.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }

    setLoading(true)
    try {
      await updateUserProfile(user.uid, { phone })
      await refreshProfile()
      toast.success('Profile updated! Ready to order. 🍰')
    } catch (err) {
      console.error('Onboarding Error:', err)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="relative h-32 bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center overflow-hidden">
          <button 
            onClick={handleSkip}
            className="absolute top-4 right-4 z-10 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>

          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 right-4 text-4xl">🥐</div>
            <div className="absolute bottom-2 left-4 text-4xl">🧁</div>
          </div>
          <div className="bg-white/20 p-4 rounded-full backdrop-blur-md">
            <Phone className="text-white" size={32} />
          </div>
        </div>
        
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Welcome to Nice Bakery!
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            We need your phone number to ensure smooth delivery of your delicious treats.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+91</span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit phone number"
                className="w-full pl-14 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all text-lg tracking-widest font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading || phone.length < 10}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-100 disabled:text-gray-400 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-orange-100 hover:shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Start Ordering <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full py-2 text-sm font-semibold text-gray-400 hover:text-orange-500 transition-colors"
            >
              Skip for now
            </button>
          </form>
          
          <p className="mt-6 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            Guaranteed Secure & Private
          </p>
        </div>
      </div>
    </div>
  )
}
