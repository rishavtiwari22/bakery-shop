import { useState, useEffect } from 'react'
import { Loader2, Package, Clock, CheckCircle2, ChefHat, MessageSquare, Timer, PhoneCall, Truck, X } from 'lucide-react'
import { subscribeToUserOrders, cancelOrder } from '../services/firebase'
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
  cancelled: { label: 'Cancelled', icon: X, color: 'bg-red-100 text-red-700', step: 0 },
}

export default function OrderHistory() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const currency = useSettingsStore((s) => s.settings.currency)

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    try {
      await cancelOrder(orderId)
      toast.success('Order cancelled successfully')
    } catch (err) {
      toast.error('Failed to cancel order')
    }
  }

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
        <div className="text-center py-20 bg-white rounded-3xl border border-orange-100 shadow-sm">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h2>
          <p className="text-gray-400 text-sm">Start ordering some delicious bakery items!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map((order) => {
            const s = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
            return (
              <div 
                key={order.id} 
                className="bg-white rounded-3xl border border-orange-100 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col h-full"
              >
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.color}`}>
                      {s.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                       Order <span className="font-mono text-orange-600">#{order.id.slice(-8).toUpperCase()}</span>
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      {order.timestamp?.toDate ? order.timestamp.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                     {order.items?.slice(0, 2).map((item, idx) => (
                       <div key={idx} className="flex justify-between text-xs text-gray-500 font-medium">
                         <span>{item.name} × {item.qty}</span>
                         <span className="text-gray-900 font-bold">{currency}{item.price * item.qty}</span>
                       </div>
                     ))}
                     {order.items?.length > 2 && (
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                         + {order.items.length - 2} more items
                       </p>
                     )}
                  </div>
                </div>

                <div className="px-6 py-4 bg-orange-50/30 border-t border-orange-50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Total Amount</p>
                    <p className="text-xl font-black text-gray-900">{currency}{order.total?.toFixed(0)}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-100 active:scale-95"
                  >
                    View Details
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* User Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Order Tracking</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">#{selectedOrder.id.slice(-8).toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              
              {/* Status Header */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Status</p>
                   <p className="text-xl font-black text-gray-900 leading-tight">
                     {STATUS_CONFIG[selectedOrder.status]?.label || 'In Progress'}
                   </p>
                </div>
              </div>

              {/* Progress Bar */}
              {selectedOrder.status !== 'cancelled' ? (
                <div className="flex items-center gap-1.5 px-1">
                  {[1, 2, 3, 4].map(step => (
                    <div 
                      key={step} 
                      className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${ (STATUS_CONFIG[selectedOrder.status]?.step || 1) >= step ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'bg-gray-100' }`} 
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-widest">This order was cancelled</p>
                </div>
              )}

              {/* Arrival Estimation */}
              {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-orange-700">
                    <Timer size={20} className="animate-spin-slow text-orange-500" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Estimated Batch Arrival</p>
                      {selectedOrder.estimatedDeliveryTime ? (
                        <div className="mt-1">
                           <CountdownTimer targetTime={selectedOrder.estimatedDeliveryTime} />
                        </div>
                      ) : (
                        <p className="text-xs font-bold mt-1 italic">Waiting for kitchen update...</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Delivered At */}
              {selectedOrder.status === 'delivered' && selectedOrder.deliveredAt && (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center gap-4">
                   <div className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center font-bold">✓</div>
                   <div>
                     <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Delivered Successfully</p>
                     <p className="text-sm font-bold text-gray-800">
                       At {selectedOrder.deliveredAt.toDate ? selectedOrder.deliveredAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                     </p>
                   </div>
                </div>
              )}

              {/* Items Summary */}
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Order Summary</h3>
                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50 space-y-2">
                  {selectedOrder.items?.map((i, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{i.name} × {i.qty}</span>
                      <span className="font-black text-gray-900">{currency}{(i.price * i.qty).toFixed(0)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {selectedOrder.paid || selectedOrder.paymentMethod === 'online' ? 'Total Paid' : 
                       selectedOrder.status === 'cancelled' ? 'CANCELLED' : 'Amount Due'}
                    </span>
                    <span className={`text-xl font-black ${
                      selectedOrder.paid || selectedOrder.paymentMethod === 'online' ? 'text-orange-600' : 
                      selectedOrder.status === 'cancelled' ? 'text-gray-400' : 'text-red-500'
                    }`}>
                      {currency}{selectedOrder.total?.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Help & Actions */}
              <div className="flex flex-col gap-3 pt-4 pb-12">
                <a 
                  href={`tel:${bakeryData.phone.replace(/\s+/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-100"
                >
                  <PhoneCall size={16} /> Call Bakery For Help
                </a>
                
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    className="w-full border-2 border-red-50 text-red-500 hover:bg-red-50 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
