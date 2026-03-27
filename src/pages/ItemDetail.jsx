import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, ShoppingCart, Loader2, Star, MessageSquare, Send } from 'lucide-react'
import { fetchItem, fetchReviews, addReview, checkUserHasOrdered } from '../services/firebase'
import { useCartStore } from '../store/cartStore'
import { useAuth } from '../context/AuthContext'
import { optimizeImage } from '../services/imageUtils'
import toast from 'react-hot-toast'

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  
  const [reviews, setReviews] = useState([])
  const [canReview, setCanReview] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  useEffect(() => {
    loadData()
  }, [id, user])

  const loadData = async () => {
    try {
      const itemData = await fetchItem(id)
      setItem(itemData)
      
      const [reviewsData, purchased] = await Promise.all([
        fetchReviews(id),
        user ? checkUserHasOrdered(user.uid, id) : Promise.resolve(false)
      ])
      
      setReviews(reviewsData)
      setCanReview(purchased && !reviewsData.some(r => r.userId === user?.uid))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!user) return
    
    setSubmittingReview(true)
    try {
      const reviewData = {
        itemId: id,
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        rating: newReview.rating,
        comment: newReview.comment,
      }
      
      await addReview(reviewData)
      toast.success('Review submitted! Thank you.')
      setNewReview({ rating: 5, comment: '' })
      setShowReviewForm(false)
      loadData() // Refresh
    } catch (err) {
      toast.error('Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-orange-500" size={40} />
    </div>
  )

  if (!item) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">😕</div>
      <h2 className="text-xl font-semibold text-gray-700">Item not found</h2>
      <button onClick={() => navigate('/')} className="mt-4 bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium">Go Home</button>
    </div>
  )

  const isOutOfStock = item.isOutOfStock || item.stockQty === 0
  const isVeg = item.tags?.includes('veg')

  const handleAdd = () => {
    if (isOutOfStock) return
    addItem(item, qty)
    toast.success(`${item.name} added to cart!`)
    openCart()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-20">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors text-sm"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-orange-100 mb-10">
        <div className="md:flex">
          {/* Image */}
          <div className="md:w-1/2 relative">
            {item.photoUrl ? (
              <img src={optimizeImage(item.photoUrl, 800)} alt={item.name} className="w-full h-72 md:h-full object-cover" />
            ) : (
              <div className="w-full h-72 md:h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-8xl">
                🍰
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold">Out of Stock</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
            {/* Tag */}
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full w-fit mb-3 ${isVeg ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
              <span className={`w-2 h-2 rounded-full inline-block ${isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
              {isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
            </span>

            <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{item.name}</h1>
            
            {/* Rating Summary */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center text-amber-500">
                <Star size={16} fill="currentColor" />
              </div>
              <span className="text-sm font-bold text-gray-700">
                {item.avgRating ? item.avgRating.toFixed(1) : 'New'}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500 cursor-pointer" onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}>
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </span>
            </div>

            <p className="text-gray-500 text-sm mb-6 leading-relaxed">{item.desc}</p>

            <div className="text-3xl font-bold text-orange-500 mb-1">₹{item.price}</div>
            {!isOutOfStock && <p className="text-sm text-gray-400 mb-6">{item.stockQty} in stock</p>}

            {/* Qty selector */}
            {!isOutOfStock && (
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-orange-400 flex items-center justify-center transition-colors shadow-sm"
                >
                  <Minus size={16} />
                </button>
                <span className="text-xl font-bold w-8 text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(item.stockQty, q + 1))}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-orange-400 flex items-center justify-center transition-colors shadow-sm"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all ${
                isOutOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white shadow-lg shadow-orange-200'
              }`}
            >
              <ShoppingCart size={20} />
              {isOutOfStock ? 'Out of Stock' : `Add ${qty} to Cart — ₹${(item.price * qty).toFixed(0)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div id="reviews-section" className="space-y-8">
        <div className="flex items-center justify-between border-b border-orange-100 pb-4">
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
            Customer Reviews ({reviews.length})
          </h2>
          {user && !canReview && !reviews.some(r => r.userId === user.uid) && (
            <span className="text-xs text-orange-400 font-medium italic">
              Purchased this? You can review once it is delivered!
            </span>
          )}
          {canReview && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="text-sm font-semibold text-orange-500 hover:text-orange-600 border border-orange-200 px-4 py-1.5 rounded-full hover:bg-orange-50 transition-all"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Add Review Form */}
        {showReviewForm && (
          <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="font-bold text-gray-800 mb-4">How was it?</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className={`transition-colors ${star <= newReview.rating ? 'text-amber-500' : 'text-gray-300'}`}
                  >
                    <Star size={24} fill={star <= newReview.rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                placeholder="Share your experience... was it fresh? tasty?"
                className="w-full bg-white border border-orange-200 rounded-xl p-4 text-sm focus:outline-none focus:border-orange-500 resize-none min-h-[100px]"
                required
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 text-sm text-gray-500 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex items-center gap-2 bg-orange-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-orange-600 disabled:opacity-50 transition-all"
                >
                  {submittingReview ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Post Review
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <div className="text-center py-10 text-gray-400 italic">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-20" />
              <p>No reviews yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="border-b border-gray-50 pb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                      {rev.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{rev.userName}</h4>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={10}
                            className={star <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {rev.timestamp?.toDate ? rev.timestamp.toDate().toLocaleDateString('en-IN') : 'Just now'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 pl-11 leading-relaxed">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
