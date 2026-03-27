import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

export default function RoutingControl({ bakeryCoords, userCoords }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !bakeryCoords || !userCoords) return

    let routingControl = null
    let timer = null
    let retryInterval = null

    const tryInitRouting = () => {
      const Routing = L.Routing || (window.L && window.L.Routing)
      if (!Routing || !Routing.control) return false

      routingControl = Routing.control({
        waypoints: [
          L.latLng(bakeryCoords.lat, bakeryCoords.lng),
          L.latLng(userCoords.lat, userCoords.lng)
        ],
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1'
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
      })

      try {
        routingControl.addTo(map)
        timer = setTimeout(() => {
          const container = routingControl.getContainer()
          if (container) container.style.display = 'none'
        }, 200)
        return true
      } catch (err) {
        console.error('Routing addTo map failed:', err)
        return false
      }
    }

    // Try immediately
    if (!tryInitRouting()) {
      // If failed, retry every 500ms for up to 5 seconds
      let attempts = 0
      retryInterval = setInterval(() => {
        attempts++
        if (tryInitRouting() || attempts > 10) {
          clearInterval(retryInterval)
        }
      }, 500)
    }

    return () => {
      if (retryInterval) clearInterval(retryInterval)
      if (timer) clearTimeout(timer)
      if (map && routingControl) {
        try {
          map.removeControl(routingControl)
        } catch (e) { /* ignore */ }
      }
    }
  }, [map, bakeryCoords, userCoords])

  return null
}
