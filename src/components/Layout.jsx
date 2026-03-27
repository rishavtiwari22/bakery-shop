import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import { useCartStore } from '../store/cartStore'
import Cart from './Cart'

export default function Layout() {
  const isCartOpen = useCartStore((s) => s.isCartOpen)
  const location = useLocation()

  // Defined routes
  const validPaths = ['/', '/location', '/orders', '/login', '/admin', '/profile']
  const isKnownRoute = validPaths.includes(location.pathname) || location.pathname.startsWith('/item/')
  
  return (
    <div className="min-h-screen bg-orange-50">
      <Navbar />
      {isCartOpen && <Cart />}
      <main>
        <Outlet />
      </main>
      {isKnownRoute && <Footer />}
    </div>
  )
}
