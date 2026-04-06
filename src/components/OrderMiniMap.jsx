import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { getBakeryCoords } from '../services/geolocation'
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
  if (!order.address?.lat || !order.address?.lng) return null;

  return (
    <div className="w-full aspect-square rounded-xl overflow-hidden border border-orange-100 shadow-inner my-1 relative group">
      <MapContainer
        key={`${order.id}-${order.status}`}
        center={[order.address.lat, order.address.lng]}
        zoom={15}
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
        <Marker position={[order.address.lat, order.address.lng]} icon={orderIcon}>
          <Popup>
            <div className="text-[10px] font-bold">📍 {order.customerName}</div>
          </Popup>
        </Marker>

        <RoutingControl 
          bakeryCoords={bakeryCoords} 
          userCoords={{ lat: order.address.lat, lng: order.address.lng }} 
        />
      </MapContainer>
      
      {/* Overlay to allow opening in Google Maps */}
      <a 
        href={`https://www.google.com/maps/dir/${bakeryCoords.lat},${bakeryCoords.lng}/${order.address.lat},${order.address.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors"
      >
        <span className="bg-white/90 text-[10px] font-bold px-2 py-1 rounded-full text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
           Open Directions ↗
        </span>
      </a>
    </div>
  )
}
