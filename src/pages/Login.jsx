import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChefHat, Loader2, Mail, Lock } from 'lucide-react'
import { loginWithEmail, loginWithGoogle } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { useSettingsStore } from '../store/useSettingsStore'
import bakeryData from '../data/bakeryData.json'

export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const settings = useSettingsStore(s => s.settings) || bakeryData

  if (user) { navigate('/'); return null }

  const handleEmail = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await loginWithEmail(email, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.message?.replace('Firebase: ', '') || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    try {
      await loginWithGoogle()
      toast.success('Welcome!')
      navigate('/')
    } catch (err) {
      toast.error(err.message?.replace('Firebase: ', '') || 'Google login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-orange-100 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500 rounded-2xl mb-3 shadow-lg shadow-orange-200">
              <ChefHat className="text-white" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Welcome to {settings.name}
            </h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to place your order</p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-orange-300 bg-white py-3 rounded-xl text-sm font-medium text-gray-700 transition-all mb-5 disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
            <div className="relative flex justify-center text-xs text-gray-400 bg-white px-3">or sign in with email</div>
          </div>

          {/* Email form */}
          <form onSubmit={handleEmail} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email address"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none rounded-xl text-sm"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none rounded-xl text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-orange-200"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Sign In
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Admin? Use <span className="font-mono text-gray-600 text-[10px]">admin@nicebakery.com</span>
          </p>
        </div>
      </div>
    </div>
  )
}
