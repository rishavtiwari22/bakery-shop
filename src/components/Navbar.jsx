import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, MapPin, User, LogOut, ChefHat, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '../store/cartStore'
import { useAuth } from '../context/AuthContext'
import { logout } from '../services/firebase'
import toast from 'react-hot-toast'

export default function Navbar() {
  const toggleCart = useCartStore((s) => s.toggleCart)
  const count = useCartStore((s) => s.getCount())
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out!')
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-orange-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-orange-500 text-white p-1.5 rounded-lg group-hover:bg-orange-600 transition-colors">
              <ChefHat size={20} />
            </div>
            <span className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
              Sweet<span className="text-orange-500">Bites</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-orange-500 transition-colors text-sm font-medium">Catalog</Link>
            <Link to="/location" className="flex items-center gap-1 text-gray-600 hover:text-orange-500 transition-colors text-sm font-medium">
              <MapPin size={14} />Order Online
            </Link>
            {user && (
              <Link to="/orders" className="text-gray-600 hover:text-orange-500 transition-colors text-sm font-medium">My Orders</Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="text-gray-600 hover:text-orange-500 transition-colors text-sm font-medium">Admin</Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <button
              onClick={toggleCart}
              className="relative p-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
            >
              <ShoppingCart size={22} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>

            {/* User */}
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/profile" className="text-sm text-gray-600 hover:text-orange-500 font-medium transition-colors">
                  {user.displayName || user.email?.split('@')[0]}
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <User size={15} /> Login
              </Link>
            )}

            {/* Mobile menu */}
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-orange-100 pt-3">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-gray-700 hover:bg-orange-50 rounded-lg text-sm">Catalog</Link>
            <Link to="/location" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-gray-700 hover:bg-orange-50 rounded-lg text-sm font-medium">Order Online</Link>
            {user && <Link to="/orders" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-gray-700 hover:bg-orange-50 rounded-lg text-sm">My Orders</Link>}
            {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-gray-700 hover:bg-orange-50 rounded-lg text-sm">Admin Panel</Link>}
            {user ? (
              <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm">
                Logout
              </button>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-orange-600 font-medium hover:bg-orange-50 rounded-lg text-sm">Login / Sign Up</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
