import { useState, useEffect } from 'react'
import { Loader2, Package, Clock, CheckCircle2, ChefHat, MessageSquare, Timer, PhoneCall, Truck } from 'lucide-react'
import { subscribeToUserOrders } from '../services/firebase'
import { getEstimatedDeliveryTime } from '../services/geolocation'
import { useAuth } from '../context/AuthContext'
import CountdownTimer from '../components/CountdownTimer'
import toast from 'react-hot-toast'
import { useSettingsStore } from '../store/useSettingsStore'
import bakeryData from '../data/bakeryData.json'

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-700', step: 1 },
  preparing: { label: 'Preparing', icon: ChefHat, color: 'bg-blue-100 text-blue-700', step: 2 },
  on_the_way: { label: 'On The Way', icon: Truck, color: 'bg-purple-100 text-purple-700', step: 3 },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'bg-green-100 text-green-700', step: 4 },
}

export default function OrderHistory() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const currency = useSettingsStore((s) => s.settings.currency)

  useEffect(() => {
    if (!user) return
    
    // Real-time tracking subscription
    const unsubscribe = subscribeToUserOrders(user.uid, (data) => {
      setOrders(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-orange-500" size={40} />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
        My Orders
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h2>
          <p className="text-gray-400 text-sm">Start ordering some delicious bakery items!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const s = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
            const Icon = s.icon
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm transition-all hover:shadow-md">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Order #{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {order.timestamp?.toDate
                          ? order.timestamp.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Just now'}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${s.color}`}>
                      <Icon size={12} className={order.status === 'preparing' ? 'animate-pulse' : ''} /> {s.label}
                    </span>
                  </div>

                  {order.status === 'delivered' && order.deliveredAt && (
                    <div className="flex flex-col gap-2 mb-4 bg-green-50 p-4 rounded-2xl border border-green-100 shadow-inner">
                      <div className="flex items-center justify-between text-xs font-bold text-green-600 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} />
                          <span>Delivered At</span>
                        </div>
                        <span className="opacity-60">Verified</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800">
                        {order.deliveredAt.toDate ? order.deliveredAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </p>
                    </div>
                  )}

                  {/* Delivery Estimation */}
                  {order.status !== 'delivered' && (
                    <div className="flex flex-col gap-2 mb-4 bg-orange-50 p-4 rounded-2xl border border-orange-100 shadow-inner">
                      <div className="flex items-center justify-between text-xs font-bold text-orange-600 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                          <Timer size={14} className="animate-spin-slow" />
                          <span>Estimated Arrival</span>
                        </div>
                        <span className="opacity-60">Real-time</span>
                      </div>
                      
                      {order.estimatedDeliveryTime ? (
                        <div className="mt-1">
                          <CountdownTimer targetTime={order.estimatedDeliveryTime} />
                        </div>
                      ) : (
                        <p className="text-gray-400 text-[10px] font-medium italic">
                          Waiting for kitchen update...
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tracking Progress Bar */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className={`h-1.5 flex-1 rounded-full ${s.step >= 1 ? 'bg-orange-500' : 'bg-gray-100'}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${s.step >= 2 ? 'bg-orange-500' : 'bg-gray-100'}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${s.step >= 3 ? 'bg-orange-500' : 'bg-gray-100'}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${s.step >= 4 ? 'bg-orange-500' : 'bg-gray-100'}`} />
                  </div>

                  {/* Items */}
                  <div className="space-y-2 mb-4 bg-orange-50/30 rounded-xl p-3">
                    {order.items?.map((i, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-gray-700">
                        <span className="font-medium">{i.name} × {i.qty}</span>
                        <span className="font-bold">{currency}{(i.price * i.qty).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <div className="flex gap-2 bg-amber-50 text-amber-700 p-3 rounded-xl text-xs mb-4 border border-amber-100">
                      <MessageSquare size={14} className="flex-shrink-0" />
                      <p><strong>Notes:</strong> {order.notes}</p>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-4 flex items-end justify-between">
                    <div className="space-y-1">
                      {order.address?.full && (
                        <p className="text-xs text-gray-400 max-w-[200px] truncate">📍 {order.address.full}</p>
                      )}
                      {order.paymentId && (
                        <p className="text-xs text-gray-400">ID: {order.paymentId}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Paid</p>
                      <p className="text-xl font-black text-orange-600">{currency}{order.total?.toFixed(0)}</p>
                    </div>
                  </div>

                  {/* Call Bakery Button */}
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-medium">Need help with this order?</p>
                    <a 
                      href={`tel:${bakeryData.phone.replace(/\s+/g, '')}`}
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-green-100"
                    >
                      <PhoneCall size={14} /> Call Bakery
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
