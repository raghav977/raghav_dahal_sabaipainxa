"use client"
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

// Lazy load Leaflet map component to avoid SSR issues
const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

export default function UserProfile(){
  const [userId, setUserId] = useState(1);
  const [profile, setProfile] = useState({ name: '', position: '', skills: '', resume_url: '' });
  const [jobTitles, setJobTitles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(()=>{
    loadProfile();
    loadJobTitles();
    loadLocations();
  }, [userId]);

  const loadProfile = () => {
    try {
      const stored = localStorage.getItem('job_profile');
      if(stored) setProfile(JSON.parse(stored));
    } catch (err) {}
  }

  const loadJobTitles = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/jobs?limit=1000`);
      const body = await res.json();
      const titles = (body.results || []).map(j => ({ id: j.id, title: j.title }));
      setJobTitles(titles);
    } catch (err) {
      console.error(err);
    }
  }

  const loadLocations = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/users/locations?userId=${userId}`);
      const body = await res.json();
      setLocations(body.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  const saveProfile = () => {
    localStorage.setItem('job_profile', JSON.stringify(profile));
    setMessage('✓ Profile saved');
    setTimeout(()=>setMessage(null), 2000);
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">My Job Profile</h2>
        
        <div className="space-y-3">
          <div>
            <label className="block font-medium text-sm">User ID</label>
            <input type="number" value={userId} onChange={(e)=>setUserId(parseInt(e.target.value))} className="w-full border px-2 py-1 rounded" />
          </div>

          <div>
            <label className="block font-medium text-sm">Full Name</label>
            <input type="text" value={profile.name} onChange={(e)=>setProfile({...profile, name: e.target.value})} className="w-full border px-2 py-1 rounded" />
          </div>

          <div>
            <label className="block font-medium text-sm">Position (Select from available job titles)</label>
            <select value={profile.position} onChange={(e)=>setProfile({...profile, position: e.target.value})} className="w-full border px-2 py-1 rounded">
              <option value="">— Select position —</option>
              {jobTitles.map(jt => (
                <option key={jt.id} value={jt.title}>{jt.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-sm">Skills (comma separated)</label>
            <input type="text" value={profile.skills} onChange={(e)=>setProfile({...profile, skills: e.target.value})} placeholder="e.g., React, Node.js, TypeScript" className="w-full border px-2 py-1 rounded" />
          </div>

          <div>
            <label className="block font-medium text-sm">Resume/CV URL</label>
            <input type="url" value={profile.resume_url} onChange={(e)=>setProfile({...profile, resume_url: e.target.value})} placeholder="https://..." className="w-full border px-2 py-1 rounded" />
          </div>

          <button onClick={saveProfile} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Save Profile</button>
          {message && <div className="text-sm">{message}</div>}
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Availability Locations</h3>
        <MapComponent userId={userId} locations={locations} onLocationsUpdate={loadLocations} />
      </div>
    </div>
  )
}
