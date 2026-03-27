// Bakery location: NavGurukul Jashpur Campus
export const BAKERY_LAT = 22.8821
export const BAKERY_LNG = 84.1683
export const MAX_DELIVERY_KM = 10

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
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  })
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
