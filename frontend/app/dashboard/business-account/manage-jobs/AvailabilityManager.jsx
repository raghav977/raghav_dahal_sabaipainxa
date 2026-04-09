"use client"
import { useState } from "react";
import MapPicker from "../../../../components/map/MapPicker";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export default function AvailabilityManager(){
  const [userId, setUserId] = useState(1);
  const [point, setPoint] = useState({lat: null, lng: null, address: ''});
  const [availability, setAvailability] = useState('full-time');
  const [radius, setRadius] = useState(10);
  const [message, setMessage] = useState(null);

  const onChange = (p) => setPoint(p);

  const save = async () => {
    if(!userId || !point.lat || !point.lng) return alert('userId and location required');
    try{
      const res = await fetch(`${BASE_URL}/api/users/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, address: point.address, latitude: point.lat, longitude: point.lng, availability, radius_km: radius })
      });
      const body = await res.json();
      if(!res.ok) throw new Error(body?.message || 'Failed');
      setMessage('Location saved');
    } catch(err){
      console.error(err);
      setMessage(err.message || 'Failed');
    }
  }

  return (
    <div className="mt-6 bg-white p-4 rounded border">
      <h4 className="font-semibold">Availability Manager (test tool)</h4>
      <div className="mt-2">
        <label className="block text-sm">User ID (for now)</label>
        <input type="number" value={userId} onChange={(e)=>setUserId(e.target.value)} className="border px-2 py-1 rounded w-32" />
      </div>
      <div className="mt-2">
        <MapPicker onChange={onChange} />
      </div>
      <div className="mt-2 flex gap-2 items-center">
        <select value={availability} onChange={(e)=>setAvailability(e.target.value)} className="border px-2 py-1 rounded">
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="remote">Remote</option>
        </select>
        <input type="number" value={radius} onChange={(e)=>setRadius(e.target.value)} className="border px-2 py-1 rounded w-24" />
        <button onClick={save} className="bg-green-600 text-white px-3 py-1 rounded">Save</button>
      </div>
      {message && <div className="mt-2 text-sm">{message}</div>}
    </div>
  )
}
