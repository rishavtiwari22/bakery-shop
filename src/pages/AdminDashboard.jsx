import { useState, useEffect } from 'react'
import { Package, Plus, Loader2, ChefHat, TrendingUp, ShoppingBag, Clock, CheckCircle2 } from 'lucide-react'
import { 
  fetchAllOrders, 
  fetchItems, 
  updateOrderStatus, 
  subscribeToOrders,
  simulateNewOrder 
} from '../services/firebase'
import AdminItemForm from '../components/AdminItemForm'
import AdminItemList from '../components/AdminItemList'
import toast from 'react-hot-toast'
import STS from 'sts-bolo'

const tts = new STS()

const STATUS_OPTIONS = ['pending', 'preparing', 'delivered']
const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700',
  preparing: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('orders') // 'orders' | 'items'
  const [orders, setOrders] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  useEffect(() => {
    loadData()

    // Real-time listener for orders & voice notifications
    const unsub = subscribeToOrders((newOrders) => {
      setOrders((prevOrders) => {
        // If it's the first load, don't speak, just set orders
        if (!initialized) {
          return newOrders
        }

        // Check for new orders (IDs not in prevOrders)
        const prevIds = new Set(prevOrders.map(o => o.id))
        newOrders.forEach(order => {
          if (!prevIds.has(order.id) && order.status === 'pending') {
            const name = order.customerName || 'a customer'
            const notes = order.notes ? `. Special Instructions: ${order.notes}` : ''
            console.log('Order from:', name, 'Voice:', voiceEnabled)
            if (voiceEnabled) {
              tts.speak(`New order received from ${name}${notes}`, 'hi')
            }
            toast.success(`New order from ${name}!`, { icon: '🔔' })
          }
        })

        return newOrders
      })
      setInitialized(true)
    })

    return () => unsub()
  }, [initialized, voiceEnabled])

  const loadData = async () => {
    setLoading(true)
    try {
      const i = await fetchItems()
      setItems(i)
    } catch (err) {
      toast.error('Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status)
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o))
      toast.success(`Order marked as ${status}`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    revenue: orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0),
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
          Admin Dashboard
        </h1>
        <div className="flex items-center gap-3">
          {import.meta.env.VITE_USE_MOCK_DATA === 'true' && (
            <button
              onClick={() => simulateNewOrder('Test User')}
              className="bg-purple-100 text-purple-700 border border-purple-200 text-xs px-3 py-1.5 rounded-full font-semibold hover:bg-purple-200 transition-colors"
            >
              🧪 Simulate Order
            </button>
          )}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${voiceEnabled ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}
          >
            {voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
          </button>
          <span className="bg-orange-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold">Admin</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats.total} color="orange" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="yellow" />
        <StatCard icon={ChefHat} label="Preparing" value={stats.preparing} color="blue" />
        <StatCard icon={TrendingUp} label="Revenue" value={`₹${stats.revenue.toFixed(0)}`} color="green" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('orders')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'orders' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'}`}
        >
          📦 Orders ({orders.length})
        </button>
        <button
          onClick={() => setTab('items')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'items' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'}`}
        >
          🍰 Items ({items.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-orange-500" size={40} />
        </div>
      ) : tab === 'orders' ? (
        /* Orders tab */
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">📦</div>
              <p>No orders yet!</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-gray-500">{order.customerName || order.customerEmail}</p>
                    <p className="text-xs text-gray-400">{order.customerPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">₹{order.total?.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">
                      {order.timestamp?.toDate
                        ? order.timestamp.toDate().toLocaleDateString('en-IN')
                        : 'Recent'}
                    </p>
                  </div>
                </div>

                {/* Items list */}
                <div className="text-sm text-gray-600 mb-2 space-y-0.5">
                  {order.items?.map((i, idx) => (
                    <span key={idx} className="inline-block bg-orange-50 border border-orange-100 rounded-lg px-2 py-0.5 text-xs mr-1">
                      {i.name} ×{i.qty}
                    </span>
                  ))}
                </div>

                {/* Order Notes */}
                {order.notes && (
                  <div className="bg-amber-50 text-amber-800 border border-amber-100 rounded-xl p-3 text-xs mb-3 flex gap-2">
                    <span className="font-bold flex-shrink-0">Note:</span>
                    <p>{order.notes}</p>
                  </div>
                )}

                {/* Address */}
                {order.address?.full && (
                  <p className="text-xs text-gray-400 mb-3 truncate">📍 {order.address.full}</p>
                )}

                {/* Status control */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[order.status] || STATUS_COLOR.pending}`}>
                    {order.status}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="ml-auto text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-orange-400"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Items tab */
        <div>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors mb-5 shadow-lg shadow-orange-200"
          >
            <Plus size={16} /> {showAdd ? 'Cancel' : 'Add New Item'}
          </button>
          {showAdd && (
            <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Add Item</h2>
              <AdminItemForm onSuccess={() => { setShowAdd(false); loadData() }} />
            </div>
          )}
          <AdminItemList items={items} onRefresh={loadData} />
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
  }
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <Icon size={20} className="mb-2 opacity-80" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-70 mt-0.5">{label}</p>
    </div>
  )
}
