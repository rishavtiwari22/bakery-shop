import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getUserProfile, updateUserProfile, subscribeToUserOrders } from '../services/firebase'
import { User, Phone, Mail, Loader2, Save, ArrowLeft, ShoppingBag, PhoneCall } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CountdownTimer from '../components/CountdownTimer'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({ name: '', phone: '' })
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadProfile()

    // Real-time tracking subscription for orders
    const unsubscribe = subscribeToUserOrders(user.uid, (data) => {
      setOrders(data)
      setOrdersLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const p = await getUserProfile(user.uid)
      setProfile({
        name: p?.name || user.displayName || '',
        phone: p?.phone || ''
      })
    } catch (err) {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateUserProfile(user.uid, profile)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-orange-500" size={40} />
    </div>
  )

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors mb-6 text-sm"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-white rounded-3xl border border-orange-100 p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-3xl">
            👤
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
              Your Profile
            </h1>
            <p className="text-gray-500 text-sm">Manage your account details</p>
          </div>
          <button 
            onClick={() => navigate('/orders')}
            className="ml-auto flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-100 transition-colors"
          >
            <ShoppingBag size={14} /> Track Orders
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Display Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 text-gray-900"
                placeholder="Your Name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full pl-10 pr-4 py-3 border border-gray-100 bg-gray-50 rounded-xl text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 text-gray-900"
                placeholder="Enter 10-digit number"
                pattern="[0-9]{10}"
              />
            </div>
            <p className="mt-1.5 text-[10px] text-gray-400">Used for order delivery notifications</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        {/* Order History Section */}
        <div className="mt-12 pt-10 border-t border-orange-50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
              Order History
            </h2>
            <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </div>
          </div>

          {ordersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-orange-500" size={24} />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-orange-50/50 rounded-2xl p-8 text-center border border-dashed border-orange-200">
              <p className="text-gray-400 text-sm">You haven't placed any orders yet.</p>
              <button 
                onClick={() => navigate('/')}
                className="mt-3 text-orange-600 font-bold text-xs hover:underline"
              >
                Browse Our Menu 🍰
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="bg-white border border-orange-50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">#{order.id.slice(-6).toUpperCase()}</span>
                      <p className="text-sm font-bold text-gray-800">
                        {order.items?.map(i => i.name).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-orange-600">₹{order.total?.toFixed(0)}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                          order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'on_the_way' ? 'bg-purple-100 text-purple-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status === 'on_the_way' ? 'On the Way' : order.status}
                        </span>
                      </div>
                    </div>
                    {order.status !== 'delivered' && order.estimatedDeliveryTime && (
                      <div className="mb-2 pl-1 border-l-2 border-orange-200">
                         <p className="text-[8px] font-bold text-gray-400 uppercase mb-0.5">Est. Arrival</p>
                         <CountdownTimer targetTime={order.estimatedDeliveryTime} />
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-gray-400">
                        {order.timestamp?.toDate ? order.timestamp.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                      </p>
                      <a href="tel:9336648747" className="text-green-600 hover:text-green-700 transition-colors">
                        <PhoneCall size={12} />
                      </a>
                    </div>
                  </div>
              ))}
              {orders.length > 5 && (
                <button 
                  onClick={() => navigate('/orders')}
                  className="w-full py-3 text-sm font-bold text-gray-500 hover:text-orange-500 transition-colors border border-dashed border-gray-200 rounded-xl"
                >
                  View All Orders
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
