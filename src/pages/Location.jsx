import { useState, useEffect } from 'react'
import { MapPin, Navigation, Loader2, CheckCircle, AlertTriangle, ShoppingBag } from 'lucide-react'
import MapView from '../components/MapView'
import { useCartStore } from '../store/cartStore'
import { useAuth } from '../context/AuthContext'
import { getCurrentPosition, distanceFromBakery, reverseGeocode, searchAddress, MAX_DELIVERY_KM } from '../services/geolocation'
import { createOrder, getUserProfile } from '../services/firebase'
import { initiatePayment } from '../services/razorpay'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Location() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { items, getTotal, clearCart } = useCartStore()
  const [userLocation, setUserLocation] = useState(null)
  const [address, setAddress] = useState('')
  const [distance, setDistance] = useState(null)
  const [locating, setLocating] = useState(false)
  const [paying, setPaying] = useState(false)
  const total = getTotal()

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
  }, [user])

  const loadUserProfile = async () => {
    try {
      const p = await getUserProfile(user.uid)
      if (p) {
        reset({
          name: p.name || user.displayName || '',
          phone: p.phone || ''
        })
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
    }
  }

  const handleLocate = async () => {
    setLocating(true)
    try {
      toast('Finding your precise location...', { icon: '⏲️' })
      const pos = await getCurrentPosition()
      const dist = distanceFromBakery(pos.lat, pos.lng)
      setUserLocation(pos)
      setDistance(dist)
      const addr = await reverseGeocode(pos.lat, pos.lng)
      setAddress(addr)
      if (dist > MAX_DELIVERY_KM) {
        toast.error(`You're ${dist.toFixed(1)}km away — outside our 10km delivery zone!`)
      } else {
        toast.success(`Location set! ${dist.toFixed(1)}km from bakery ✓`)
      }
    } catch (err) {
      // If auto-locate fails, center on bakery as a helpful starting point instead of showing error
      const { BAKERY_LAT, BAKERY_LNG } = await import('../services/geolocation') 
      const bakeryPos = { lat: BAKERY_LAT, lng: BAKERY_LNG }
      setUserLocation(bakeryPos)
      setDistance(0)
      setAddress('Centered on Bakery (Please drag the blue pin to your door)')
      toast('GPS timed out or blocked. We\'ve centered the map on the bakery—please drag the pin to your delivery spot!', {
        icon: '📍',
        duration: 8000,
      })
    } finally {
      setLocating(false)
    }
  }

  const handleSearch = async () => {
    if (!address) { toast.error('Please type an address to search'); return }
    setLocating(true)
    try {
      const result = await searchAddress(address)
      if (result) {
        const dist = distanceFromBakery(result.lat, result.lng)
        setUserLocation(result)
        setDistance(dist)
        setAddress(result.displayName)
        toast.success('Address found and pinned! 📍')
      } else {
        toast.error('Could not find this address. Please try something more specific.')
      }
    } catch (err) {
      toast.error('Search failed. Please try again or pin on map.')
    } finally {
      setLocating(false)
    }
  }

  const handleMapSelect = async (latlng) => {
    const dist = distanceFromBakery(latlng.lat, latlng.lng)
    setUserLocation(latlng)
    setDistance(dist)
    const addr = await reverseGeocode(latlng.lat, latlng.lng)
    setAddress(addr)
  }

  const onCheckout = async (formData) => {
    if (!user) { navigate('/login'); return }
    if (items.length === 0) { toast.error('Your cart is empty!'); return }
    if (!userLocation) { toast.error('Please set your delivery location first.'); return }
    if (distance > MAX_DELIVERY_KM) { toast.error('Outside delivery zone (10km max).'); return }

    initiatePayment({
      amount: total,
      name: formData.name || user.displayName || 'Customer',
      email: user.email,
      contact: formData.phone || '',
      onSuccess: async (response) => {
        setPaying(true)
        try {
          await createOrder({
            customerId: user.uid,
            customerName: formData.name || user.displayName,
            customerEmail: user.email,
            customerPhone: formData.phone,
            items: items.map((i) => ({ itemId: i.id, name: i.name, qty: i.qty, price: i.price })),
            total,
            address: { lat: userLocation.lat, lng: userLocation.lng, full: address },
            distance,
            notes: useCartStore.getState().orderNotes,
            paymentId: response.razorpay_payment_id,
          })

          // Update/Sync profile
          await updateUserProfile(user.uid, { 
            name: formData.name || user.displayName, 
            phone: formData.phone, 
            email: user.email 
          })

          clearCart()
          toast.success('Order placed successfully! 🎉')
          navigate('/orders')
        } catch (err) {
          toast.error('Payment done but order save failed. Contact support.')
        } finally {
          setPaying(false)
        }
      },
      onFailure: (err) => {
        toast.error('Payment failed: ' + (err?.description || err?.message || 'Unknown error'))
      },
    })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
        Delivery & Checkout
      </h1>

      <div className="grid lg:grid-cols-2 gap-8 items-stretch">
        {/* Map Card */}
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm flex flex-col h-full min-h-[500px] overflow-hidden">
          <div className="p-4 border-b border-orange-50 bg-orange-50/10 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <MapPin size={16} className="text-orange-500" />
              Pin Delivery Location
            </h2>
            {distance !== null && (
              <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                distance <= MAX_DELIVERY_KM ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {distance.toFixed(1)} km
              </div>
            )}
          </div>
          
          <div className="flex-1 relative">
            <MapView userLocation={userLocation} onLocationSelect={handleMapSelect} interactive />
          </div>

          <div className="p-4 bg-orange-50/5 border-t border-orange-50">
            {address ? (
              <p className="text-[11px] text-gray-500 font-medium leading-tight line-clamp-2">
                {address}
              </p>
            ) : (
              <p className="text-[11px] text-gray-400 italic">Drag blue pin precisely to your door...</p>
            )}
            
            {distance !== null && distance > MAX_DELIVERY_KM && (
              <div className="mt-2 flex items-center gap-2 text-[9px] px-2 py-1.5 rounded-md bg-red-50 text-red-600 font-bold uppercase tracking-widest border border-red-100/50">
                <AlertTriangle size={12} />
                Outside 10km Zone
              </div>
            )}
          </div>
        </div>

        {/* Checkout form */}
        <div className="flex flex-col h-full">
          <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm flex-1">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Details</h2>

            <form onSubmit={handleSubmit(onCheckout)} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Full Name *</label>
                <input
                  {...register('name', { required: true })}
                  defaultValue={user?.displayName || ''}
                  className="w-full border border-gray-100 focus:border-orange-400 focus:ring-4 focus:ring-orange-50 outline-none rounded-xl px-4 py-2.5 text-sm transition-all bg-gray-50/30"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Delivery Address (Search) *</label>
                <div className="relative group">
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-gray-100 focus:border-orange-400 focus:ring-4 focus:ring-orange-50 outline-none rounded-xl px-4 py-2.5 text-sm pr-20 transition-all bg-gray-50/30"
                    placeholder="Type colony, area, or landmark..."
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={locating || !address}
                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 rounded-lg text-[10px] font-black tracking-widest transition-all disabled:opacity-50 shadow-sm"
                  >
                    SEARCH
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Phone *</label>
                <input
                  {...register('phone', { required: true, pattern: /^[6-9]\d{9}$/ })}
                  type="tel"
                  className="w-full border border-gray-100 focus:border-orange-400 focus:ring-4 focus:ring-orange-50 outline-none rounded-xl px-4 py-2.5 text-sm transition-all bg-gray-50/30 font-medium"
                  placeholder="9876543210"
                />
                {errors.phone && <p className="text-red-500 text-[10px] mt-1 font-bold">Enter a valid 10-digit Indian mobile number</p>}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleLocate}
                  disabled={locating}
                  className="w-full flex items-center justify-center gap-2 bg-orange-50 text-orange-600 border border-orange-100/50 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 transition-all disabled:opacity-60"
                >
                  {locating ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                  Auto-Locate GPS
                </button>
              </div>

              {/* Order summary */}
              <div className={`bg-orange-50/50 rounded-xl border border-orange-100/50 ${items.length === 0 ? 'p-2' : 'p-4'} transition-all`}>
                {items.length === 0 ? (
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cart is empty</p>
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="text-[10px] font-black text-orange-600 hover:underline"
                    >
                      Browse items →
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Order Summary</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-hide">
                      {items.map((i) => (
                        <div key={i.id} className="flex justify-between text-xs font-medium text-gray-600">
                          <span>{i.name} × {i.qty}</span>
                          <span className="text-gray-900">₹{(i.price * i.qty).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-orange-200/50 mt-3 pt-3 flex justify-between font-black text-sm text-gray-900">
                      <span className="uppercase tracking-widest text-[10px]">Grand Total</span>
                      <span className="text-orange-600">₹{total.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={paying || items.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-xl font-bold text-sm transition-all shadow-xl shadow-orange-200/50"
              >
                {paying && <Loader2 size={18} className="animate-spin" />}
                PAY ₹{total.toFixed(2)} NOW
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
