import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthChange } from '../services/firebase'

// Admin emails
const ADMIN_EMAILS = ['rishav@navgurukul.org', 'admin@sweetbites.com']
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (USE_MOCK) {
      setUser({
        uid: 'mock-admin-uid',
        email: 'admin@sweetbites.com',
        displayName: 'Admin',
      })
      setLoading(false)
      return
    }

    const unsub = onAuthChange((u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const isAdmin = user && ADMIN_EMAILS.includes(user.email)

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
