import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { getBakeryCoords } from '../services/geolocation'
import RoutingControl from './RoutingControl'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import { Loader2, Navigation2, Map as MapIcon, RotateCcw } from 'lucide-react'

// Custom icons
const bakeryIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/614/614581.png', // Bakery/Shop icon
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
})

const deliveryIcon = L.divIcon({
  html: `<div class="delivery-marker-container">
          <div class="delivery-bike">🛵</div>
          <div class="delivery-pulse"></div>
         </div>`,
  className: 'custom-delivery-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
})

const customerIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1239/1239525.png', // House icon
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
})

// Component to handle map centering and bounds
function MapAutoCenter({ coords, isFirstLoad }) {
  const map = useMap()
  useEffect(() => {
    if (coords && isFirstLoad) {
      map.setView([coords.lat, coords.lng], 15)
    }
  }, [coords, isFirstLoad, map])
  return null
}

export default function LiveTrackingMap({ orderId, customerCoords, status }) {
  const [deliveryCoords, setDeliveryCoords] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const bakeryCoords = getBakeryCoords()

  useEffect(() => {
    if (!orderId) return

    // Real-time subscription to delivery coordinates
    const unsub = onSnapshot(doc(db, 'orders', orderId), (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        if (data.deliveryCoords) {
          setDeliveryCoords(data.deliveryCoords)
        }
      }
      setLoading(false)
    })

    return () => unsub()
  }, [orderId])

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-orange-50/50 rounded-2xl border border-orange-100">
        <Loader2 className="animate-spin text-orange-500 mb-2" size={32} />
        <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">Initializing Tracking...</p>
      </div>
    )
  }

  if (!customerCoords || !customerCoords.lat || !customerCoords.lng) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <MapIcon className="text-gray-300 mb-2" size={32} />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-4">
          Location data not available for this order
        </p>
      </div>
    )
  }

  const currentPos = deliveryCoords || bakeryCoords

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-white shadow-2xl">
      <MapContainer
        center={[currentPos.lat, currentPos.lng]}
        zoom={15}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; Google'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" // Standard roadmap for better visibility
        />

        <MapAutoCenter coords={currentPos} isFirstLoad={isFirstLoad} />

        {/* Bakery Hub */}
        <Marker position={[bakeryCoords.lat, bakeryCoords.lng]} icon={bakeryIcon}>
          <Popup>
            <div className="text-xs font-bold">🏪 Nice Bakery Hub</div>
          </Popup>
        </Marker>

        {/* Customer Location */}
        <Marker position={[customerCoords.lat, customerCoords.lng]} icon={customerIcon}>
          <Popup>
            <div className="text-xs font-bold">🏠 Your Location</div>
          </Popup>
        </Marker>

        {/* Delivery Boy - Smooth Movement via CSS */}
        {deliveryCoords && (
          <Marker 
            position={[deliveryCoords.lat, deliveryCoords.lng]} 
            icon={deliveryIcon}
          >
            <Popup>
              <div className="text-xs font-bold">🛵 Delivery Partner is here</div>
            </Popup>
          </Marker>
        )}

        <RoutingControl 
          startCoords={status === 'on_the_way' && deliveryCoords ? deliveryCoords : bakeryCoords} 
          userCoords={customerCoords} 
        />
      </MapContainer>

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button 
          onClick={() => setIsFirstLoad(true)}
          className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg text-orange-600 hover:bg-orange-50 transition-colors"
          title="Recenter"
        >
          <Navigation2 size={20} />
        </button>
      </div>

      {/* Status Overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000]">
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-orange-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
              <MapIcon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Live Status</p>
              <p className="text-sm font-bold text-gray-800 capitalize">{status?.replace(/_/g, ' ') || 'Tracking...'}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-delivery-icon {
          transition: transform 1s linear; /* Smooth transition between updates */
        }
        .delivery-marker-container {
          display: flex;
          align-items: center;
          justify-center: center;
          position: relative;
        }
        .delivery-bike {
          font-size: 24px;
          z-index: 2;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }
        .delivery-pulse {
          position: absolute;
          width: 40px;
          height: 40px;
          background: rgba(249, 115, 22, 0.2);
          border-radius: 50%;
          z-index: 1;
          animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(.33); }
          80%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
