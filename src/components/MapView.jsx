import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { BAKERY_LAT, BAKERY_LNG } from '../services/geolocation'

// Fix default marker icon issue with webpack/vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// A cleaner red pin icon to match Google Maps screenshot
const bakeryIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Standard blue icon for user location
const userIcon = new L.Icon.Default()

/**
 * Inner component that handles click events on the map
 */
function ClickMarker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect?.({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

/**
 * MapView component
 * @param {object} userLocation - { lat, lng } of selected delivery location
 * @param {function} onLocationSelect - callback when user clicks on map
 * @param {boolean} interactive - whether user can click to set delivery pin
 */
export default function MapView({ userLocation, onLocationSelect, interactive = true }) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-orange-200 shadow-sm">
      <MapContainer
        center={[BAKERY_LAT, BAKERY_LNG]}
        zoom={18}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='Map data &copy; Google'
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        />

        {/* Bakery marker */}
        <Marker position={[BAKERY_LAT, BAKERY_LNG]} icon={bakeryIcon}>
          <Popup>
            <div className="text-sm font-semibold">🏪 SweetBites Bakery</div>
            <div className="text-xs text-gray-500">Jashpur, Chhattisgarh</div>
          </Popup>
        </Marker>

        {/* User delivery marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-sm font-semibold">📍 Your Delivery Location</div>
              <div className="text-xs text-gray-500">{userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</div>
            </Popup>
          </Marker>
        )}

        {/* Click handler */}
        {interactive && <ClickMarker onLocationSelect={onLocationSelect} />}
      </MapContainer>
    </div>
  )
}
