import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

export default function RoutingControl({ bakeryCoords, userCoords, onDistanceChange }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !bakeryCoords || !userCoords) return

    // Simple check to prevent redundant boots if coords are identical to last run
    // (React handles this mostly, but Routing libraries sometimes trigger on subtle changes)
    
    let routingControl = null
    let timer = null
    let isMounted = true

    const Routing = L.Routing || (window.L && window.L.Routing)
    if (!Routing || !Routing.control) return

    // Delay to avoid hitting OSRM too hard if many maps mount at once (e.g. Dashboard)
    // Increased jitter to 2s to better handle list scrolls
    const delay = Math.floor(Math.random() * 2000) 
    
    timer = setTimeout(() => {
      if (!isMounted || !map) return

      try {
        routingControl = Routing.control({
          waypoints: [
            L.latLng(bakeryCoords.lat, bakeryCoords.lng),
            L.latLng(userCoords.lat, userCoords.lng)
          ],
          router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            timeout: 5000
          }),
          routeWhileDragging: false,
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: true,
          showAlternatives: false,
          lineOptions: {
            styles: [{ color: '#f97316', weight: 6, opacity: 0.8 }]
          },
          createMarker: () => null,
          autoRoute: true
        }).addTo(map)

        // Silence errors to prevent console spam
        routingControl.on('routingerror', (e) => {
          if (isMounted) {
            console.warn('Map routing suppressed (Service busy or unavailable)')
          }
        })

        routingControl.on('routesfound', (e) => {
          if (!isMounted) return
          const routes = e.routes
          const dist = routes[0].summary.totalDistance / 1000 // KM
          onDistanceChange?.(dist)
        })

        // Hide the instruction panel
        const container = routingControl.getContainer()
        if (container) container.style.display = 'none'
      } catch (err) {
        // Silently fail for routing setup issues
      }
    }, delay)

    return () => {
      isMounted = false
      if (timer) clearTimeout(timer)
      if (map && routingControl) {
        try {
          // Safely remove
          setTimeout(() => {
            try { map.removeControl(routingControl) } catch (e) { /* ignore */ }
          }, 0)
        } catch (e) { /* ignore */ }
      }
    }
  }, [map, bakeryCoords.lat, bakeryCoords.lng, userCoords.lat, userCoords.lng])

  return null
}
