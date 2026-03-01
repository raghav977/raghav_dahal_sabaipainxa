import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
})

import { useState } from "react"

function LocationPicker({ center, value, radius, onChange }) {
  const [markerPos, setMarkerPos] = useState(value || { lat: center.lat, lng: center.lng })
  const map = useMapEvents({
    click(e) {
      const dist = map.distance([center.lat, center.lng], [e.latlng.lat, e.latlng.lng])
      if (dist > radius) return
      setMarkerPos({ lat: e.latlng.lat, lng: e.latlng.lng })
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${e.latlng.lat}&lon=${e.latlng.lng}&format=json`)
        .then((r) => r.json())
        .then((data) => {
          onChange({ lat: e.latlng.lat, lng: e.latlng.lng, address: data.display_name })
        })
        .catch(() => {
          onChange({ lat: e.latlng.lat, lng: e.latlng.lng, address: "" })
        })
    },
  })
  useEffect(() => {
    if (value) {
      setMarkerPos(value)
    }
  }, [value])
  // Drag marker within radius
  return markerPos ? (
    <Marker
      position={[markerPos.lat, markerPos.lng]}
      icon={markerIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng()
          const dist = map.distance([center.lat, center.lng], [lat, lng])
          if (dist > radius) {
            // Snap back to previous position if out of bounds
            e.target.setLatLng([markerPos.lat, markerPos.lng])
            return
          }
          setMarkerPos({ lat, lng })
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
            .then((r) => r.json())
            .then((data) => {
              onChange({ lat, lng, address: data.display_name })
            })
            .catch(() => {
              onChange({ lat, lng, address: "" })
            })
        },
      }}
    />
  ) : null
}

export default function MapPicker({ center, value, radius = 5000, onChange }) {
  if (!center.lat || !center.lng) return null
  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-blue-200 mb-2">
      <MapContainer center={[center.lat, center.lng]} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Circle center={[center.lat, center.lng]} radius={radius} pathOptions={{ color: "#2563eb", fillOpacity: 0.1 }} />
        <LocationPicker center={center} value={value} radius={radius} onChange={onChange} />
      </MapContainer>
      <div className="text-xs text-gray-500 mt-1 px-2">Tap or drag the marker within the blue circle (5km) to select the room location.</div>
    </div>
  )
}