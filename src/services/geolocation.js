import bakeryData from '../data/bakeryData.json'
import { useSettingsStore } from '../store/useSettingsStore'

// Get current bakery location from store or fallback to static data
export const getBakeryCoords = () => {
  const settings = useSettingsStore.getState().settings
  return settings?.location || bakeryData.location
}

// Keep constants for legacy or initial state, but components should use getBakeryCoords()
export const BAKERY_LAT = bakeryData.location.lat
export const BAKERY_LNG = bakeryData.location.lng
export const DEFAULT_MAX_KM = 10

/**
 * Haversine formula – returns distance in km between two lat/lng points.
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371 // Earth radius km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg) {
  return (deg * Math.PI) / 180
}

/**
 * Get current position via browser Geolocation API.
 * Returns a Promise resolving to { lat, lng }.
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    )
  })
}

/**
 * Forward Geocoding: Calculate lat/lng from an address string.
 */
export async function searchAddress(query) {
  if (!query) return null
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
    )
    const data = await res.json()
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      }
    }
    return null
  } catch (err) {
    console.error('Search error:', err)
    return null
  }
}

/**
 * Reverse geocode using Nominatim (free, no key required).
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    )
    const data = await res.json()
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

/**
 * Calculate distance from bakery to user location.
 */
export function distanceFromBakery(lat, lng) {
  return haversineDistance(BAKERY_LAT, BAKERY_LNG, lat, lng)
}
/**
 * Estimate delivery time based on distance.
 * 20 mins prep + 3 mins/km travel + 5 mins buffer.
 */
export function getEstimatedDeliveryTime(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) return 30 // Fallback
  const prepTime = 20
  const travelTime = Math.round(distanceKm * 3)
  const buffer = 5
  return prepTime + travelTime + buffer
}
