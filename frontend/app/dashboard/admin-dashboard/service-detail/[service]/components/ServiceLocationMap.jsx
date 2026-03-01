"use client";

import { useState, useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

export default function AdminServiceLocationMap({ locations }) {
  // store radii for each location separately
  const [radii, setRadii] = useState([]);

  useEffect(() => {
    if (locations && Array.isArray(locations)) {
        console.log("Service Locations:", locations);
      setRadii(locations.map((loc) => loc.radius || 5)); 
    }
  }, []);

  if (!locations || locations.length === 0) return null;

  const first = locations[0];
  const defaultLat = parseFloat(first.latitude) || 0;
  const defaultLon = parseFloat(first.longitude) || 0;

  const handleRadiusChange = (index, value) => {
    setRadii((prev) => {
      const newRadii = [...prev];
      newRadii[index] = value;
      return newRadii;
    });
  };

  return (
    <div className="space-y-4">
      {/* Map Info */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-[4px]">
        Service coverage areas are shown with blue circles. Current radius: <span className="font-medium text-gray-900">{radii[0]} km</span>
      </div>
      
      {/* Map Container - Fixed Height */}
      <div className="relative">
        <div className="h-[300px] w-full rounded-[4px] overflow-hidden border border-gray-200">
          <MapContainer
            center={[defaultLat, defaultLon]}
            zoom={10}
            scrollWheelZoom={true}
            style={{ height: '300px', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {locations.map((loc, idx) => {
              const lat = parseFloat(loc.latitude);
              const lon = parseFloat(loc.longitude);
              const radius = (radii[idx] || 5) * 1000; // km → meters

              if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

              return (
                <div key={idx}>
                  <Marker position={[lat, lon]}>
                    <Popup>
                      <div className="space-y-1">
                        <strong>{loc.address || "No Address"}</strong>
                        <div>Lat: {lat.toFixed(5)}, Lon: {lon.toFixed(5)}</div>
                        <div>Radius: {(radius / 1000).toFixed(1)} km</div>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={[lat, lon]}
                    radius={radius}
                    pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.1 }}
                  />
                </div>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Radius Controls */}
      {locations.map((loc, idx) => (
        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-[4px]">
          <label className="text-sm font-medium text-gray-700 flex-1">
            {loc.address || `Location ${idx + 1}`} Radius:
          </label>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={radii[idx]}
            onChange={(e) => handleRadiusChange(idx, Number(e.target.value))}
            className="flex-1 accent-green-600"
          />
          <span className="w-12 text-center text-sm font-medium text-gray-900">
            {radii[idx]} km
          </span>
        </div>
      ))}
    </div>
  );
}
