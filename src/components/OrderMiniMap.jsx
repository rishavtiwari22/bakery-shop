import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { getBakeryCoords } from '../services/geolocation'
import { MapPin } from 'lucide-react'
import RoutingControl from './RoutingControl'

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const bakeryIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -34],
  shadowSize: [32, 32]
})

const orderIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -34],
  shadowSize: [32, 32]
})

export default function OrderMiniMap({ order }) {
  const bakeryCoords = getBakeryCoords()
  if (!order.address?.lat || !order.address?.lng) return (
    <div className="w-full aspect-square rounded-xl bg-gray-50 flex items-center justify-center border border-dashed border-gray-200">
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No Location Data</p>
    </div>
  );

  return (
    <div className="w-full aspect-square rounded-xl overflow-hidden border border-orange-100 shadow-md my-1 relative group bg-gray-100">
      <MapContainer
        key={`${order.id}-${order.status}`}
        center={[order.address.lat, order.address.lng]}
        zoom={13}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; Google'
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        />

        {/* Bakery Hub */}
        <Marker position={[bakeryCoords.lat, bakeryCoords.lng]} icon={bakeryIcon} />

        {/* Order Location */}
        <Marker position={[order.address.lat, order.address.lng]} icon={orderIcon} />

        <RoutingControl 
          bakeryCoords={bakeryCoords} 
          userCoords={{ lat: order.address.lat, lng: order.address.lng }} 
        />
      </MapContainer>
      
      {/* Overlay for Navigation */}
      <a 
        href={`https://www.google.com/maps/dir/${bakeryCoords.lat},${bakeryCoords.lng}/${order.address.lat},${order.address.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-[1000] flex flex-col items-center justify-end p-3 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto"
      >
        <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
           Open Directions <MapPin size={10} />
        </span>
      </a>
    </div>
  )
}
