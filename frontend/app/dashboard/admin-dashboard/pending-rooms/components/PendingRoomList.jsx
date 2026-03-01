"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, AlertCircle } from "lucide-react";
import { FaHome } from "react-icons/fa";
import PendingRoomModal from "./PendingRoomModal";
import { useRouter } from "next/navigation";

import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "../../../../../helper/token";

// Support both env names used across the repo, with a sensible fallback
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";


export default function RoomVerificationDashboard() {
  const token = getTokenFromLocalStorage("token");
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  // treat this page as Manage Rooms: default to all
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewRoom, setViewRoom] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ totalRooms: 0, pendingRooms: 0, approvedRooms: 0, rejectedRooms: 0, availableRooms: 0, bookedRooms: 0 });
  const limit = 10;
  // per-room loading state: { [roomId]: 'approving' | 'rejecting' }
  const [loadingActions, setLoadingActions] = useState({});

  const fetchControllerRef = useRef(null);

  const fetchRooms = useCallback(async (pageToFetch = 1, status = "", search = "") => {
    setLoading(true);
    try {
      // Cancel any in-flight request
      try { if (fetchControllerRef.current) fetchControllerRef.current.abort(); } catch (e) {}
      const controller = new AbortController();
      fetchControllerRef.current = controller;

      const offset = (pageToFetch - 1) * limit;
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const url = `${BASE_URL}/api/admin/room-verification/status?${params.toString()}`;
      const res = await fetch(url, {
        headers: {
          authorization: `Bearer ${token}`,
          "x-refresh-token": refreshToken,
        },
        signal: controller.signal,
      });
      const json = await res.json().catch(() => ({}));
      const list = Array.isArray(json?.results) ? json.results : json?.data?.results ?? [];
      const totalCount = Number(json?.total ?? json?.data?.total ?? json?.count ?? list.length);
      setRooms(list || []);
      setTotal(totalCount);
    } catch (e) {
      if (e?.name !== "AbortError") {
        console.error("fetchRooms error", e);
        setRooms([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
      // clear controller if it's the one we created
      try { fetchControllerRef.current = null; } catch (e) {}
    }
  }, [limit, token, refreshToken]);

  const handleViewRoom = (room)=>{
    // navigate to room detail page for management
    try {
      const id = room.roomId || room.serviceId || room.id;
      router.push(`/dashboard/admin-dashboard/rooms/${id}`);
    } catch (err) {
      console.error("navigation error", err);
    }
  }
  async function fetchCounts() {
    try {
      const url = `${BASE_URL}/api/admin/dashboard/rooms`;
      const res = await fetch(url, { 
        headers:{
          'authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        }
       });
      const json = await res.json();
      const d = json?.data || {};
      setCounts({
        totalRooms: Number(d.totalRooms ?? d.total ?? 0),
        pendingRooms: Number(d.pendingRooms ?? d.pending ?? 0),
        approvedRooms: Number(d.approvedRooms ?? d.approved ?? 0),
        rejectedRooms: Number(d.rejectedRooms ?? d.rejected ?? 0),
        availableRooms: Number(d.availableRooms ?? 0),
        bookedRooms: Number(d.bookedRooms ?? 0),
      });
    } catch (e) {
      console.error("fetchCounts error", e);
    }
  }

  // whenever statusFilter, page or debounced search change, reload
  useEffect(() => {
    setPage((p) => p || 1);
    fetchRooms(page, statusFilter, debouncedSearch);
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page, debouncedSearch]);

  // debounce searchTerm -> debouncedSearch
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // apply local filtering as a safety; server-side search is used when available
  const filteredRooms = useMemo(() => {
    if (!debouncedSearch) return rooms;
    const q = debouncedSearch.toLowerCase();
    return rooms.filter((r) =>
      (r.roomname || "").toLowerCase().includes(q) ||
      (r.gharbetiname || "").toLowerCase().includes(q) ||
      (r.contact || "").toLowerCase().includes(q)
    );
  }, [rooms, debouncedSearch]);

  const handleApprove = useCallback(async (room) => {
    const id = room.serviceId || room.roomId || room.id;
    if (!id) return alert("Invalid room id");
    if (!confirm("Approve this room?")) return;
    setLoadingActions((p) => ({ ...p, [id]: "approving" }));
    try {
      const res = await fetch(`${BASE_URL}/api/admin/room-verification/approve/${id}`, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "x-refresh-token": refreshToken,
        },
      });
      if (!res.ok) throw new Error("approve failed");
      await fetchRooms(page, statusFilter, debouncedSearch);
      await fetchCounts();
    } catch (e) {
      console.error(e);
      alert("Failed to approve");
    } finally {
      setLoadingActions((p) => {
        const copy = { ...p };
        delete copy[id];
        return copy;
      });
    }
  }, [page, statusFilter, debouncedSearch, fetchRooms, fetchCounts, token, refreshToken]);

  const handleReject = useCallback(async (room) => {
    const id = room.serviceId || room.roomId || room.id;
    if (!id) return alert("Invalid room id");
    const reason = prompt("Rejection reason:", "");
    if (!reason) return;
    setLoadingActions((p) => ({ ...p, [id]: "rejecting" }));
    try {
      const res = await fetch(`${BASE_URL}/api/admin/room-verification/reject/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${token}`, "x-refresh-token": refreshToken },
        body: JSON.stringify({ rejection_reason: reason }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "reject failed");
      }
      await fetchRooms(page, statusFilter, debouncedSearch);
      await fetchCounts();
    } catch (e) {
      console.error(e);
      alert("Failed to reject");
    } finally {
      setLoadingActions((p) => {
        const copy = { ...p };
        delete copy[id];
        return copy;
      });
    }
  }, [page, statusFilter, debouncedSearch, fetchRooms, fetchCounts, token, refreshToken]);

  const totalPages = Math.max(1, Math.ceil((total || rooms.length) / limit));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaHome className="w-6 h-6 text-green-600" />
            Manage Rooms
          </h1>
          <p className="text-sm text-gray-500 mt-1">View and manage room listings (All / Pending / Approved / Rejected)</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search room, gharbeti or contact"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="flex-1 border rounded-[4px] px-3 py-2 text-sm focus:ring-0 outline-none w-64"
            aria-label="Search rooms"
          />
          <button onClick={() => { setSearchTerm(""); setDebouncedSearch(""); setPage(1); fetchRooms(1, statusFilter, ""); }} className="px-4 py-2 bg-white border rounded-[4px] text-sm text-gray-700 hover:bg-gray-50">Reset</button>
          <button onClick={() => fetchRooms(page, statusFilter, debouncedSearch)} className="px-4 py-2 bg-green-600 text-white rounded-[4px] text-sm hover:bg-green-700">Refresh</button>
        </div>
      </div>
      {/* Stats Cards */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
        <button onClick={() => { setStatusFilter(''); setPage(1); }} className="bg-white border border-gray-200 rounded-[4px] p-4 text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Rooms</p>
              <p className="text-2xl font-bold text-gray-900">{counts.totalRooms}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-[4px] flex items-center justify-center">
              <FaHome className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </button>

        <button onClick={() => { setStatusFilter('pending'); setPage(1); }} className="bg-white border border-gray-200 rounded-[4px] p-4 text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{counts.pendingRooms}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-[4px] flex items-center justify-center">
              <FaHome className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </button>

        <button onClick={() => { setStatusFilter('approved'); setPage(1); }} className="bg-white border border-gray-200 rounded-[4px] p-4 text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">{counts.approvedRooms}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-[4px] flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </button>

        <button onClick={() => { setStatusFilter('rejected'); setPage(1); }} className="bg-white border border-gray-200 rounded-[4px] p-4 text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{counts.rejectedRooms}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-[4px] flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: '', label: 'All' , value: '' },
          { key: 'pending', label: 'Pending', value: 'pending' },
          { key: 'approved', label: 'Approved', value: 'approved' },
          { key: 'rejected', label: 'Rejected', value: 'rejected' },
        ].map((st) => (
          <button
            key={st.label}
            onClick={() => { setStatusFilter(st.value); setPage(1); }}
            className={`px-3 py-1 rounded-[4px] text-sm ${statusFilter === st.value ? 'bg-green-600 text-white' : 'bg-white border'}`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border rounded p-4 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-20 h-16 bg-slate-100 rounded" />
                <div className="min-w-0 w-56">
                  <div className="h-4 bg-slate-200 rounded mb-2 w-40" />
                  <div className="h-3 bg-slate-200 rounded mb-2 w-32" />
                  <div className="h-3 bg-slate-200 rounded w-24" />
                </div>
              </div>
              <div className="w-48 flex items-center justify-end gap-2">
                <div className="h-8 bg-slate-200 rounded w-12" />
                <div className="h-8 bg-slate-200 rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-white border rounded p-6">No rooms found</div>
      ) : (
        <div className="space-y-3">
          {filteredRooms.map((room) => {
            const id = room.serviceId || room.roomId || room.id;
            const img = (room.roomimages || room.room_image || room.room_images || "").toString();
            const imgSrc = img ? `${BASE_URL}${img.startsWith("/") ? img : `/${img}`}` : null;
            return (
              <div key={id || Math.random()} className="bg-white border rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-28 h-20 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                    {imgSrc ? (
                      // image might be relative on the server
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgSrc} alt={room.roomname || "room image"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm text-slate-500">No image</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{room.roomname || room.title || "Untitled room"}</div>
                    <div className="text-sm text-gray-500 truncate">{room.gharbetiname || room.owner_name || "—"}</div>
                    <div className="text-xs text-gray-400">Price: {room.price ? `NPR ${room.price}` : "—"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:ml-4">
                  <div className={`px-2 py-1 rounded-full text-xs ${room.status === 'approved' ? 'bg-green-50 text-green-700' : room.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>{room.status || 'unknown'}</div>
                  <button className="px-3 py-1 border rounded text-xs" onClick={() => handleViewRoom(room)} aria-label={`View ${room.roomname || 'room'}`}><Eye className="inline-block mr-1 w-4 h-4"/>View</button>
                  {room.status === 'pending' && (
                    <>
                      <button
                        className="px-3 py-1 border rounded text-xs flex items-center bg-green-600 text-white"
                        onClick={() => handleApprove(room)}
                        disabled={Boolean(loadingActions[id])}
                        aria-disabled={Boolean(loadingActions[id])}
                      >
                        {loadingActions[id] === 'approving' ? (
                          <>
                            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                            Approving...
                          </>
                        ) : (
                          <><CheckCircle className="inline-block mr-1 w-4 h-4"/>Approve</>
                        )}
                      </button>
                      <button
                        className="px-3 py-1 border rounded text-xs text-red-600 flex items-center"
                        onClick={() => handleReject(room)}
                        disabled={Boolean(loadingActions[id])}
                        aria-disabled={Boolean(loadingActions[id])}
                      >
                        {loadingActions[id] === 'rejecting' ? (
                          <>
                            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                            Rejecting...
                          </>
                        ) : (
                          <><AlertCircle className="inline-block mr-1 w-4 h-4"/>Reject</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-3 text-sm text-slate-600">
        Showing {Math.min((page - 1) * limit + 1, total || 0)} - {Math.min(page * limit, total || filteredRooms.length)} of {total}
      </div>
      {total > limit && (
        <div className="flex justify-center items-center gap-3">
          <Button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
          <div className="text-sm">{page} / {Math.max(1, Math.ceil(total / limit))}</div>
          <Button disabled={page === Math.ceil(total / limit)} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {/* {viewRoom && (
        <PendingRoomModal room={viewRoom} open={!!viewRoom} onClose={() => setViewRoom(null)} />
      )} */}
    </div>
  );
}
