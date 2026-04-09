"use client"
import Link from "next/link";
import { useEffect, useState } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export default function JobsList({ isBusinessOwner = false }){
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchJobs = async (q = search, p = page) => {
    setLoading(true);
    setError(null);
    try{
      const url = new URL(`${BASE_URL}/api/jobs`);
      url.searchParams.set('limit', limit);
      url.searchParams.set('offset', (p-1)*limit);
      if(q) url.searchParams.set('search', q);

      const res = await fetch(url.toString());
      if(!res.ok){
        const body = await res.json().catch(()=>({}));
        throw new Error(body?.message || `Failed to load jobs (${res.status})`);
      }
      const body = await res.json();
      setJobs(body.results || body.data || []);
      setTotal(body.total || 0);
    } catch(err){
      console.error(err);
      setError(err.message || 'Failed to fetch jobs');
    } finally{
      setLoading(false);
    }
  }

  useEffect(()=>{ fetchJobs(); }, []);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs(search, 1);
  }

  const nextPage = () => {
    if(page * limit >= total) return;
    const np = page + 1;
    setPage(np);
    fetchJobs(search, np);
  }
  const prevPage = () => {
    if(page <= 1) return;
    const np = page - 1;
    setPage(np);
    fetchJobs(search, np);
  }

  return (
    <div className="mt-6 w-full">
      <form onSubmit={onSearch} className="flex gap-2 mb-4">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Search jobs by title or description"
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded">Search</button>
      </form>

      {loading && <div>Loading jobs...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && jobs.length === 0 && (
        <div className="text-gray-600">No jobs found.</div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {jobs.map(job => (
          <div key={job.id} className="border rounded p-4 bg-white hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{job.title}</h3>
                <p className="text-sm text-gray-600">{job.department || '—'}</p>
                <p className="mt-2 text-gray-700">{job.description ? job.description.slice(0,150) : 'No description'}</p>
                <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                  <span>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {job.status || 'open'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Link href={`/find-jobs/${job.id}`} className="text-blue-600 hover:underline text-sm">View Details</Link>
              {isBusinessOwner && (
                <>
                  <button className="text-blue-600 hover:underline text-sm">Edit</button>
                  <select defaultValue="open" className="text-sm border px-2 py-0 rounded">
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="draft">Draft</option>
                  </select>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button onClick={prevPage} className="px-3 py-1 bg-gray-200 rounded" disabled={page<=1}>Prev</button>
        <span>Page {page} — {total} total</span>
        <button onClick={nextPage} className="px-3 py-1 bg-gray-200 rounded" disabled={page*limit >= total}>Next</button>
      </div>
    </div>
  )
}
