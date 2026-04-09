"use client"
import { useState } from "react";
import MapPicker from "../../../../components/map/MapPicker";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export default function MapSearch(){
  const [point, setPoint] = useState({lat: null, lng: null, address: ''});
  const [radius, setRadius] = useState(5);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (p) => setPoint(p);

  const doSearch = async () => {
    if(!point.lat || !point.lng) return alert('Pick a point first');
    setLoading(true); setError(null);
    try{
      const url = new URL(`${BASE_URL}/api/users/nearby`);
      url.searchParams.set('latitude', point.lat);
      url.searchParams.set('longitude', point.lng);
      url.searchParams.set('radius', radius);
      const res = await fetch(url.toString());
      if(!res.ok) throw new Error('Failed to fetch nearby users');
      const body = await res.json();
      setResults(body.data?.data || body.data || []);
    } catch(err){
      console.error(err);
      setError(err.message || 'Search failed');
    } finally{ setLoading(false); }
  }

  return (
    <div className="mt-6 bg-white p-4 rounded border">
      <h4 className="font-semibold">Map Search (Find nearby candidates)</h4>
      <div className="mt-2">
        <MapPicker onChange={onChange} />
      </div>
      <div className="mt-2 flex gap-2 items-center">
        <label className="text-sm">Radius (km)</label>
        <input type="number" value={radius} onChange={(e)=>setRadius(e.target.value)} className="border px-2 py-1 rounded w-24" />
        <button onClick={doSearch} className="bg-green-600 text-white px-3 py-1 rounded">Search</button>
      </div>

      {loading && <div className="mt-2">Searching...</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}

      <div className="mt-4 grid grid-cols-1 gap-3">
        {results.map(u => (
          <div key={u.user_id} className="p-3 border rounded">
            <div className="flex items-center gap-3">
              <img src={u.profile_picture || '/images/default-profile.jpg'} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <div className="font-semibold">{u.name || 'No name'}</div>
                <div className="text-sm text-gray-600">Distance: {Number(u.distance_km).toFixed(2)} km</div>
                <div className="text-sm text-gray-600">Availability: {u.availability}</div>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <a href={`/dashboard/business-account/manage-jobs/profile/${u.user_id}`} className="text-green-600">Open profile</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
