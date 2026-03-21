import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
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
  lat: number
  lng: number
  name: string
  address: string
  displayName: string
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

async function searchPlaces(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    return data.map((item: { lat: string; lon: string; display_name: string }) => {
      const parts = (item.display_name as string).split(', ')
      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        name: parts[0],
        address: parts.slice(1, 4).join(', '),
        displayName: item.display_name,
      }
    })
  } catch {
    return []
  }
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
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

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

  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    setShowDropdown(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setSearchResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const results = await searchPlaces(value.trim())
      setSearchResults(results)
      setSearching(false)
    }, 350)
  }

  const handleSelectResult = (result: SearchResult) => {
    setPending(result)
    setEditName(result.name)
    setSearchQuery('')
    setSearchResults([])
    setShowDropdown(false)
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (pending) setEditName(pending.name)
  }, [pending])

  return (
    <div className="space-y-3">
      {/* Search input with dropdown */}
      <div className="relative" ref={wrapperRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            placeholder="Search for a location..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 pl-9 pr-9 py-2 text-sm outline-none focus:border-primary-400"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>
        {showDropdown && searchResults.length > 0 && (
          <ul className="absolute z-[1000] w-full mt-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
            {searchResults.map((result, i) => (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={() => handleSelectResult(result)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-primary-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{result.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.address}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pending location confirm dialog */}
      {pending && (
        <div className="rounded-2xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-4">
          <p className="text-xs font-medium text-primary-700 dark:text-primary-300 mb-2">Add this location?</p>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm mb-1 outline-none focus:border-primary-400"
            placeholder="Location name"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{pending.address}</p>
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
              className="flex-1 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-2 text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700" style={{ height: 280 }}>
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

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Or click the map to add locations</p>

      {/* Location list */}
      {locations.length > 0 && (
        <ul className="space-y-2">
          {locations.map((loc) => (
            <li key={loc.id} className="flex items-center gap-3 rounded-xl bg-white dark:bg-gray-800 px-4 py-3 border border-gray-100 dark:border-gray-700">
              <MapPin className="h-4 w-4 text-primary-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{loc.name}</p>
                {loc.address && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{loc.address}</p>}
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
