import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, X, Loader2 } from 'lucide-react'
import type { LocationOption } from '../types'

// Fix Leaflet default icon for Vite (use CDN URLs)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface MapPickerProps {
  locations: LocationOption[]
  onAddLocation: (loc: Omit<LocationOption, 'id' | 'votes'>) => void
  onRemoveLocation: (id: string) => void
}

interface PendingLocation {
  lat: number
  lng: number
  name: string
  address: string
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

async function reverseGeocode(lat: number, lng: number): Promise<{ name: string; address: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    const displayName: string = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    const parts = displayName.split(', ')
    const name = parts[0] || displayName
    const address = parts.slice(1, 4).join(', ')
    return { name, address }
  } catch {
    return { name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, address: '' }
  }
}

export default function MapPicker({ locations, onAddLocation, onRemoveLocation }: MapPickerProps) {
  const [pending, setPending] = useState<PendingLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [editName, setEditName] = useState('')

  const handleMapClick = async (lat: number, lng: number) => {
    setLoading(true)
    const { name, address } = await reverseGeocode(lat, lng)
    setPending({ lat, lng, name, address })
    setEditName(name)
    setLoading(false)
  }

  const confirmAdd = () => {
    if (!pending) return
    onAddLocation({ lat: pending.lat, lng: pending.lng, name: editName || pending.name, address: pending.address })
    setPending(null)
    setEditName('')
  }

  useEffect(() => {
    if (pending) setEditName(pending.name)
  }, [pending])

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden border border-gray-200" style={{ height: 280 }}>
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onMapClick={handleMapClick} />
          {locations.map((loc) => (
            <Marker key={loc.id} position={[loc.lat, loc.lng]}>
              <Popup>{loc.name}</Popup>
            </Marker>
          ))}
          {pending && (
            <Marker position={[pending.lat, pending.lng]} opacity={0.6} />
          )}
        </MapContainer>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">Click on the map to add locations</p>

      {/* Pending location confirm dialog */}
      {pending && (
        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4">
          <p className="text-xs font-medium text-primary-700 mb-2">Add this location?</p>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm mb-1 outline-none focus:border-primary-400"
            placeholder="Location name"
          />
          <p className="text-xs text-gray-500 mb-3">{pending.address}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmAdd}
              className="flex-1 rounded-xl bg-primary-500 py-2 text-sm font-semibold text-white"
            >
              Add Location
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="flex-1 rounded-xl bg-white border border-gray-200 py-2 text-sm font-medium text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Location list */}
      {locations.length > 0 && (
        <ul className="space-y-2">
          {locations.map((loc) => (
            <li key={loc.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 border border-gray-100">
              <MapPin className="h-4 w-4 text-primary-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{loc.name}</p>
                {loc.address && <p className="text-xs text-gray-500 truncate">{loc.address}</p>}
              </div>
              <button
                type="button"
                onClick={() => onRemoveLocation(loc.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
