"use client";

import { useState } from "react";
import MapService from "@/components/map/MapforService";
import { Button } from "@/components/ui/button";

export function LocationPicker({ customerLocation, setFilters }) {
  const [showMap, setShowMap] = useState(false);

  const handleMapToggle = () => setShowMap((prev) => !prev);

  const handleLocationChange = ({ latitude, longitude, radius }) => {
    setFilters((prev) => ({
      ...prev,
      location: { latitude, longitude },
      radius,
    }));
  };

  return (
    <div className="p-4 border border-gray-200 rounded-[4px] bg-white">
      <h2 className="text-base font-medium text-gray-800 mb-3">
        Your Location
      </h2>

      {customerLocation ? (
        <p className="text-sm text-gray-700 mb-3">
          Latitude:{" "}
          <span className="font-mono text-gray-800">{customerLocation.latitude.toFixed(4)}</span>, 
          Longitude:{" "}
          <span className="font-mono text-gray-800">{customerLocation.longitude.toFixed(4)}</span>
        </p>
      ) : (
        <p className="text-sm text-gray-500 mb-3">
          Location not available. Please enable location services.
        </p>
      )}

      <Button
        variant="outline"
        className="rounded-[4px] text-sm font-medium border border-gray-300 hover:bg-gray-100 transition"
        onClick={handleMapToggle}
      >
        {showMap ? "Hide Map" : "Filter by Location"}
      </Button>

      {showMap && customerLocation && (
        <div className="mt-4 h-64">
          <MapService
            center={{
              lat: customerLocation.latitude,
              lng: customerLocation.longitude,
            }}
            onChange={handleLocationChange} 
             maxRadius={500} 
          />
        </div>
      )}
    </div>
  );
}
