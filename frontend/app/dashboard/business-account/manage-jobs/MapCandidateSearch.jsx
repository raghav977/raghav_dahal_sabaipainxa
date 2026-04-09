"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

// Import leaflet components dynamically
const MapContainerComponent = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayerComponent = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const MarkerComponent = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const PopupComponent = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });
const CircleComponent = dynamic(() => import("react-leaflet").then(m => m.Circle), { ssr: false });

export default function MapCandidateSearch() {
  const [center, setCenter] = useState({ lat: 27.7172, lng: 85.324 });
  const [radius, setRadius] = useState(5);
  const [candidates, setCandidates] = useState([]);
  const [searchPoint, setSearchPoint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const mapRef = useRef(null);

  // Search candidates
  const handleSearch = async (lat, lng) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${BASE_URL}/api/users/search-candidates`);
      url.searchParams.set("latitude", lat);
      url.searchParams.set("longitude", lng);
      url.searchParams.set("radius", radius);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch candidates");
      
      const body = await res.json();
      setCandidates(body.data?.data || body.data || []);
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const manualSearch = () => {
    if (!center.lat || !center.lng) return alert("Please set a search point");
    setSearchPoint({ lat: center.lat, lng: center.lng });
    handleSearch(center.lat, center.lng);
  };

  // Setup map click listener after map loads
  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    try {
      const map = mapRef.current;
      
      const handleMapClick = (e) => {
        const { lat, lng } = e.latlng;
        setSearchPoint({ lat, lng });
        handleSearch(lat, lng);
      };

      map.on("click", handleMapClick);

      return () => {
        map.off("click", handleMapClick);
      };
    } catch (err) {
      console.error("Error setting up map click:", err);
    }
  }, []);

  return (
    <div className="mt-6 bg-white p-4 rounded border">
      <h3 className="text-lg font-semibold mb-4">🗺️ Search Candidates by Location</h3>

      {/* Search Controls */}
      <div className="mb-4 flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-sm font-medium">Latitude</label>
          <input
            type="number"
            step="0.0001"
            value={center.lat}
            onChange={(e) => setCenter({ ...center, lat: parseFloat(e.target.value) || 0 })}
            className="border px-2 py-1 rounded w-32"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Longitude</label>
          <input
            type="number"
            step="0.0001"
            value={center.lng}
            onChange={(e) => setCenter({ ...center, lng: parseFloat(e.target.value) || 0 })}
            className="border px-2 py-1 rounded w-32"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Radius (km)</label>
          <input
            type="number"
            min="1"
            max="100"
            value={radius}
            onChange={(e) => setRadius(parseFloat(e.target.value) || 5)}
            className="border px-2 py-1 rounded w-24"
          />
        </div>
        <button
          onClick={manualSearch}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
        >
          Search
        </button>
      </div>

      {/* Map Container */}
      <div 
        className="mb-4 rounded border overflow-hidden bg-gray-100 relative" 
        style={{ height: "400px" }}
      >
        {typeof window !== "undefined" && (
          <MapContainerComponent
            center={[center.lat, center.lng]}
            zoom={13}
            style={{ height: "100%", width: "100%", zIndex: 1 }}
            ref={mapRef}
          >
            <TileLayerComponent
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            />

            {/* Search radius circle */}
            {searchPoint && (
              <CircleComponent
                center={[searchPoint.lat, searchPoint.lng]}
                radius={radius * 1000}
                pathOptions={{ color: "blue", fillColor: "lightblue", fillOpacity: 0.2 }}
              />
            )}

            {/* Candidate markers */}
            {candidates.map((candidate) => (
              <MarkerComponent
                key={candidate.user_id}
                position={[candidate.latitude || 27.7, candidate.longitude || 85.3]}
                title={candidate.name}
              >
                <PopupComponent>
                  <div className="w-48">
                    <img
                      src={candidate.profile_picture || "/images/default-profile.jpg"}
                      alt={candidate.name}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                    <h4 className="font-semibold">{candidate.name}</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Distance:</strong> {(candidate.distance_km || 0).toFixed(2)} km
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Availability:</strong> {candidate.availability || "Not specified"}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Contact:</strong> {candidate.phone_number || candidate.email || "N/A"}
                    </p>
                    <a
                      href={`/dashboard/business-account/manage-jobs/profile/${candidate.user_id}`}
                      className="text-blue-600 hover:underline text-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Full Profile →
                    </a>
                  </div>
                </PopupComponent>
              </MarkerComponent>
            ))}
          </MapContainerComponent>
        )}
      </div>

      {/* Info message */}
      <p className="text-sm text-gray-600 mb-3">
        💡 Click on the map to search for candidates in that area, or use the manual search controls above.
      </p>

      {/* Loading & Error */}
      {loading && <div className="text-blue-600 mb-3">🔍 Searching for candidates...</div>}
      {error && <div className="text-red-600 mb-3">❌ {error}</div>}

      {/* Results List */}
      {candidates.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">
            Found {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {candidates.map((candidate) => (
              <div
                key={candidate.user_id}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 transition ${
                  selectedCandidate?.user_id === candidate.user_id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
                onClick={() => setSelectedCandidate(candidate)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={candidate.profile_picture || "/images/default-profile.jpg"}
                    alt={candidate.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{candidate.name}</h5>
                    <p className="text-xs text-gray-600">
                      {(candidate.distance_km || 0).toFixed(2)} km away
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  <p>📍 {candidate.address || "Location not specified"}</p>
                  <p>⏰ {candidate.availability || "Not specified"}</p>
                </div>
                <a
                  href={`/dashboard/business-account/manage-jobs/profile/${candidate.user_id}`}
                  className="text-blue-600 hover:underline text-xs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Profile →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && candidates.length === 0 && searchPoint && (
        <div className="text-center text-gray-600 py-8">
          <p>No candidates found in the selected radius.</p>
          <p className="text-sm mt-1">Try increasing the radius or moving to a different location.</p>
        </div>
      )}

      {!loading && candidates.length === 0 && !searchPoint && (
        <div className="text-center text-gray-600 py-8">
          <p>Click on the map or use the search button to find candidates.</p>
        </div>
      )}
    </div>
  );
}
