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

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Map */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">📍 Pin your delivery location</p>
          </div>

          <div className="h-72 sm:h-96 rounded-xl overflow-hidden">
            <MapView userLocation={userLocation} onLocationSelect={handleMapSelect} interactive />
          </div>

          {/* Distance badge */}
          {distance !== null && (
            <div className={`mt-3 flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
              distance <= MAX_DELIVERY_KM ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {distance <= MAX_DELIVERY_KM ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              {distance <= MAX_DELIVERY_KM
                ? `✓ ${distance.toFixed(2)}km from bakery — delivery available!`
                : `✗ ${distance.toFixed(2)}km — too far (max 10km)`}
            </div>
          )}
          {address && <p className="text-xs text-gray-500 mt-2 truncate"><MapPin size={12} className="inline" /> {address}</p>}
        </div>

        {/* Checkout form */}
        <div>
          <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Details</h2>

            <form onSubmit={handleSubmit(onCheckout)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <input
                  {...register('name', { required: true })}
                  defaultValue={user?.displayName || ''}
                  className="w-full border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none rounded-xl px-4 py-2.5 text-sm"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Address (Search) *</label>
                <div className="relative">
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none rounded-xl px-4 py-2.5 text-sm pr-24"
                    placeholder="Type colony, area, or landmark..."
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={locating || !address}
                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-orange-100 hover:bg-orange-200 text-orange-600 px-3 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50"
                  >
                    SEARCH
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Tip: If GPS is inaccurate, type your area name and click SEARCH to "calculate" your location.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      {...register('phone', { required: true, pattern: /^[6-9]\d{9}$/ })}
                      type="tel"
                      className="w-full border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none rounded-xl px-4 py-2.5 text-sm"
                      placeholder="9876543210"
                    />
                  </div>
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">Enter a valid 10-digit Indian mobile number</p>}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLocate}
                  disabled={locating}
                  className="w-full flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                >
                  {locating ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                  USE MY CURRENT LOCATION
                </button>
              </div>

              {/* Order summary */}
              <div className="bg-orange-50 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">Order Summary</p>
                {items.length === 0 ? (
                  <div className="text-center py-2">
                    <p className="text-gray-400 text-sm mb-3">Your cart is empty</p>
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="inline-flex items-center gap-2 text-xs bg-orange-100 text-orange-600 px-4 py-2 rounded-xl font-bold hover:bg-orange-200 transition-colors"
                    >
                      <ShoppingBag size={14} /> BROWSE CATALOG
                    </button>
                  </div>
                ) : (
                  <>
                    {items.map((i) => (
                      <div key={i.id} className="flex justify-between text-sm text-gray-600">
                        <span>{i.name} × {i.qty}</span>
                        <span>₹{(i.price * i.qty).toFixed(0)}</span>
                      </div>
                    ))}
                    <div className="border-t border-orange-200 pt-2 flex justify-between font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-orange-600">₹{total.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={paying || items.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-orange-200"
              >
                {paying && <Loader2 size={16} className="animate-spin" />}
                Pay ₹{total.toFixed(2)} via Razorpay
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
