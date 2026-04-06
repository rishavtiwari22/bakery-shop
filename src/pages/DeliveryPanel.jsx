import { useState, useEffect } from 'react'
import { Loader2, Package, Truck } from 'lucide-react'
import { 
  subscribeToOrders, 
  updateOrderStatus
} from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { useSettingsStore } from '../store/useSettingsStore'
import toast from 'react-hot-toast'

export default function DeliveryPanel() {
  const { user } = useAuth()
  const currency = useSettingsStore(s => s.settings.currency || '₹')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const unsub = subscribeToOrders((allOrders) => {
      const myOrders = allOrders.filter(o => 
        o.deliveryBoyId === user.uid && 
        o.status !== 'delivered' && 
        o.status !== 'cancelled'
      )
      setOrders(myOrders)
      setLoading(false)
    })

    return () => unsub()
  }, [user])

  const handleStatusUpdate = async (orderId, status) => {
    try {
      if (status === 'delivered') {
        const order = orders.find(o => o.id === orderId)
        if (order?.paymentMethod === 'cod') {
          const confirmed = window.confirm(`Have you collected ${currency}${order.total} cash from ${order.customerName}?`)
          if (!confirmed) return
        }
      }
      await updateOrderStatus(orderId, status)
      toast.success(`Order marked as ${status}`)
    } catch (err) {
      toast.error('Status update failed')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-orange-500" size={40} />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
            {user?.role === 'admin' ? 'Admin Delivery Hub' : 'Delivery Partner'}
          </h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
            Hello, {user?.displayName || user?.email?.split('@')[0]}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-xs font-bold shadow-sm shadow-green-50">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Active
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-orange-100 p-12 text-center shadow-sm">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No active deliveries</h2>
          <p className="text-gray-400 text-sm">You haven't been assigned any orders yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-3xl border border-orange-100 overflow-hidden shadow-lg hover:shadow-xl transition-all">
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div>
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 inline-block">
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">Order #{order.id.slice(-8).toUpperCase()}</h3>
                    <p className="text-sm text-gray-500 mt-1">📍 {order.address?.full}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Customer</p>
                    <p className="font-bold text-gray-800">{order.customerName}</p>
                    <p className="text-xs text-orange-500 font-bold">{order.customerPhone}</p>
                    
                    <div className={`mt-3 border rounded-xl px-3 py-2 ${order.paymentMethod === 'cod' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                      <p className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1 ${order.paymentMethod === 'cod' ? 'text-red-400' : 'text-green-500'}`}>
                        {order.paymentMethod === 'cod' ? 'Cash to Collect' : 'Paid Online'}
                      </p>
                      <p className={`text-lg font-black leading-none ${order.paymentMethod === 'cod' ? 'text-red-600' : 'text-green-600'}`}>
                        {currency}{order.total}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'on_the_way')}
                      className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-base font-black bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all font-bold"
                    >
                      <Truck size={22} /> Start Moving
                    </button>
                  )}

                  {order.status === 'on_the_way' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'delivered')}
                      className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-base font-black text-white transition-all animate-pulse ${
                        order.paymentMethod === 'cod' 
                          ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100' 
                          : 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-100'
                      }`}
                    >
                      {order.paymentMethod === 'cod' ? `Collect ${currency}${order.total} & Deliver` : 'Mark Delivered'}
                    </button>
                  )}

                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'preparing')}
                      className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-base font-black bg-gray-900 text-white hover:bg-black shadow-lg transition-all"
                    >
                      <Package size={22} /> Start Preparing
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
