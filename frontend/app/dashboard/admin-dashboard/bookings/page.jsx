"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiMail,
  FiCalendar,
  FiTool,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiInfo,
  FiUsers,
  FiClipboard,
  FiAlertCircle,
} from "react-icons/fi";

import { getTokenFromLocalStorage, getRefreshTokenFromLocalStorage } from "../../../../helper/token";

export default function BookingDetailsPage() {
  const token = getTokenFromLocalStorage("token");
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");

  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPagesServer, setTotalPagesServer] = useState(1);

  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    let mounted = true;
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL(`${BASE_URL}/api/booking/getallbookings`);
        if (status && status !== "all") url.searchParams.set("status", status);

        url.searchParams.set("page", String(page));
        url.searchParams.set("limit", String(PER_PAGE));
        const res = await fetch(url.toString(), {
          headers: {
            authorization: `Bearer ${token}`,
            "x-refresh-token": refreshToken,
          },
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data : [];
        const meta = data?.meta || {};
        if (mounted) {
          setBookings(list);
          setTotalCount(meta.total ?? list.length);
          setTotalPagesServer(meta.totalPages ?? 1);
        }
      } catch (e) {
        console.error(e);
        if (mounted) {
          setError(e.message || String(e));
          setBookings([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchBookings();
    return () => {
      mounted = false;
    };
  }, [status, page]);

  const filtered = useMemo(() => {
    if (!search.trim()) return bookings;
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      const name = String(b.name || "").toLowerCase();
      const email = String(b.serviceProviderEmail || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [bookings, search]);

  const statusColors = {
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    completed: "bg-sky-50 text-sky-700 border border-sky-200",
    cancelled: "bg-rose-50 text-rose-700 border border-rose-200",
    rejected: "bg-slate-50 text-slate-700 border border-slate-200",
  };

  const statusIcon = {
    pending: <FiClock className="inline mr-1" />,
    confirmed: <FiCheckCircle className="inline mr-1" />,
    completed: <FiCheckCircle className="inline mr-1" />,
    cancelled: <FiXCircle className="inline mr-1" />,
    rejected: <FiXCircle className="inline mr-1" />,
  };

  const to12 = (timeStr) => {
    if (!timeStr) return "";
    try {
      const [hStr, mStr] = String(timeStr).split(":");
      let h = parseInt(hStr || "0", 10);
      const m = (mStr || "00").padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      h = ((h + 11) % 12) + 1;
      return `${h}:${m} ${ampm}`;
    } catch (e) {
      return String(timeStr);
    }
  };

  const formatSchedule = (s) => {
    if (!s || typeof s !== "string") return s;
    let out = s.replace(/(\d{1,2}:\d{2}(?::\d{2})?)-(\d{1,2}:\d{2}(?::\d{2})?)/g, (_, a, b) => `${to12(a)} - ${to12(b)}`);
    out = out.replace(/(^|\s)(\d{1,2}:\d{2}(?::\d{2})?)(?!\s?(?:AM|PM)\b)(?=$|\s|,|\.)/gi, (_, pre, t) => `${pre}${to12(t)}`);
    return out;
  };

  const PER_PAGE = 6;

  useEffect(() => {
    if (page > totalPagesServer) setPage(totalPagesServer);
  }, [page, totalPagesServer]);

  const startIndex = (page - 1) * PER_PAGE;
  // server returns a page of bookings; apply client-side search to that page
  const paginated = filtered; // filtered already applies search to bookings (which are server-page)
  const showingStart = totalCount === 0 ? 0 : startIndex + 1;
  const showingEnd = startIndex + paginated.length;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Admin — Bookings</h2>

      {/* Stats row (mirrors pending-kycs style) */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-6 gap-3">
        {(() => {
          const counts = bookings.reduce(
            (acc, b) => {
              acc.all += 1;
              const st = (b.status || "").toLowerCase();
              if (st === "pending") acc.pending += 1;
              else if (st === "confirmed") acc.confirmed += 1;
              else if (st === "completed") acc.completed += 1;
              else if (st === "cancelled") acc.cancelled += 1;
              else if (st === "rejected") acc.rejected += 1;
              return acc;
            },
            { all: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, rejected: 0 }
          );

          const stats = [
            { key: "all", label: "All", icon: <FiUsers className="text-lg text-slate-700" />, count: counts.all },
            { key: "pending", label: "Pending", icon: <FiClock className="text-lg text-amber-500" />, count: counts.pending },
            { key: "confirmed", label: "Confirmed", icon: <FiCheckCircle className="text-lg text-emerald-600" />, count: counts.confirmed },
            { key: "completed", label: "Completed", icon: <FiClipboard className="text-lg text-sky-600" />, count: counts.completed },
            { key: "cancelled", label: "Cancelled", icon: <FiXCircle className="text-lg text-rose-600" />, count: counts.cancelled },
            { key: "rejected", label: "Rejected", icon: <FiAlertCircle className="text-lg text-slate-600" />, count: counts.rejected },
          ];

          return stats.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatus(s.key)}
              className={`flex items-center gap-3 p-3 rounded border hover:shadow-sm text-left transition-colors ${
                status === s.key ? "bg-green-50 border-green-200" : "bg-white border-gray-100"
              }`}
            >
              <div className="w-9 h-9 rounded bg-white/80 flex items-center justify-center text-lg">{s.icon}</div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">{s.label}</span>
                <span className="text-xs text-gray-500">{s.count}</span>
              </div>
            </button>
          ));
        })()}
      </div>

      <div className="mb-4 flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user or provider email"
          className="border px-3 py-2 rounded w-full max-w-md"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-3 py-2">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white overflow-hidden rounded border">
        <div className="p-4 border-b flex items-center justify-between">
          <span className="text-sm text-gray-600">Showing {showingStart}-{showingEnd} of {totalCount} booking(s)</span>
          <span className="text-sm text-gray-500">Page {page} / {totalPagesServer}</span>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading bookings…</div>
        ) : error ? (
          <div className="p-6 text-red-600 text-center">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No bookings found.</div>
        ) : (
          <div className="p-4">
            <div className="space-y-4">
              {paginated.map((b) => (
                <div key={b.id} className={`bg-white border rounded-[4px] p-4 ${b.status === 'cancelled' ? 'border-red-300' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                        {b.name ? String(b.name).split(" ").slice(0,2).map(n=>n[0]).join('').toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{b.service || 'Unknown'}</div>
                        
                        <div className="text-xs text-gray-400 mt-1">{formatSchedule(b.schedule)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
                        {statusIcon[b.status]} {b.status}
                      </div>
                      <div className="text-sm text-gray-600">Rs. {b.confirmed_bid_amount ?? b.confirmed_money ?? '—'}</div>
                      <button onClick={() => setSelected(b)} className="px-3 py-1.5 border border-gray-300 rounded-[4px] text-sm text-gray-700 hover:bg-gray-50">View</button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <FiMail className="inline mr-1" /> {b.serviceprovider || '—'} · {b.serviceProviderEmail || '—'}
                    </div>
                    <div className="text-sm text-gray-500">Booking ID: #{b.id}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {totalCount > PER_PAGE && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={`px-3 py-1.5 border rounded-[4px] text-sm ${page === 1 ? "text-gray-400 border-gray-200" : "text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
            Prev
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPagesServer }).map((_, i) => {
              const num = i + 1;
              return (
                <button key={num} onClick={() => setPage(num)} className={`px-3 py-1.5 border rounded-[4px] text-sm ${num === page ? "bg-green-600 text-white border-green-600" : "text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
                  {num}
                </button>
              );
            })}
          </div>

          <button onClick={() => setPage((p) => Math.min(totalPagesServer, p + 1))} disabled={page === totalPagesServer} className={`px-3 py-1.5 border rounded-[4px] text-sm ${page === totalPagesServer ? "text-gray-400 border-gray-200" : "text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
            Next
          </button>
        </div>
      )}

     {selected && (
  <div className="fixed inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] z-50 p-4">
    <div className="bg-white w-full max-w-3xl rounded-[6px] border border-gray-200 p-6 overflow-y-auto max-h-[90vh] shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
            {selected.name ? selected.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Booking #{selected.id}</h3>
            <div className="text-sm text-gray-500">{selected.name} • {selected.service}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">{selected.serviceprovider || '—'}</div>
          <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[selected.status] || 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
            {statusIcon[selected.status]} {selected.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-gray-500">User</p>
          <p className="font-medium mt-1">{selected.name}</p>
          <p className="text-sm text-gray-600 mt-2">Contact: {selected.contact_number || '—'}</p>

          <div className="mt-3">
            <p className="text-gray-500">Schedule</p>
            <p className="font-medium">{formatSchedule(selected.schedule)}</p>
          </div>

          <div className="mt-3">
            <p className="text-gray-500">Confirmed bid</p>
            <p className="font-medium">Rs. {selected.confirmed_bid_amount ?? selected.confirmed_money ?? '—'}</p>
          </div>

          {selected.lat && selected.lng && (
            <div className="mt-3">
              <p className="text-gray-500">Location</p>
              <a
                href={`https://www.google.com/maps?q=${selected.lat},${selected.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                See on Google Maps
              </a>
            </div>
          )}
        </div>

        <div>
          <p className="text-gray-500">Provider</p>
          <p className="font-medium mt-1">{selected.serviceprovider || '—'}</p>
          <p className="text-sm text-gray-600 mt-1">{selected.serviceProviderEmail || '—'}</p>

          <div className="mt-3">
            <p className="text-gray-500">Package</p>
            <p className="font-medium">{selected.package ?? '—'}</p>
          </div>

          <div className="mt-3">
            <p className="text-gray-500">Other info</p>
            <p className="text-sm text-gray-600">{selected.notes || '—'}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={() => setSelected(null)} className="px-3 py-1.5 border border-gray-300 rounded-[4px] text-sm text-gray-700 hover:bg-gray-50">Close</button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
