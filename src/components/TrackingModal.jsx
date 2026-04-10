import { X, Map as MapIcon, Navigation2 } from 'lucide-react'
import LiveTrackingMap from './LiveTrackingMap'
import { cancelOrder } from '../services/firebase'
import toast from 'react-hot-toast'

export default function TrackingModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Live Tracking</h2>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order #{order.id.slice(-8).toUpperCase()}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-2xl transition-all group"
          >
            <X size={24} className="text-gray-400 group-hover:text-gray-900 group-hover:rotate-90 transition-all duration-300" />
          </button>
        </div>

        {/* Map Body */}
        <div className="flex-1 relative bg-gray-50">
          <LiveTrackingMap 
            orderId={order.id} 
            customerCoords={order.address} 
            status={order.status} 
          />
        </div>

        {/* Footer Info */}
        <div className="p-6 bg-white border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner">
              <Navigation2 size={24} className="animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Status</p>
              <p className="text-lg font-bold text-gray-900 leading-none">
                {order.status === 'pending' ? 'Order Placed' : 
                 order.status === 'preparing' ? 'Preparing' : 
                 order.status === 'on_the_way' ? 'On The Way' : 
                 order.status === 'delivered' ? 'Delivered' : 'Cancelled'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {order.status === 'pending' && (
              <button
                onClick={async () => {
                  if (window.confirm('Cancel this order?')) {
                    try {
                      await cancelOrder(order.id);
                      toast.success('Order cancelled');
                      onClose();
                    } catch (err) {
                      toast.error('Failed to cancel');
                    }
                  }
                }}
                className="px-6 py-3 border-2 border-red-50 text-red-500 hover:bg-red-50 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Cancel Order
              </button>
            )}

            <div className="flex items-center gap-4 px-6 py-3 bg-orange-50 rounded-2xl border border-orange-100">
              <div className="text-right">
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest leading-none mb-1">Delivery Partner</p>
                <p className="text-sm font-bold text-orange-900">Heading to your location</p>
              </div>
              <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center font-bold text-xl">🛵</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
