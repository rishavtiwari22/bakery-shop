import { useState, useEffect } from 'react'
import { Package, Plus, Loader2, ChefHat, TrendingUp, ShoppingBag, Clock, CheckCircle2, User, Mail, Phone, Trash2, Filter, ChevronDown, AlertTriangle } from 'lucide-react'
import { 
  fetchAllOrders, 
  fetchItems, 
  updateOrderStatus, 
  subscribeToOrders,
  simulateNewOrder,
  fetchAllUsers,
  seedDatabase,
  updateOrderTimer,
  deleteOrder,
  updateUserRole
} from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import CountdownTimer from '../components/CountdownTimer'
import OrderMiniMap from '../components/OrderMiniMap'
import AdminItemForm from '../components/AdminItemForm'
import AdminItemList from '../components/AdminItemList'
import toast from 'react-hot-toast'
import STS from 'sts-bolo'
import { useProductStore } from '../store/useProductStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { Settings, Save, Globe, Map } from 'lucide-react'

const tts = new STS()

const STATUS_OPTIONS = ['pending', 'preparing', 'on_the_way', 'delivered']
const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700',
  preparing: 'bg-blue-100 text-blue-700',
  on_the_way: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('orders') // 'orders' | 'items' | 'users' | 'settings'
  const [orders, setOrders] = useState([])
  const [items, setItems] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | STATUS_OPTIONS
  const [seeding, setSeeding] = useState(false)
  const [notifiedLowTime, setNotifiedLowTime] = useState(new Set())
  const { user, isSuperAdmin } = useAuth()
  
  const settings = useSettingsStore(s => s.settings)
  const updateSettings = useSettingsStore(s => s.update)
  const [savingSettings, setSavingSettings] = useState(false)
  const [localSettings, setLocalSettings] = useState(null)

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings)
    }
  }, [settings])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
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
              try {
                tts.speak(`New order received from ${name}${notes}`, 'hi')
              } catch (e) {
                console.warn('TTS Voice error:', e.message)
              }
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
      // Items (Products)
      try {
        await useProductStore.getState().refresh()
        const i = useProductStore.getState().products
        setItems(i)
      } catch (err) {
        console.error('Admin Store Refresh Error:', err)
        toast.error('Failed to load menu items')
      }
      
      // Users
      try {
        const u = await fetchAllUsers()
        setUsers(u)
      } catch (err) {
        console.error('Admin Fetch Users Error:', err)
        toast.error('Failed to load users list')
      }

      // Orders are handled by the real-time listener (subscribeToOrders)
      // No initial fetch needed here to avoid race conditions.
    } catch (err) {
      console.error('Global Admin Load Error:', err)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status)
      // Optimistic update removed - relying on real-time listener for zero-lag sync
      toast.success(`Order marked as ${status}`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleAddTime = async (orderId, mins) => {
    try {
      await updateOrderTimer(orderId, mins)
      toast.success(`Added ${mins} mins to delivery buffer`)
    } catch (err) {
      toast.error('Failed to update timer')
    }
  }

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Permanent delete this order? This cannot be undone.')) return
    try {
      await deleteOrder(orderId)
      toast.success('Order deleted permanently')
    } catch (err) {
      toast.error('Failed to delete order')
    }
  }

  const handleRoleUpdate = async (uid, newRole) => {
    if (!isSuperAdmin) {
      toast.error('Only super-admin can change roles')
      return
    }
    try {
      await updateUserRole(uid, newRole)
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u))
      toast.success(`Role updated to ${newRole}`)
    } catch (err) {
      toast.error('Failed to update role')
    }
  }

  const handleToggleOnline = async () => {
    const newStatus = !localSettings.isOnline
    setLocalSettings(prev => ({ ...prev, isOnline: newStatus }))
    try {
      await updateSettings({ isOnline: newStatus })
      toast.success(`Bakery is now ${newStatus ? 'Online' : 'Offline'}!`)
    } catch (err) {
      toast.error('Failed to update status')
      // Rollback UI on failure
      setLocalSettings(prev => ({ ...prev, isOnline: !newStatus }))
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      await updateSettings(localSettings)
      toast.success('Settings updated successfully! ⚙️')
    } catch (err) {
      toast.error('Failed to update settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSeed = async () => {
    if (!confirm('This will populate your real Firebase with initial menu items, orders, and users. Proceed?')) return
    setSeeding(true)
    try {
      await seedDatabase()
      toast.success('Database seeded successfully! Reloading...')
      setTimeout(() => loadData(), 1500)
    } catch (err) {
      toast.error('Seed failed: ' + err.message)
    } finally {
      setSeeding(false)
    }
  }

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    revenue: orders.filter((o) => o.paid === true).reduce((s, o) => s + (o.total || 0), 0),
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
          Admin Dashboard
        </h1>
        <div className="flex items-center gap-3">
          {items.length === 0 && !loading && import.meta.env.VITE_USE_MOCK_DATA === 'false' && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="bg-orange-100 text-orange-700 border border-orange-200 text-xs px-3 py-1.5 rounded-full font-bold hover:bg-orange-200 transition-colors flex items-center gap-2"
            >
              {seeding ? <Loader2 className="animate-spin" size={12} /> : '🛠️ Set Up Database'}
            </button>
          )}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats.total} color="orange" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="yellow" />
        <StatCard icon={TrendingUp} label="Revenue" value={`₹${stats.revenue.toFixed(0)}`} color="green" />
        <StatCard icon={User} label="Users" value={users.length} color="blue" />
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100/50 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setTab('orders')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${tab === 'orders' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-transparent text-gray-500 hover:text-orange-600'}`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setTab('items')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${tab === 'items' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-transparent text-gray-500 hover:text-orange-600'}`}
          >
            Items ({items.length})
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setTab('users')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${tab === 'users' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-transparent text-gray-500 hover:text-orange-600'}`}
            >
              Users ({users.length})
            </button>
          )}
          <button
            onClick={() => setTab('settings')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${tab === 'settings' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-transparent text-gray-500 hover:text-orange-600'}`}
          >
            Settings
          </button>
        </div>

        {tab === 'orders' && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:inline">Filter:</span>
            <div className="relative group/filter">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-orange-500 group-hover/filter:text-orange-600 transition-colors">
                <Filter size={14} />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-10 py-2.5 rounded-xl text-xs font-bold transition-all border border-gray-100 bg-white text-gray-700 hover:border-orange-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-100 appearance-none cursor-pointer min-w-[160px]"
              >
                <option value="all">All Orders</option>
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-gray-400 group-hover/filter:text-orange-400 transition-colors">
                <ChevronDown size={14} />
              </div>
            </div>
            
            <div className="bg-orange-50 text-orange-600 px-3 py-2 rounded-xl border border-orange-100 text-[10px] font-black uppercase tracking-tighter">
              {orders.filter(o => statusFilter === 'all' || o.status === statusFilter).length} {statusFilter}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-orange-500" size={40} />
        </div>
      ) : tab === 'orders' ? (
        /* Orders tab */
        <div className="space-y-6">

          {[...orders].filter(o => statusFilter === 'all' || o.status === statusFilter).length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">📦</div>
              <p>No orders yet!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {[...orders]
                .filter(o => statusFilter === 'all' || o.status === statusFilter)
                .sort((a, b) => {
                  if (a.status === 'pending' && b.status !== 'pending') return -1
                  if (a.status !== 'pending' && b.status === 'pending') return 1
                  return 0
                })
                .map((order) => (
                  <div key={`${order.id}-${order.status}`} className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm group">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              order.paymentMethod === 'cod' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {order.paymentMethod === 'cod' ? 'COD' : 'ONLINE'}
                            </span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id) }}
                              className="p-1 px-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Permanently"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-orange-600 flex items-center justify-end gap-2">
                              ₹{order.total?.toFixed(0)}
                              <span className={`text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-widest ${
                                order.paid ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-red-100 text-red-600 border border-red-200'
                              }`}>
                                {order.paid ? 'PAID ✓' : 'UNPAID'}
                              </span>
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {order.timestamp?.toDate ? order.timestamp.toDate().toLocaleDateString('en-IN') : 'Recent'}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">{order.customerName || order.customerEmail}</p>
                        <p className="text-xs text-gray-400 mb-3">{order.customerPhone}</p>

                        {/* Items list */}
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex justify-between items-center">
                          <span>Items</span>
                          <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md font-black">
                            {order.items?.reduce((sum, i) => sum + i.qty, 0) || 0} TOTAL
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-3 flex flex-wrap gap-1">
                          {order.items?.map((i, idx) => (
                            <span key={idx} className="bg-orange-50 text-orange-600 border border-orange-100 rounded-lg px-2 py-0.5 text-[10px] font-bold">
                              {i.name} ×{i.qty}
                            </span>
                          ))}
                        </div>

                        {/* Address */}
                        {order.address?.full && (
                          <p className="text-[10px] text-gray-400 mb-3 truncate">📍 {order.address.full}</p>
                        )}

                        {/* Order Notes */}
                        {order.notes && (
                          <div className="bg-amber-50 text-amber-800 border border-amber-100 rounded-xl p-3 text-[10px] flex gap-2">
                            <span className="font-bold flex-shrink-0 leading-tight">Note:</span>
                            <p className="leading-tight">{order.notes}</p>
                          </div>
                        )}

                        {/* Timer Display */}
                        {order.status !== 'delivered' && order.estimatedDeliveryTime && (
                          <div className="flex items-center gap-3 bg-red-50 text-red-700 px-4 py-2 rounded-xl border border-red-100 mb-3 mt-3">
                            <Clock size={14} className="animate-pulse" />
                            <div className="flex-1">
                              <p className="text-[8px] font-bold uppercase opacity-60">Est. Arrival</p>
                              <CountdownTimer 
                                targetTime={order.estimatedDeliveryTime} 
                                onTick={(secs) => {
                                  if (secs > 0 && secs <= 15 && !notifiedLowTime.has(order.id)) {
                                    setNotifiedLowTime(prev => new Set(prev).add(order.id))
                                    if (voiceEnabled) {
                                      tts.speak(`Order ${order.id.slice(-4)} is running late! Please check.`)
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {order.status === 'delivered' && order.deliveredAt && (
                          <div className="flex items-center gap-3 bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-100 mb-3 mt-3">
                            <CheckCircle2 size={14} />
                            <div className="flex-1">
                              <p className="text-[8px] font-bold uppercase opacity-60">Delivered At</p>
                              <p className="text-[10px] font-bold">
                                {order.deliveredAt.toDate ? order.deliveredAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="w-full md:w-36 flex-shrink-0">
                        <OrderMiniMap order={order} />
                      </div>
                    </div>

                    {/* Status control */}
                    <div className="flex items-center gap-2 flex-wrap mb-3 border-t border-gray-50 pt-4 mt-1">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${STATUS_COLOR[order.status] || STATUS_COLOR.pending}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="ml-auto text-xs border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-400 bg-gray-50"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>

                    {/* Timer controls */}
                    {order.status !== 'delivered' && (!order.estimatedDeliveryTime || (order.estimatedDeliveryTime.toMillis ? order.estimatedDeliveryTime.toMillis() : new Date(order.estimatedDeliveryTime).getTime()) < Date.now()) && (
                      <div className="flex items-center gap-2 bg-gray-50/50 p-2 rounded-xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
                          Add Time:
                        </p>
                        <div className="flex gap-1 ml-auto">
                          {[10, 15, 20].map(m => (
                            <button
                              key={m}
                              onClick={() => handleAddTime(order.id, m)}
                              className="bg-white text-orange-600 text-[10px] font-bold px-3 py-2 rounded-lg border border-orange-100 hover:bg-orange-500 hover:text-white transition-all shadow-sm shadow-orange-50"
                            >
                              +{m}m
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
              ))}
            </div>
          )}
        </div>
      ) : tab === 'items' ? (
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
      ) : tab === 'users' ? (
        /* Users tab */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-white border border-orange-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 pl-10"
              />
              <User size={16} className="absolute left-3.5 top-3 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Showing {users.filter(u => 
                u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
                u.email?.toLowerCase().includes(userSearch.toLowerCase())
              ).length} users
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-orange-100 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-orange-50 text-orange-800 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50">
                {users
                  .filter(user => 
                    user.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
                    user.email?.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((user) => (
                    <tr key={user.uid} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold text-lg">
                            {user.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{user.name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-400">ID: {user.uid.slice(-8).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-600 flex items-center gap-1.5 text-xs"><Mail size={12} /> {user.email || 'No email'}</p>
                        <p className="text-gray-400 text-[10px] flex items-center gap-1.5 mt-1"><Phone size={12} /> {user.phone || 'No phone'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-600 flex items-center gap-1.5 font-bold">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${user.role === 'admin' ? 'bg-red-100 text-red-600' : user.role === 'sub-admin' ? 'bg-blue-100 text-blue-600' : user.role === 'delivery' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} capitalize`}>
                            {user.role || 'customer'}
                          </span>
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleRoleUpdate(user.uid, user.role === 'sub-admin' ? 'customer' : 'sub-admin')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${user.role === 'sub-admin' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-600 border-orange-100 hover:bg-orange-50'}`}
                          >
                            {user.role === 'sub-admin' ? 'Revoke Sub-Admin' : 'Make Sub-Admin'}
                          </button>
                          <button 
                            onClick={() => handleRoleUpdate(user.uid, user.role === 'delivery' ? 'customer' : 'delivery')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${user.role === 'delivery' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-green-600 border-green-100 hover:bg-green-50'}`}
                          >
                            {user.role === 'delivery' ? 'Stop Delivery' : 'Make Delivery'}
                          </button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>No users found.</p>
            </div>
          )}
        </div>
      ) : (
        /* Settings tab */
        <div className="max-w-5xl">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            {/* BAKERY OPERATION STATUS */}
            <div className="bg-white rounded-3xl border-2 border-orange-200 p-8 shadow-xl shadow-orange-100/20 mb-8 overflow-hidden relative">
              <div className="absolute right-0 top-0 w-32 h-32 bg-orange-50 -mr-16 -mt-16 rounded-full opacity-50" />
              <div className="relative">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${localSettings?.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  Bakery Operation Status
                </h3>
                
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-shrink-0 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={handleToggleOnline}
                      className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
                        localSettings?.isOnline 
                          ? 'bg-green-500 text-white shadow-green-200 hover:bg-green-600' 
                          : 'bg-red-500 text-white shadow-red-200 hover:bg-red-600'
                      }`}
                    >
                      {localSettings?.isOnline ? (
                        <><CheckCircle2 size={18} /> Bakery is Online</>
                      ) : (
                        <><AlertTriangle size={18} /> Bakery is Offline</>
                      )}
                    </button>
                    <p className="mt-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">
                      {localSettings?.isOnline ? 'Users CAN place orders' : 'Users CANNOT place orders'}
                    </p>
                  </div>

                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                      Offline Message (Visible to users at checkout)
                    </label>
                    <textarea
                      value={localSettings?.offlineNotice || ''}
                      onChange={(e) => setLocalSettings({...localSettings, offlineNotice: e.target.value})}
                      placeholder="e.g. Opening soon at 4 PM"
                      className="w-full border border-gray-100 focus:border-orange-400 rounded-2xl px-5 py-4 text-sm bg-gray-50/30 h-[92px] resize-none font-medium leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* OPERATIONAL DETAILS */}
              <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Phone size={14} className="text-orange-500" />
                  Contact & Hours
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Primary Phone</label>
                      <input
                        value={localSettings?.phone || ''}
                        onChange={(e) => setLocalSettings({...localSettings, phone: e.target.value})}
                        className="w-full border border-gray-100 focus:border-orange-400 rounded-xl px-4 py-2.5 text-sm bg-gray-50/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">WhatsApp Number</label>
                      <input
                        value={localSettings?.whatsapp || ''}
                        onChange={(e) => setLocalSettings({...localSettings, whatsapp: e.target.value})}
                        className="w-full border border-gray-100 focus:border-orange-400 rounded-xl px-4 py-2.5 text-sm bg-gray-50/30"
                        placeholder="919876543210"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
                    <input
                      value={localSettings?.email || ''}
                      onChange={(e) => setLocalSettings({...localSettings, email: e.target.value})}
                      className="w-full border border-gray-100 focus:border-orange-400 rounded-xl px-4 py-2.5 text-sm bg-gray-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Today's Operating Hours</label>
                    <input
                      value={localSettings?.hours || ''}
                      onChange={(e) => setLocalSettings({...localSettings, hours: e.target.value})}
                      className="w-full border border-gray-100 focus:border-orange-400 rounded-xl px-4 py-2.5 text-sm bg-gray-50/30"
                      placeholder="e.g. Open · Closes 9:30 pm"
                    />
                  </div>
                </div>
              </div>

              {/* STORE DESCRIPTION */}
              <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Filter size={14} className="text-orange-500" />
                  Store Announcement
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Short Message (Hero Section)</label>
                    <textarea
                      value={localSettings?.description || ''}
                      onChange={(e) => setLocalSettings({...localSettings, description: e.target.value})}
                      className="w-full border border-gray-100 focus:border-orange-400 rounded-xl px-4 py-2.5 text-sm bg-gray-50/30 h-[104px] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* DELIVERY & LOCATION */}
              <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm col-span-full">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Map size={14} className="text-orange-500" />
                  Delivery & Location
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Base Fee ({localSettings?.currency || '₹'})</label>
                      <input
                        type="number"
                        value={localSettings?.deliveryRules?.baseFee || 0}
                        onChange={(e) => setLocalSettings({
                          ...localSettings, 
                          deliveryRules: { ...localSettings.deliveryRules, baseFee: Number(e.target.value) }
                        })}
                        className="w-full border border-gray-100 focus:border-orange-400 rounded-xl px-4 py-2.5 text-sm bg-gray-50/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Fee per KM ({localSettings?.currency || '₹'})</label>
                      <input
                        type="number"
                        value={localSettings?.deliveryRules?.feePerKm || 0}
                        onChange={(e) => setLocalSettings({
                          ...localSettings, 
                          deliveryRules: { ...localSettings.deliveryRules, feePerKm: Number(e.target.value) }
                        })}
                        className="w-full border border-gray-100 focus:border-orange-400 rounded-xl px-4 py-2.5 text-sm bg-gray-50/30"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Free Above ({localSettings?.currency || '₹'})</label>
                      <input
                        type="number"
                        value={localSettings?.deliveryRules?.freeAbove || 0}
                        onChange={(e) => setLocalSettings({
                          ...localSettings, 
                          deliveryRules: { ...localSettings.deliveryRules, freeAbove: Number(e.target.value) }
                        })}
                        className="w-full border border-gray-100 focus:border-orange-400 rounded-xl px-4 py-2.5 text-sm bg-gray-50/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Max KM</label>
                      <input
                        type="number"
                        value={localSettings?.deliveryRules?.maxKm || 0}
                        onChange={(e) => setLocalSettings({
                          ...localSettings, 
                          deliveryRules: { ...localSettings.deliveryRules, maxKm: Number(e.target.value) }
                        })}
                        className="w-full border border-gray-100 focus:border-orange-400 rounded-xl px-4 py-2.5 text-sm bg-gray-50/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Full Shop Address</label>
                    <textarea
                      value={localSettings?.location?.full || ''}
                      onChange={(e) => setLocalSettings({
                        ...localSettings, 
                        location: { ...localSettings.location, full: e.target.value }
                      })}
                      className="w-full border border-gray-100 focus:border-orange-400 rounded-xl px-4 py-2.5 text-sm bg-gray-50/30 h-20 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={savingSettings}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-orange-100 disabled:opacity-50 active:scale-95"
              >
                {savingSettings ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Apply All Changes
              </button>
            </div>
          </form>
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
    <div className={`rounded-2xl border p-3 sm:p-4 ${colors[color]}`}>
      <Icon size={20} className="mb-2 opacity-80" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-70 mt-0.5">{label}</p>
    </div>
  )
}
