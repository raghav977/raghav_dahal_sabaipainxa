"use client"
import { useEffect, useState } from "react";
import AvailabilityManager from "../dashboard/business-account/manage-jobs/AvailabilityManager";

export default function ProfileEditor(){
  const [profile, setProfile] = useState({ name: '', skills: '', resumeUrl: '' });
  const [message, setMessage] = useState(null);

  useEffect(()=>{
    try{
      const stored = localStorage.getItem('job_profile');
      if(stored) setProfile(JSON.parse(stored));
    }catch(err){}
  },[])

  const saveLocal = () => {
    localStorage.setItem('job_profile', JSON.stringify(profile));
    setMessage('Profile saved locally');
    setTimeout(()=>setMessage(null), 2500);
  }

  const attemptServerSave = async () => {
    // This attempts to save to server if token is present; currently most server endpoints expect auth.
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if(!token) return setMessage('No auth token found. Log in to sync with server.');
    try{
      const res = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: profile.name, skills: profile.skills, resume_url: profile.resumeUrl })
      });
      const body = await res.json();
      if(!res.ok) throw new Error(body?.message || 'Failed to save');
      setMessage('Profile synced to server');
    }catch(err){
      console.error(err);
      setMessage(err.message || 'Failed to sync');
    }
    setTimeout(()=>setMessage(null), 3000);
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
      <h3 className="text-lg font-semibold mb-3">Your Job Profile</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm">Name</label>
          <input className="w-full border px-2 py-1 rounded" value={profile.name} onChange={(e)=>setProfile({...profile, name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Skills (comma separated)</label>
          <input className="w-full border px-2 py-1 rounded" value={profile.skills} onChange={(e)=>setProfile({...profile, skills: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Resume / CV URL</label>
          <input className="w-full border px-2 py-1 rounded" value={profile.resumeUrl} onChange={(e)=>setProfile({...profile, resumeUrl: e.target.value})} />
        </div>
        <div className="flex gap-2">
          <button onClick={saveLocal} className="bg-green-600 text-white px-3 py-1 rounded">Save locally</button>
          <button onClick={attemptServerSave} className="bg-blue-600 text-white px-3 py-1 rounded">Sync to server (requires login)</button>
        </div>
        {message && <div className="text-sm text-gray-700">{message}</div>}
      </div>

      <div className="mt-6">
        <h4 className="font-medium mb-2">Manage availability</h4>
        <AvailabilityManager />
      </div>
    </div>
  )
}
