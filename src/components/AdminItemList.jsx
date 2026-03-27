import { useState } from 'react'
import { Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { deleteItem, updateItem } from '../services/firebase'
import AdminItemForm from './AdminItemForm'
import toast from 'react-hot-toast'

export default function AdminItemList({ items, onRefresh }) {
  const [editItem, setEditItem] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return
    setDeleting(id)
    try {
      await deleteItem(id)
      toast.success('Item deleted!')
      onRefresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleStock = async (item) => {
    try {
      await updateItem(item.id, { isOutOfStock: !item.isOutOfStock })
      toast.success(`Marked as ${item.isOutOfStock ? 'In Stock' : 'Out of Stock'}`)
      onRefresh()
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-2">🍰</div>
        <p>No items yet. Add your first item above!</p>
      </div>
    )
  }

  return (
    <>
      {/* Edit modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Edit Item</h3>
            <AdminItemForm item={editItem} onSuccess={() => { setEditItem(null); onRefresh() }} />
            <button onClick={() => setEditItem(null)} className="mt-3 w-full text-gray-500 text-sm py-2 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-orange-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
            <img
              src={item.photoUrl || 'https://placehold.co/60x60/ffd7aa/f97316?text=🍰'}
              alt={item.name}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900">{item.name}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.tags?.includes('veg') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.tags?.includes('veg') ? 'VEG' : 'NON-VEG'}
                </span>
                {item.isOutOfStock && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-500">OUT OF STOCK</span>
                )}
              </div>
              <p className="text-sm text-orange-600 font-bold">₹{item.price}</p>
              <p className="text-xs text-gray-500">Stock: {item.stockQty}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Toggle stock */}
              <button
                onClick={() => handleToggleStock(item)}
                className={`p-2 rounded-lg transition-colors ${item.isOutOfStock ? 'text-gray-400 hover:text-green-600 hover:bg-green-50' : 'text-green-600 hover:text-gray-400 hover:bg-gray-50'}`}
                title={item.isOutOfStock ? 'Mark In Stock' : 'Mark Out of Stock'}
              >
                {item.isOutOfStock ? <ToggleLeft size={22} /> : <ToggleRight size={22} />}
              </button>
              {/* Edit */}
              <button
                onClick={() => setEditItem(item)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Pencil size={16} />
              </button>
              {/* Delete */}
              <button
                onClick={() => handleDelete(item.id)}
                disabled={deleting === item.id}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
              >
                {deleting === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
