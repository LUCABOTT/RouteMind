export const obtenerDistanciaEstimadaKm = (recorrido) => {
  const distancia =
    recorrido.distanciaEstimadaKm !== undefined
      ? recorrido.distanciaEstimadaKm
      : recorrido.distanciaTotalKm

  return distancia != null && Number.isFinite(Number(distancia))
    ? Number(distancia)
    : null
}

export const crearIcono = (leaflet, numero, tipo = 'parada') =>
  leaflet.divIcon({
    className: 'route-marker-container',
    html: `<div class="route-marker ${tipo}">${numero}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  })
