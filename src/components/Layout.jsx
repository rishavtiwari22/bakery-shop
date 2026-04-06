import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import { useCartStore } from '../store/cartStore'
import { useSettingsStore } from '../store/useSettingsStore'
import Cart from './Cart'
import OnboardingModal from './OnboardingModal'
import bakeryData from '../data/bakeryData.json'

export default function Layout() {
  const isCartOpen = useCartStore((s) => s.isCartOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const initSettings = useSettingsStore((s) => s.init)
  const settings = useSettingsStore((s) => s.settings)
  const location = useLocation()

  useEffect(() => {
    initSettings()
  }, [])

  // Close cart on every navigation
  useEffect(() => {
    closeCart()
  }, [location.pathname, closeCart])

  // Defined routes
  const validPaths = ['/', '/location', '/orders', '/login', '/admin', '/profile']
  const isKnownRoute = validPaths.includes(location.pathname) || location.pathname.startsWith('/item/')
  
  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      {isCartOpen && <Cart />}
      <OnboardingModal />
      <main>
        <Outlet />
      </main>
      {location.pathname === '/' && <Footer />}

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${settings.whatsapp || bakeryData.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group"
        title="Chat with us on WhatsApp"
      >
        <div className="absolute right-full mr-3 bottom-0 mb-2 whitespace-nowrap bg-white text-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100 pointer-events-none">
          Need help? Chat with us! 🍰
        </div>
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
      </a>
    </div>
  )
}
