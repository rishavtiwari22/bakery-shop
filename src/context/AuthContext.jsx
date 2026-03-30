import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthChange, updateUserProfile, getUserProfile } from '../services/firebase'

const ADMIN_EMAILS = ['rishav@navgurukul.org', 'admin@nicebakery.com']
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async (uid) => {
    const p = await getUserProfile(uid || user?.uid)
    if (p) setProfile(p)
    return p
  }

  useEffect(() => {
    if (USE_MOCK) {
      const mockUser = {
        uid: 'mock-admin-uid',
        email: 'admin@nicebakery.com',
        displayName: 'Admin',
      }
      setUser(mockUser)
      setProfile({ uid: 'mock-admin-uid', name: 'Admin', phone: '9876543210', email: 'admin@nicebakery.com' })
      setLoading(false)
      return
    }

    const unsub = onAuthChange(async (u) => {
      if (u) {
        // Sync profile basics to Firestore
        await updateUserProfile(u.uid, {
          email: u.email,
          name: u.displayName || ''
        })
        const p = await getUserProfile(u.uid)
        setProfile(p)
      } else {
        setProfile(null)
      }
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const isAdmin = user && ADMIN_EMAILS.includes(user.email)

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
