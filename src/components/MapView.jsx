import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'
import { BAKERY_LAT, BAKERY_LNG, getBakeryCoords } from '../services/geolocation'
import { useSettingsStore } from '../store/useSettingsStore'
import RoutingControl from './RoutingControl'

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
 * Helper to auto-center and zoom when user location changes
 */
function AutoCenter({ userLocation }) {
  const map = useMap()
  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 19, { animate: true }) // Zoom 19 is very detailed
    }
  }, [userLocation, map])
  return null
}

/**
 * MapView component
 * @param {object} userLocation - { lat, lng } of selected delivery location
 * @param {function} onLocationSelect - callback when user clicks on map
 * @param {boolean} interactive - whether user can click to set delivery pin
 */
export default function MapView({ userLocation, onLocationSelect, onDistanceChange, interactive = true }) {
  const settings = useSettingsStore(s => s.settings)
  const bakeryCoords = getBakeryCoords()
  
  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-orange-200 shadow-sm">
      <MapContainer
        center={[bakeryCoords.lat, bakeryCoords.lng]}
        zoom={16}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='Map data &copy; Google'
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        />

        <AutoCenter userLocation={userLocation} />

        {/* Bakery marker */}
        <Marker position={[bakeryCoords.lat, bakeryCoords.lng]} icon={bakeryIcon}>
          <Popup>
            <div className="text-sm font-semibold">🏪 {settings?.name || 'Nice Bakery'}</div>
            <div className="text-xs text-gray-500">{settings?.address || 'Jashpur, Chhattisgarh'}</div>
          </Popup>
        </Marker>

        {/* User delivery marker */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={userLocation.accuracy || 20}
              pathOptions={{ fillColor: 'blue', fillOpacity: 0.1, color: 'blue', weight: 1, dashArray: '5, 5' }}
            />
            <Marker 
              position={[userLocation.lat, userLocation.lng]} 
              icon={userIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target
                  const position = marker.getLatLng()
                  onLocationSelect?.({ lat: position.lat, lng: position.lng })
                },
              }}
            >
              <Popup>
                <div className="text-sm font-semibold">📍 Your Delivery Location</div>
                <div className="text-[10px] text-gray-400 mb-1">Drag marker to fine-tune</div>
                <div className="text-[10px] text-gray-500">{userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}</div>
              </Popup>
            </Marker>
            <RoutingControl 
              bakeryCoords={{ lat: BAKERY_LAT, lng: BAKERY_LNG }} 
              userCoords={userLocation} 
              onDistanceChange={onDistanceChange}
            />
          </>
        )}

        {/* Click handler */}
        {interactive && <ClickMarker onLocationSelect={onLocationSelect} />}
      </MapContainer>
    </div>
  )
}
