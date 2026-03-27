import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { BAKERY_LAT, BAKERY_LNG } from '../services/geolocation'

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
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const orderIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

export default function AdminDeliveryMap({ orders }) {
  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled' && o.address?.lat)

  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-orange-200 shadow-sm mb-6">
      <MapContainer
        center={[BAKERY_LAT, BAKERY_LNG]}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='Map data &copy; Google'
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        />

        {/* Bakery */}
        <Marker position={[BAKERY_LAT, BAKERY_LNG]} icon={bakeryIcon}>
          <Popup>
            <div className="text-sm font-bold text-orange-600">🏪 SweetBites Bakery (Hub)</div>
          </Popup>
        </Marker>

        {/* Orders */}
        {activeOrders.map(order => (
          <Marker 
            key={order.id} 
            position={[order.address.lat, order.address.lng]} 
            icon={orderIcon}
          >
            <Popup>
              <div className="p-1">
                <p className="text-xs font-bold text-gray-900 mb-1">Order #{order.id.slice(-6).toUpperCase()}</p>
                <p className="text-[10px] text-gray-600 mb-1">👤 {order.customerName}</p>
                <p className="text-[10px] text-gray-500 mb-2 truncate max-w-[150px]">📍 {order.address.full}</p>
                <div className="flex items-center gap-1.5">
                   <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase">{order.status}</span>
                   <span className="text-[8px] text-gray-400 font-bold">{order.distance?.toFixed(1)}km away</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
