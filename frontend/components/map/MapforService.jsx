import { useState, useEffect } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  Circle,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

export default function MapService({ onChange }) {
  const [position, setPosition] = useState(null);
  const [radius, setRadius] = useState(5);
  const [error, setError] = useState(null);
  const zoom = 10;

  // Default center to prevent "jump to London"
  const defaultCenter = [20, 0]; // roughly central on the world map

  // Fetch user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        console.log("✅ Got position:", latitude, longitude);
        setPosition([latitude, longitude]);
        setError(null);
      },
      (err) => {
        console.error("❌ Error fetching location:", err);
        if (err.code === 1) {
          setError("Location access denied. Please allow location permissions.");
        } else if (err.code === 2) {
          setError("Position unavailable. Try again later.");
        } else if (err.code === 3) {
          setError("Location request timed out.");
        } else {
          setError("Unable to retrieve your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Notify parent when position or radius changes
  useEffect(() => {
    if (onChange && position) {
      onChange({ latitude: position[0], longitude: position[1], radius });
    }
  }, [position, radius]);

  return (
    <div className="flex flex-col gap-4">
      <div className="h-[380px] border border-gray-200 rounded-[4px] overflow-hidden bg-gray-50">
        {error ? (
          <div className="h-full flex items-center justify-center text-red-500 text-sm text-center px-4">
            {error}
          </div>
        ) : position ? (
          <MapContainer
            center={position || defaultCenter}
            zoom={zoom}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Marker position={position}>
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                You are here
              </Tooltip>
            </Marker>
            <Circle
              center={position}
              radius={radius * 1000}
              pathOptions={{
                color: "#22c55e",
                fillColor: "#22c55e",
                fillOpacity: 0.1,
              }}
            />
          </MapContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            Fetching current location…
          </div>
        )}
      </div>

      {/* Radius control */}
      <div className="flex items-center justify-between gap-2 border border-gray-200 rounded-[4px] p-3 bg-white">
        <label className="font-medium text-sm text-gray-700 whitespace-nowrap">
          Service Radius
        </label>
        <input
          type="range"
          min="5"
          max="50"
          step="5"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="flex-1 accent-green-500 cursor-pointer"
        />
        <span className="w-10 text-center text-sm text-gray-800">
          {radius} km
        </span>
      </div>
    </div>
  );
}
