import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getUserProfile, updateUserProfile } from '../services/firebase'
import { User, Phone, Mail, Loader2, Save, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({ name: '', phone: '' })
  useEffect(() => {
    if (!user) return
    loadProfile()
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
      await updateUserProfile(user.uid, { ...profile, email: user.email })
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
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
          Account & Security
        </h1>
        <button 
          onClick={() => navigate('/orders')}
          className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-600 transition-all flex items-center gap-2"
        >
          <ShoppingBag size={14} /> My Orders
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-orange-100 p-8 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-100 bg-gray-50/50 rounded-xl focus:outline-none focus:border-orange-400 text-gray-900 font-medium"
                placeholder="Enter your name"
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
                className="w-full pl-10 pr-4 py-3 border border-gray-100 bg-gray-100/50 rounded-xl text-gray-400 cursor-not-allowed italic"
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
                className="w-full pl-10 pr-4 py-3 border border-gray-100 bg-gray-50/50 rounded-xl focus:outline-none focus:border-orange-400 text-gray-900 font-medium"
                placeholder="10-digit mobile number"
                pattern="[0-9]{10}"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {saving ? 'Saving Changes...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
      
      <p className="text-center mt-6 text-xs text-gray-400">
        Account ID: <span className="font-mono">{user.uid}</span>
      </p>
    </div>
  )
}
