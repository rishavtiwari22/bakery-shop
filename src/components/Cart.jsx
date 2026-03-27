import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function Cart() {
  const { items, removeItem, updateQty, closeCart, getTotal } = useCartStore()
  const navigate = useNavigate()
  const total = getTotal()

  // Close on Escape
  useEffect(() => {
    const handle = (e) => e.key === 'Escape' && closeCart()
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [closeCart])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={closeCart}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
            Your Cart
          </h2>
          <button onClick={closeCart} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-gray-500 font-medium">Your cart is empty</p>
            <p className="text-gray-400 text-sm mt-1">Add some delicious items!</p>
            <button
              onClick={closeCart}
              className="mt-6 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Browse Items
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 bg-orange-50 rounded-xl p-3">
                  <img
                    src={item.photoUrl || 'https://placehold.co/60x60/ffd7aa/f97316?text=🍰'}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                    <p className="text-orange-600 font-bold text-sm">₹{item.price}</p>
                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => item.qty === 1 ? removeItem(item.id) : updateQty(item.id, item.qty - 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-orange-400 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-semibold text-sm w-6 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, Math.min(item.qty + 1, item.stockQty))}
                        disabled={item.qty >= item.stockQty}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-orange-400 transition-colors disabled:opacity-40"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Notes */}
            <div className="mt-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Special Instructions</label>
              <textarea
                value={useCartStore(s => s.orderNotes)}
                onChange={(e) => useCartStore.getState().setOrderNotes(e.target.value)}
                placeholder="e.g. Less chilli, no egg, extra spicy..."
                className="w-full bg-orange-50/50 border border-orange-100 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-400 transition-colors resize-none h-20"
              />
            </div>
          </>
        )}
      </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Subtotal</span>
              <span className="font-bold text-gray-900">₹{total.toFixed(2)}</span>
            </div>
            <button
              onClick={() => { closeCart(); navigate('/location') }}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-orange-200"
            >
              <ShoppingBag size={18} />
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  )
}
