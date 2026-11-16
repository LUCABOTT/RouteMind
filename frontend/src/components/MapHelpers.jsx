import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

export function AjustarMapa({ puntos }) {
  const map = useMap()

  useEffect(() => {
    if (puntos.length === 1) {
      map.setView(puntos[0], 15)
    } else if (puntos.length > 1) {
      map.fitBounds(puntos, { padding: [45, 45], maxZoom: 15 })
    }
  }, [map, puntos])

  return null
}
