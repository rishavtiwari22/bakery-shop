import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

export default function RoutingControl({ bakeryCoords, userCoords, onDistanceChange }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !bakeryCoords || !userCoords) return

    let routingControl = null
    let timer = null

    const Routing = L.Routing || (window.L && window.L.Routing)
    if (!Routing || !Routing.control) return

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
    }).addTo(map)

    routingControl.on('routesfound', (e) => {
      const routes = e.routes
      const dist = routes[0].summary.totalDistance / 1000 // KM
      onDistanceChange?.(dist)
    })

    timer = setTimeout(() => {
      const container = routingControl.getContainer()
      if (container) container.style.display = 'none'
    }, 200)

    return () => {
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
