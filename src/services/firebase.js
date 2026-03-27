import { initializeApp } from 'firebase/app'
import { MOCK_ITEMS, MOCK_ORDERS, MOCK_REVIEWS } from '../data/mockData'
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// ⚠️  Replace with your Firebase project config from .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

const googleProvider = new GoogleAuthProvider()

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true'
console.log('SweetBites Mode:', USE_MOCK ? 'MOCK' : 'FIREBASE')

let mockOrderCallback = null

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginWithGoogle = () => {
  if (USE_MOCK) return Promise.resolve({ user: { email: 'admin@sweetbites.com' } })
  return signInWithPopup(auth, googleProvider)
}

export const loginWithEmail = (email, password) => {
  if (USE_MOCK) return Promise.resolve({ user: { email } })
  return signInWithEmailAndPassword(auth, email, password)
}

export const logout = () => {
  if (USE_MOCK) {
    window.location.reload() // simplest way to clear mock state
    return Promise.resolve()
  }
  return signOut(auth)
}

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback)

// ─── Items ───────────────────────────────────────────────────────────────────

export const fetchItems = async (filters = {}) => {
  if (USE_MOCK) {
    let filtered = [...MOCK_ITEMS]
    if (filters.tag) {
      filtered = filtered.filter(i => i.tags?.includes(filters.tag))
    }
    return filtered
  }

  const itemsRef = collection(db, 'items')
  let q = query(itemsRef, orderBy('createdAt', 'desc'))
  if (filters.tag) {
    q = query(itemsRef, where('tags', 'array-contains', filters.tag), orderBy('createdAt', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const fetchItem = async (id) => {
  if (USE_MOCK) {
    return MOCK_ITEMS.find(i => i.id === id) || null
  }

  const docRef = doc(db, 'items', id)
  const snap = await getDoc(docRef)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export const addItem = async (item) => {
  return addDoc(collection(db, 'items'), { ...item, createdAt: serverTimestamp() })
}

export const updateItem = async (id, data) => {
  return updateDoc(doc(db, 'items', id), data)
}

export const deleteItem = async (id) => {
  return deleteDoc(doc(db, 'items', id))
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export const createOrder = async (orderData) => {
  if (USE_MOCK) {
    console.log('Mock Order Created:', orderData)
    const newOrder = {
      id: 'mock-order-' + Date.now(),
      ...orderData,
      status: 'pending',
      timestamp: { toDate: () => new Date() }
    }
    MOCK_ORDERS.unshift(newOrder)
    return newOrder
  }
  return addDoc(collection(db, 'orders'), {
    ...orderData,
    status: 'pending',
    timestamp: serverTimestamp(),
  })
}

export const subscribeToUserOrders = (userId, callback) => {
  if (USE_MOCK) {
    const userOrders = MOCK_ORDERS.filter(o => o.customerId === userId || userId === 'demo-user')
    callback(userOrders)
    return () => {}
  }

  const q = query(
    collection(db, 'orders'),
    where('customerId', '==', userId),
    orderBy('timestamp', 'desc')
  )
  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(orders)
  })
}

export const fetchAllOrders = async () => {
  if (USE_MOCK) {
    return MOCK_ORDERS
  }
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const subscribeToOrders = (callback) => {
  if (USE_MOCK) {
    mockOrderCallback = callback
    // Initial load
    setTimeout(() => callback(MOCK_ORDERS), 100)
    return () => { mockOrderCallback = null }
  }

  const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'))
  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(orders)
  })
}

export const simulateNewOrder = (name) => {
  if (!USE_MOCK || !mockOrderCallback) return
  const newOrder = {
    id: 'mock-sim-' + Date.now(),
    customerName: name,
    customerEmail: `${name.toLowerCase()}@example.com`,
    total: 99.00,
    status: 'pending',
    items: [{ name: 'Test Cupcake', qty: 1, price: 99 }],
    timestamp: { toDate: () => new Date() }
  }
  MOCK_ORDERS.unshift(newOrder)
  mockOrderCallback([...MOCK_ORDERS])
}

export const updateOrderStatus = async (id, status) => {
  if (USE_MOCK) return
  return updateDoc(doc(doc(db, 'orders', id), { status }))
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const fetchReviews = async (itemId) => {
  if (USE_MOCK) {
    return MOCK_REVIEWS.filter(r => r.itemId === itemId)
  }
  const q = query(collection(db, 'reviews'), where('itemId', '==', itemId), orderBy('timestamp', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const addReview = async (reviewData) => {
  if (USE_MOCK) {
    const newRev = {
      id: 'mock-rev-' + Date.now(),
      ...reviewData,
      timestamp: { toDate: () => new Date() }
    }
    MOCK_REVIEWS.unshift(newRev)
    // Update mock item rating (simplified)
    const item = MOCK_ITEMS.find(i => i.id === reviewData.itemId)
    if (item) {
      item.reviewCount = (item.reviewCount || 0) + 1
      item.avgRating = ((item.avgRating || 0) * (item.reviewCount - 1) + reviewData.rating) / item.reviewCount
    }
    return newRev
  }
  
  const docRef = await addDoc(collection(db, 'reviews'), {
    ...reviewData,
    timestamp: serverTimestamp()
  })

  // Note: In real app, we'd use a Cloud Function or batch to update item.avgRating
  // For simplicity here, we'll just return the doc
  return { id: docRef.id, ...reviewData }
}

export const checkUserHasOrdered = async (userId, itemId) => {
  if (USE_MOCK) {
    // Treat demo user as having ordered item-001 and item-003
    return ['item-001', 'item-003'].includes(itemId)
  }
  
  const q = query(
    collection(db, 'orders'), 
    where('customerId', '==', userId),
    where('status', '==', 'delivered')
  )
  const snap = await getDocs(q)
  return snap.docs.some(doc => {
    const orderItems = doc.data().items || []
    return orderItems.some(item => item.itemId === itemId)
  })
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export const uploadPhoto = async (file) => {
  if (USE_MOCK) {
    console.log('Mock Photo Uploaded')
    // Return a random Unsplash image as placeholder
    return `https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop&sig=${Date.now()}`
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'Upload failed')
    return data.secure_url
  } catch (err) {
    console.error('Cloudinary Error:', err)
    throw new Error('Failed to upload image to Cloudinary')
  }
}
