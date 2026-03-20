import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, X, Loader2, Search } from 'lucide-react'
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

interface SearchResult {
  lat: string
  lon: string
  display_name: string
  name?: string
  address?: { road?: string; city?: string; town?: string; country?: string }
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 1 })
  }, [lat, lng, map])
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

async function forwardGeocode(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    return await res.json()
  } catch {
    return []
  }
}

export default function MapPicker({ locations, onAddLocation, onRemoveLocation }: MapPickerProps) {
  const [pending, setPending] = useState<PendingLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [editName, setEditName] = useState('')
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const handleMapClick = async (lat: number, lng: number) => {
    setLoading(true)
    setShowResults(false)
    const { name, address } = await reverseGeocode(lat, lng)
    setPending({ lat, lng, name, address })
    setEditName(name)
    setLoading(false)
  }

  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!value.trim()) { setSearchResults([]); setShowResults(false); return }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      const results = await forwardGeocode(value)
      setSearchResults(results)
      setShowResults(true)
      setSearching(false)
    }, 400)
  }

  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    const parts = result.display_name.split(', ')
    const name = result.name || parts[0]
    const address = parts.slice(1, 4).join(', ')
    setPending({ lat, lng, name, address })
    setEditName(name)
    setFlyTarget({ lat, lng })
    setSearchQuery('')
    setShowResults(false)
    setSearchResults([])
  }

  const confirmAdd = () => {
    if (!pending) return
    onAddLocation({ lat: pending.lat, lng: pending.lng, name: editName || pending.name, address: pending.address })
    setPending(null)
    setEditName('')
    setFlyTarget(null)
  }

  useEffect(() => {
    if (pending) setEditName(pending.name)
  }, [pending])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div ref={searchRef} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Search for a place or click the map..."
            className="w-full rounded-2xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary-400"
          />
          {searching && (
            <Loader2 className="absolute right-3 h-4 w-4 text-primary-400 animate-spin" />
          )}
        </div>
        {showResults && searchResults.length > 0 && (
          <ul className="absolute z-[1000] mt-1 w-full rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            {searchResults.map((r, i) => {
              const parts = r.display_name.split(', ')
              const name = r.name || parts[0]
              const sub = parts.slice(1, 4).join(', ')
              return (
                <li key={i}>
                  <button
                    type="button"
                    onMouseDown={() => handleSelectResult(r)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-primary-50 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-primary-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                      <p className="text-xs text-gray-500 truncate">{sub}</p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

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
          {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}
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

      <p className="text-xs text-gray-500 text-center">Search for a place above or click directly on the map</p>

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
              onClick={() => { setPending(null); setFlyTarget(null) }}
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
