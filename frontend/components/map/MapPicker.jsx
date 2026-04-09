"use client";

import { useState, useEffect } from "react";

export default function MapPicker({ value = { lat: null, lng: null, address: "" }, onChange }) {
  const [address, setAddress] = useState(value.address || "");
  const [lat, setLat] = useState(value.lat || "");
  const [lng, setLng] = useState(value.lng || "");

  useEffect(() => {
    onChange && onChange({ lat: lat || null, lng: lng || null, address });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, address]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude.toString());
      setLng(pos.coords.longitude.toString());
      setAddress(`My location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} className="rounded-md border px-2 py-1 w-1/2" />
        <input placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} className="rounded-md border px-2 py-1 w-1/2" />
      </div>
      <input placeholder="Address / Label" value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-md border px-2 py-1 w-full" />
      <div className="flex gap-2">
        <button type="button" onClick={useMyLocation} className="px-3 py-1 rounded-md border bg-white">Use my location</button>
        {lat && lng && (
          <a className="px-3 py-1 rounded-md bg-emerald-600 text-white" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}>
            Open in Maps
          </a>
        )}
      </div>
    </div>
  );
}
