import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ItemDetail from './pages/ItemDetail'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import NotFound from './pages/NotFound'
import ErrorBoundary from './components/ErrorBoundary'
import GlobalInitializer from './components/GlobalInitializer'
import { Loader2 } from 'lucide-react'

// Lazy loaded heavy routes for performance
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const OrderHistory = lazy(() => import('./pages/OrderHistory'))
const Location = lazy(() => import('./pages/Location'))

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="animate-spin text-orange-500" size={40} />
  </div>
)

export default function App() {
  return (
    <ErrorBoundary>
      <GlobalInitializer>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/item/:id" element={<ItemDetail />} />
              <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
              <Route path="/location" element={<Location />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </GlobalInitializer>
    </ErrorBoundary>
  )
}
