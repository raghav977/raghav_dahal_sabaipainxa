"use client"
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function MapComponent({ userId, locations, onLocationsUpdate }){
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [availableAnywhere, setAvailableAnywhere] = useState(false);
  const [newLoc, setNewLoc] = useState({ lat: 27.7060, lng: 85.3300, address: 'Kathmandu', availability: 'full-time', radius: 10 });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(()=>{
    if (!mapRef.current) return;
    
    // Initialize map
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([27.7060, 85.3300], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(mapInstance.current);

      // Click to place marker
      mapInstance.current.on('click', (e) => {
        setNewLoc({...newLoc, lat: e.latlng.lat, lng: e.latlng.lng});
      });
    }

    // Clear old markers
    markersRef.current.forEach(m => mapInstance.current.removeLayer(m));
    markersRef.current = [];

    // Add location markers
    locations.forEach(loc => {
      const marker = L.marker([loc.latitude, loc.longitude]).addTo(mapInstance.current);
      const circle = L.circle([loc.latitude, loc.longitude], { radius: loc.radius_km * 1000 }).addTo(mapInstance.current);
      marker.bindPopup(`<b>${loc.address || 'Location'}</b><br/>Availability: ${loc.availability}<br/>Radius: ${loc.radius_km}km`);
      markersRef.current.push(marker, circle);
    });
  }, [locations, mapRef]);

  const addLocation = async () => {
    if (availableAnywhere) {
      // Save "available anywhere" as a special location with unlimited radius
      setAdding(true);
      setMsg(null);
      try {
        const res = await fetch(`${BASE_URL}/api/users/locations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: userId, 
            lat: 0, 
            lng: 0, 
            address: 'Available Anywhere', 
            availability: newLoc.availability, 
            radius_km: 9999 // virtual unlimited radius
          })
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.message || 'Failed');
        setMsg('✓ You are now available anywhere');
        onLocationsUpdate();
        setAvailableAnywhere(false);
      } catch (err) {
        console.error(err);
        setMsg('✗ ' + err.message);
      } finally {
        setAdding(false);
      }
    } else {
      // Normal location-based availability
      if (!newLoc.lat || !newLoc.lng) return setMsg('Pick a location on map');
      setAdding(true);
      setMsg(null);
      try {
        const res = await fetch(`${BASE_URL}/api/users/locations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, ...newLoc })
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.message || 'Failed');
        setMsg('✓ Location added');
        onLocationsUpdate();
        setNewLoc({...newLoc, address: ''});
      } catch (err) {
        console.error(err);
        setMsg('✗ ' + err.message);
      } finally {
        setAdding(false);
      }
    }
  }

  const deleteLocation = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/api/users/locations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setMsg('✓ Location deleted');
      onLocationsUpdate();
    } catch (err) {
      console.error(err);
      setMsg('✗ ' + err.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 rounded h-96" ref={mapRef} style={{height: '400px'}} />
      
      <div className="border p-4 rounded">
        <h4 className="font-semibold mb-3">Add Availability Location</h4>
        
        {/* Available Anywhere Option */}
        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={availableAnywhere} 
              onChange={(e) => setAvailableAnywhere(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="font-medium text-blue-900">I'm available anywhere (no location required)</span>
          </label>
          <p className="text-sm text-blue-700 mt-1 ml-6">Skip location selection and mark yourself as available nationwide</p>
        </div>

        {/* Location-based availability */}
        {!availableAnywhere && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-2">Click on the map above or enter coordinates below</p>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="0.001" value={newLoc.lat} onChange={(e)=>setNewLoc({...newLoc, lat: parseFloat(e.target.value)})} placeholder="Latitude" className="border px-2 py-1 rounded text-sm" />
              <input type="number" step="0.001" value={newLoc.lng} onChange={(e)=>setNewLoc({...newLoc, lng: parseFloat(e.target.value)})} placeholder="Longitude" className="border px-2 py-1 rounded text-sm" />
            </div>
            <input type="text" value={newLoc.address} onChange={(e)=>setNewLoc({...newLoc, address: e.target.value})} placeholder="Address" className="w-full border px-2 py-1 rounded text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <select value={newLoc.availability} onChange={(e)=>setNewLoc({...newLoc, availability: e.target.value})} className="border px-2 py-1 rounded text-sm">
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="remote">Remote</option>
              </select>
              <input type="number" value={newLoc.radius} onChange={(e)=>setNewLoc({...newLoc, radius: parseFloat(e.target.value)})} placeholder="Radius (km)" className="border px-2 py-1 rounded text-sm" />
            </div>
          </div>
        )}

        {/* Availability type selector (shown when available anywhere) */}
        {availableAnywhere && (
          <div className="mb-3">
            <label className="text-sm font-medium block mb-1">Employment Type</label>
            <select value={newLoc.availability} onChange={(e)=>setNewLoc({...newLoc, availability: e.target.value})} className="w-full border px-2 py-1 rounded text-sm">
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="remote">Remote</option>
            </select>
          </div>
        )}

        <button onClick={addLocation} disabled={adding} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded disabled:opacity-50">
          {adding ? 'Adding...' : availableAnywhere ? 'Mark as Available Everywhere' : 'Add Location'}
        </button>
        {msg && <div className="text-sm mt-2">{msg}</div>}
      </div>

      <div>
        <h4 className="font-semibold mb-2">Your Availability Areas</h4>
        <div className="space-y-2">
          {locations.length === 0 ? (
            <p className="text-gray-600">No locations added yet</p>
          ) : (
            locations.map(loc => (
              <div key={loc.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                <span>{loc.address || `(${loc.latitude}, ${loc.longitude})`} • {loc.availability} • {loc.radius_km}km</span>
                <button onClick={() => deleteLocation(loc.id)} className="text-red-600 hover:underline">Delete</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
