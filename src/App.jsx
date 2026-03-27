import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import ItemDetail from './pages/ItemDetail'
import OrderHistory from './pages/OrderHistory'
import Location from './pages/Location'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Cart from './components/Cart'
import { useCartStore } from './store/cartStore'

export default function App() {
  const isCartOpen = useCartStore((s) => s.isCartOpen)

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-orange-50">
        <Navbar />
        {isCartOpen && <Cart />}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
            <Route path="/location" element={<Location />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  )
}
