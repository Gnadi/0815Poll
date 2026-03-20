import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { LocationOption } from '../types'

// Fix Leaflet default icon for Vite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function createNumberedIcon(number: number) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 28px;
      height: 28px;
      background: #6366f1;
      border: 2px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="
        transform: rotate(45deg);
        color: white;
        font-size: 12px;
        font-weight: 700;
        font-family: sans-serif;
        line-height: 1;
      ">${number}</span>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  })
}

function FitBounds({ locations }: { locations: LocationOption[] }) {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    if (fitted.current || locations.length === 0) return
    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], 13)
    } else {
      const bounds = L.latLngBounds(locations.map((l) => [l.lat, l.lng]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
    fitted.current = true
  }, [map, locations])

  return null
}

interface LocationViewMapProps {
  locations: LocationOption[]
}

export default function LocationViewMap({ locations }: LocationViewMapProps) {
  if (locations.length === 0) return null

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 mb-4" style={{ height: 300 }}>
      <MapContainer
        center={[locations[0].lat, locations[0].lng]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds locations={locations} />
        {locations.map((loc, index) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={createNumberedIcon(index + 1)}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-gray-800">{index + 1}. {loc.name}</p>
                {loc.address && <p className="text-gray-500 text-xs mt-0.5">{loc.address}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
