import { useState, useEffect } from 'react'
import { MapPin, Navigation, Loader2, CheckCircle, AlertTriangle, ShoppingBag } from 'lucide-react'
import MapView from '../components/MapView'
import { useCartStore } from '../store/cartStore'
import { useAuth } from '../context/AuthContext'
import { useSettingsStore } from '../store/useSettingsStore'
import { getCurrentPosition, distanceFromBakery, reverseGeocode, searchAddress, getEstimatedDeliveryTime } from '../services/geolocation'
import { createOrder, getUserProfile, updateUserProfile } from '../services/firebase'
import { initiatePayment } from '../services/razorpay'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getBakeryCoords, DEFAULT_MAX_KM } from '../services/geolocation'

export default function Location() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { items, getTotal, clearCart, setDeliveryDetails, deliveryDetails } = useCartStore()
  const settings = useSettingsStore((s) => s.settings)
  
  const [userLocation, setUserLocation] = useState(null)
  const [address, setAddress] = useState('')
  const [distance, setDistance] = useState(null)
  const [locating, setLocating] = useState(false)
  const [paying, setPaying] = useState(false)
  const [roadDistance, setRoadDistance] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('online') // 'online' | 'cod'
  
  const subtotal = getTotal()
  
  // Delivery Rules from Settings (deep merge with defaults)
  const rules = {
    baseFee: Number(settings?.deliveryRules?.baseFee ?? 20),
    feePerKm: Number(settings?.deliveryRules?.feePerKm ?? 5),
    freeAbove: Number(settings?.deliveryRules?.freeAbove ?? 500),
    maxKm: Number(settings?.deliveryRules?.maxKm ?? DEFAULT_MAX_KM)
  }
  const MAX_DELIVERY_KM = rules.maxKm

  // Calculate Fee
  const calculateFee = (dist) => {
    if (dist > MAX_DELIVERY_KM) return 0
    if (subtotal >= rules.freeAbove) return 0
    // Return 0 if both base and perKm are 0 explicitly
    if (rules.baseFee === 0 && rules.feePerKm === 0) return 0
    return Math.round(rules.baseFee + dist * rules.feePerKm)
  }

  const deliveryFee = roadDistance !== null ? calculateFee(roadDistance) : (distance !== null ? calculateFee(distance) : 0)
  const grandTotal = subtotal + deliveryFee

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || user?.displayName || '',
        phone: profile.phone || ''
      })
    }
  }, [profile, reset, user])

  const handleLocate = async () => {
    setLocating(true)
    try {
      toast('Finding your precise location...', { icon: '⏲️' })
      const pos = await getCurrentPosition()
      const dist = distanceFromBakery(pos.lat, pos.lng)
      setUserLocation(pos)
      setDistance(dist)
      const fee = calculateFee(dist)
      setDeliveryDetails({ distance: dist, fee })
      
      const addr = await reverseGeocode(pos.lat, pos.lng)
      setAddress(addr)
      if (dist > MAX_DELIVERY_KM) {
        toast.error(`You're ${dist.toFixed(1)}km away — outside our ${MAX_DELIVERY_KM}km delivery zone!`)
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
        const fee = calculateFee(dist)
        setDeliveryDetails({ distance: dist, fee })
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
    const fee = calculateFee(dist)
    setDeliveryDetails({ distance: dist, fee })
    const addr = await reverseGeocode(latlng.lat, latlng.lng)
    setAddress(addr)
  }

  const onCheckout = async (formData) => {
    if (!user) { navigate('/login'); return }
    if (items.length === 0) { toast.error('Your cart is empty!'); return }
    if (!userLocation) { toast.error('Please set your delivery location first.'); return }
    if (distance > MAX_DELIVERY_KM) { toast.error(`Outside delivery zone (${MAX_DELIVERY_KM}km max).`); return }

    const orderPayloadBase = {
      customerId: user.uid,
      customerName: formData.name || user.displayName || 'Anonymous',
      customerEmail: user.email || '',
      customerPhone: formData.phone || '',
      items: items.map((i) => ({ 
        itemId: i.id || '', 
        name: i.name || '', 
        qty: i.qty || 1, 
        price: i.price || 0 
      })),
      subtotal: subtotal || 0,
      deliveryFee: deliveryFee || 0,
      total: grandTotal || 0,
      address: { 
        lat: userLocation?.lat || 0, 
        lng: userLocation?.lng || 0, 
        full: address || '' 
      },
      distance: roadDistance || distance || 0,
      estimatedDeliveryTime: new Date(Date.now() + getEstimatedDeliveryTime(roadDistance || distance || 0) * 60000),
      notes: useCartStore.getState().orderNotes || '',
      paymentMethod: paymentMethod,
      paid: paymentMethod === 'online', // Online is paid immediately, COD is not
    }

    if (paymentMethod === 'cod') {
      setPaying(true)
      try {
        console.log('Placing COD Order:', orderPayloadBase)
        await createOrder({ ...orderPayloadBase, paymentId: 'cod' })
        
        // Update/Sync profile
        await updateUserProfile(user.uid, { 
          name: formData.name || user.displayName || '', 
          phone: formData.phone || '', 
          email: user.email || '' 
        })

        clearCart()
        toast.success('Order placed! Please pay at delivery. 🎉')
        navigate('/orders')
      } catch (err) {
        toast.error('Failed to place order. Please try again.')
      } finally {
        setPaying(false)
      }
      return
    }

    initiatePayment({
      amount: grandTotal,
      name: formData.name || user.displayName || 'Customer',
      email: user.email,
      contact: formData.phone || '',
      settings,
      onSuccess: async (response) => {
        setPaying(true)
        try {
          const orderPayload = {
            ...orderPayloadBase,
            paymentId: response.razorpay_payment_id || 'manual',
          }

          console.log('Placing Online Order:', orderPayload)
          await createOrder(orderPayload)

          // Update/Sync profile
          await updateUserProfile(user.uid, { 
            name: formData.name || user.displayName || '', 
            phone: formData.phone || '', 
            email: user.email || '' 
          })

          clearCart()
          toast.success('Order placed successfully! 🎉')
          navigate('/orders')
        } catch (err) {
          console.error('Order Finalization Error:', err)
          toast.error(`CRITICAL: Order failed to save! Please text/call us with this Payment ID: ${response.razorpay_payment_id}`, { duration: 20000 })
        } finally {
          setPaying(false)
        }
      },
      onFailure: (err) => {
        const msg = err?.description || err?.message || ''
        if (msg.toLowerCase().includes('cancelled')) return
        toast.error('Payment failed: ' + msg)
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
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm flex flex-col h-full min-h-[300px] sm:min-h-[500px] overflow-hidden">
          <div className="p-4 border-b border-orange-50 bg-orange-50/10 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <MapPin size={16} className="text-orange-500" />
              Pin Delivery Location
            </h2>
            {distance !== null && (
              <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                distance <= MAX_DELIVERY_KM ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {roadDistance ? `${roadDistance.toFixed(1)} km (Road)` : `${distance.toFixed(1)} km`}
              </div>
            )}
          </div>
          
          <div className="flex-1 relative">
            <MapView 
              userLocation={userLocation} 
              onLocationSelect={handleMapSelect} 
              onDistanceChange={setRoadDistance}
              interactive 
            />
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
                Outside {MAX_DELIVERY_KM}km Zone
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
                          <span className="text-gray-900">{settings.currency}{(i.price * i.qty).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-orange-100 mt-3 pt-3 space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-gray-400">
                        <span>Items Subtotal</span>
                        <span>{settings.currency}{subtotal.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-medium text-gray-400">
                        <span className="flex items-center gap-1.5">
                          Delivery Fee
                          {distance !== null && <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 rounded-full">{distance.toFixed(1)} km</span>}
                        </span>
                        <span>{deliveryFee > 0 ? `${settings.currency}${deliveryFee}` : 'FREE'}</span>
                      </div>
                    </div>

                    <div className="border-t border-orange-200 mt-3 pt-3 flex justify-between font-black text-sm text-gray-900">
                      <span className="uppercase tracking-widest text-[10px]">Grand Total</span>
                      <span className="text-orange-600">{settings.currency}{grandTotal.toFixed(0)}</span>
                    </div>
                  </>
                )}
              </div>

                {settings.isOnline ? (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button
                      type="submit"
                      disabled={paying || items.length === 0}
                      onClick={() => setPaymentMethod('online')}
                      className="flex flex-col items-center justify-center gap-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-200/50"
                    >
                      <div className="flex items-center gap-2">
                        {paying && paymentMethod === 'online' && <Loader2 size={14} className="animate-spin" />}
                        <span className="text-xs uppercase tracking-wider">Pay Online</span>
                      </div>
                      <span className="text-[10px] opacity-80 font-medium">{settings.currency}{grandTotal.toFixed(0)}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={paying || items.length === 0}
                      onClick={() => setPaymentMethod('cod')}
                      className="flex flex-col items-center justify-center gap-1 bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 disabled:border-gray-200 disabled:text-gray-400 py-3 rounded-xl font-bold transition-all"
                    >
                      <div className="flex items-center gap-2">
                        {paying && paymentMethod === 'cod' && <Loader2 size={14} className="animate-spin" />}
                        <span className="text-xs uppercase tracking-wider">COD</span>
                      </div>
                      <span className="text-[10px] opacity-80 font-medium">Pay {settings.currency}{grandTotal.toFixed(0)} at Delivery</span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 bg-red-50 border border-red-100 rounded-2xl p-6 text-center shadow-inner">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AlertTriangle className="text-red-600" size={24} />
                    </div>
                    <h3 className="text-sm font-black text-red-900 uppercase tracking-widest mb-2">Bakery Currently Offline</h3>
                    <p className="text-xs text-red-700 font-medium leading-relaxed bg-white/50 p-3 rounded-xl border border-red-50/50">
                      {settings.offlineNotice || "We're currently not taking orders. Please check back later!"}
                    </p>
                    <p className="mt-4 text-[10px] text-red-400 font-bold uppercase tracking-widest italic">
                      Items in your cart will be saved ✓
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
  )
}
