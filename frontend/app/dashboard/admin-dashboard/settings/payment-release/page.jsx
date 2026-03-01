"use client";

import { CheckCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaEye, 
  FaDollarSign, 
  FaUser, 
  FaEnvelope, 
  FaCalendarAlt,
  FaStar,
  FaFileAlt,
  FaBox,
  FaExclamationTriangle
} from "react-icons/fa";

import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "../../../../../helper/token";

const statusColors = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  completed: "bg-sky-50 text-sky-700 border border-sky-200",
  cancelled: "bg-rose-50 text-rose-700 border border-rose-200",
  rejected: "bg-slate-50 text-slate-700 border border-slate-200",
};

const statusIcons = {
  pending: FaClock,
  confirmed: FaCheckCircle,
  completed: FaCheckCircle,
  cancelled: FaTimesCircle,
  rejected: FaExclamationTriangle,
};

function StatusBadge({ status }) {
  const Icon = statusIcons[status] || FaClock;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        statusColors[status] ||
        "bg-slate-50 text-slate-700 border-slate-200"
      }`}
    >
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function formatSchedule(str) {
  if (!str) return "—";
  try {
    const [d, range] = String(str).split(" ");
    const dayIdx = Number(d);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = isNaN(dayIdx) ? "" : days[dayIdx] || "";
    return `${day} ${range || ""}`.trim();
  } catch {
    return String(str);
  }
}

function formatDate(isoString) {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(isoString);
  }
}

export default function PaymentReleaseSettingsPage() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("completed");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [releasing, setReleasing] = useState({});
  const [toast, setToast] = useState(null);
  const [releasedStatus, setReleasedStatus] = useState({});

  // Detail modal state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);


  const BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL

  // Fetch bookings
  useEffect(() => {
    let active = true;

    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL(`${BASE_URL}/api/booking/getallbookings`);
        if (status && status !== "all") url.searchParams.set("status", status);
        const res = await fetch(url.toString(), { 
          headers:{
            'authorization': `Bearer ${getTokenFromLocalStorage("token")}`,
            'x-refresh-token': getRefreshTokenFromLocalStorage("refreshToken"),
          }
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data : [];

        if (active) {
          setBookings(list);

          // === Fetch bulk release statuses ===
          if (list.length > 0) {
            const bookingIds = list.map((b) => b.id);
            try {
              const statusRes = await fetch(
                `${BASE_URL}/api/payments/provider/payment-status?bookingIds=${bookingIds.join(
                  ","
                )}`,
                { 
                  headers:{
                    'authorization': `Bearer ${getTokenFromLocalStorage("token")}`,
                    'x-refresh-token': getRefreshTokenFromLocalStorage("refreshToken"),
                  }
                }
              );
              const statusJson = await statusRes.json().catch(() => ({}));
              if (statusRes.ok && statusJson?.data) {
                setReleasedStatus(statusJson.data);
              } else {
                console.warn("Failed to load payment statuses:", statusJson);
                setReleasedStatus({});
              }
            } catch (err) {
              console.error("Error fetching payment statuses:", err);
              setReleasedStatus({});
            }
          } else {
            setReleasedStatus({});
          }
        }
      } catch (e) {
        console.error("Failed to fetch bookings", e);
        if (active) {
          setError(e.message || String(e));
          setBookings([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchBookings();
    return () => {
      active = false;
    };
  }, [status, BASE_URL]);

  // Filtered list
  const filtered = useMemo(() => {
    const list = bookings || [];
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((b) => {
      const name = String(b.name || "").toLowerCase();
      const email = String(b.serviceProviderEmail || "").toLowerCase();
      const service = String(b.service || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        service.includes(q) ||
        String(b.id).includes(q)
      );
    });
  }, [bookings, search]);

  const openDetails = async (id) => {
    if (!id) return;
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);
    try {
      const res = await fetch(`${BASE_URL}/api/booking/detail/${id}`, {
        headers:{
          'authorization': `Bearer ${getTokenFromLocalStorage("token")}`,
          'x-refresh-token': getRefreshTokenFromLocalStorage("refreshToken"),
        }
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || json?.error || `Failed (${res.status})`);
      }
      const booking = json?.data?.booking;
      setDetail(booking || null);
    } catch (e) {
      setDetailError(e.message || String(e));
    } finally {
      setDetailLoading(false);
    }
  };

  const openReleaseModal = (booking) => {
    setSelectedBooking(booking);
    setReleaseModalOpen(true);
  };

  const closeReleaseModal = () => {
    setSelectedBooking(null);
    setReleaseModalOpen(false);
  };

  const releasePayment = (booking) => {
    openReleaseModal(booking);
  };

  const confirmReleasePayment = async () => {
    const booking = selectedBooking;
    if (!booking?.id) return;
    const id = booking.id;

    closeReleaseModal(); // Close modal immediately

    setReleasing((m) => ({ ...m, [id]: "loading" }));
    console.log("Releasing payment for booking ID:", id);
    try {
      const res = await fetch(`${BASE_URL}/api/payments/release-payment/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json",'authorization': `Bearer ${getTokenFromLocalStorage("token")}`,'x-refresh-token': getRefreshTokenFromLocalStorage("refreshToken") },

        body: JSON.stringify({ bookingId: id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          json?.data || json?.message || json?.error || `Failed (${res.status})`;
        const text = String(msg).toLowerCase();
        if (text.includes("already been released")) {
          setReleasing((m) => ({ ...m, [id]: "done" }));
          setReleasedStatus((prev) => ({ ...prev, [id]: true }));
          setToast({
            type: "success",
            message: "Payment already released for this booking.",
          });
          return;
        }
        throw new Error(msg);
      }
      setReleasing((m) => ({ ...m, [id]: "done" }));
      setReleasedStatus((prev) => ({ ...prev, [id]: true }));
      setToast({
        type: "success",
        message: "Payment released successfully",
      });
    } catch (e) {
      console.error("Release failed", e);
      setReleasing((m) => ({ ...m, [id]: "error" }));
      setToast({ type: "error", message: e.message || String(e) });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Release Management
          </h1>
          <p className="text-sm text-gray-600">
            Manage and release payments for completed bookings
          </p>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`mb-6 border border-gray-200 rounded-[4px] px-4 py-3 ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {toast.type === "success" ? (
                  <FaCheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                ) : (
                  <FaTimesCircle className="w-4 h-4 text-red-600 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {toast.type === "success" ? "Success" : "Error"}
                  </p>
                  <p className="text-xs mt-1">{toast.message}</p>
                </div>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setToast(null)}
              >
                <FaTimesCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-[4px] p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex-1 relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, service, user, or provider..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-[4px] text-sm focus:ring-2 focus:ring-green-300 focus:border-transparent outline-none"
              />
              <FaEye className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-[4px] text-sm focus:ring-2 focus:ring-green-300 focus:border-transparent outline-none bg-white min-w-[180px]"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white border border-gray-200 rounded-[4px] overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {filtered.length} {filtered.length === 1 ? "Record" : "Records"}
              </span>
              {loading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent" />
                  Loading...
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent mb-4" />
              <p className="text-sm text-gray-500">Loading bookings...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <FaTimesCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <FaBox className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Service & Parties
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filtered.map((b) => {
                    const amount =
                      b.confirmed_bid_amount ?? b.confirmed_money ?? "—";
                    const isLoading = releasing[b.id] === "loading";
                    const alreadyReleased =
                      releasedStatus[b.id] || releasing[b.id] === "done";
                    const canRelease =
                      b.status === "completed" && !alreadyReleased;

                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-[4px] text-xs font-medium bg-gray-100 text-gray-700">
                            #{b.id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {b.service || "—"}
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <FaUser className="w-3 h-3" />
                              <span>Provider: {b.serviceprovider || "—"}</span>
                            </div>
                            {b.serviceProviderEmail && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <FaEnvelope className="w-3 h-3" />
                                <span>{b.serviceProviderEmail}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <FaCalendarAlt className="w-3 h-3 text-gray-400" />
                            {formatSchedule(b.schedule)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                            Rs. {amount}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openDetails(b.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-[4px] hover:bg-blue-700 transition-colors text-xs font-medium"
                            >
                              <FaEye className="w-3 h-3" />
                              View
                            </button>
                            <button
                              disabled={!canRelease || isLoading}
                              onClick={() => releasePayment(b)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] transition-colors text-xs font-medium ${
                                canRelease
                                  ? "bg-green-600 text-white hover:bg-green-700"
                                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
                              }`}
                            >
                              <FaDollarSign className="w-3 h-3" />
                              {alreadyReleased
                                ? "Released"
                                : isLoading
                                ? "Releasing..."
                                : "Release"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {detailOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-white/60 backdrop-blur-sm"
              onClick={() => setDetailOpen(false)}
            />
            <div className="relative bg-white w-full max-w-5xl border border-gray-200 rounded-[4px] max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Booking Details</h2>
                  {detail?.id && (
                    <p className="text-sm text-gray-600 mt-1">Booking #{detail.id}</p>
                  )}
                </div>
                <button
                  onClick={() => setDetailOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-[4px] transition-colors"
                >
                  <FaTimesCircle className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {detailLoading ? (
                  <div className="py-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent mb-4" />
                    <p className="text-sm text-gray-500">Loading details...</p>
                  </div>
                ) : detailError ? (
                  <div className="py-8 text-center">
                    <FaTimesCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 text-sm font-medium">{detailError}</p>
                  </div>
                ) : !detail ? (
                  <div className="py-8 text-center">
                    <FaExclamationTriangle className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">No details found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* General Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-[4px] p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FaFileAlt className="w-4 h-4 text-gray-600" />
                        General Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Booking ID</p>
                          <p className="text-sm font-bold text-gray-900">#{detail.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Status</p>
                          <StatusBadge status={detail.status} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Created At</p>
                          <p className="text-sm text-gray-700">{formatDate(detail.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Client Completed</p>
                          <div className="flex items-center gap-2">
                            {detail.clientCompleted ? (
                              <FaCheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <FaTimesCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm font-medium">
                              {detail.clientCompleted ? "Yes" : "No"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Provider Completed</p>
                          <div className="flex items-center gap-2">
                            {detail.providerCompleted ? (
                              <FaCheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <FaTimesCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm font-medium">
                              {detail.providerCompleted ? "Yes" : "No"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-[4px] p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FaUser className="w-4 h-4 text-gray-600" />
                        Customer Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Name</p>
                          <p className="text-sm font-bold text-gray-900">{detail.user?.name || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Email</p>
                          <p className="text-sm text-gray-700 flex items-center gap-2">
                            <FaEnvelope className="w-3 h-3 text-gray-400" />
                            {detail.user?.email || "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Service Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-[4px] p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FaBox className="w-4 h-4 text-gray-600" />
                        Service Details
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Service Name</p>
                            <p className="text-sm font-bold text-gray-900">
                              {detail.ServiceProviderService?.Service?.name || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Rate</p>
                            <p className="text-sm font-medium text-green-700 flex items-center gap-1">
                              Rs. {detail.ServiceProviderService?.rate || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Service Status</p>
                            <span className="text-sm font-semibold text-gray-700">
                              {detail.ServiceProviderService?.status || "—"}
                            </span>
                          </div>
                        </div>
                        
                        {detail.ServiceProviderService?.description && (
                          <div>
                            <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Description</p>
                            <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-purple-100">
                              {detail.ServiceProviderService.description}
                            </p>
                          </div>
                        )}

                        {detail.ServiceProviderService?.note && (
                          <div>
                            <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Note</p>
                            <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-purple-100">
                              {detail.ServiceProviderService.note}
                            </p>
                          </div>
                        )}

                        {detail.ServiceProviderService?.includes && detail.ServiceProviderService.includes.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Includes</p>
                            <ul className="space-y-2">
                              {detail.ServiceProviderService.includes.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                  <span>{String(item)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Provider Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-[4px] p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FaUser className="w-4 h-4 text-gray-600" />
                        Service Provider
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Name</p>
                          <p className="text-sm font-bold text-gray-900">
                            {detail.ServiceProviderService?.ServiceProvider?.user?.name || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Email</p>
                          <p className="text-sm text-gray-700 flex items-center gap-2">
                            <FaEnvelope className="w-3 h-3 text-gray-400" />
                            {detail.ServiceProviderService?.ServiceProvider?.user?.email || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Provider ID</p>
                          <p className="text-sm font-bold text-gray-900">
                            #{detail.ServiceProviderService?.ServiceProvider?.id || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Verified</p>
                          <div className="flex items-center gap-2">
                            {detail.ServiceProviderService?.ServiceProvider?.is_verified ? (
                              <FaCheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <FaTimesCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm font-medium">
                              {detail.ServiceProviderService?.ServiceProvider?.is_verified ? "Verified" : "Not Verified"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ratings */}
                    {detail.Ratings && detail.Ratings.length > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-[4px] p-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FaStar className="w-4 h-4 text-gray-600" />
                          Ratings & Reviews
                        </h3>
                        <div className="space-y-3">
                          {detail.Ratings.map((rating, idx) => (
                            <div key={idx} className="bg-white border border-gray-200 rounded-[4px] p-3">
                              <div className="flex items-center gap-2 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <FaStar
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < (rating.rating || 0)
                                        ? "text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                                <span className="text-sm font-medium text-gray-700">
                                  {rating.rating || 0}/5
                                </span>
                              </div>
                              {rating.comment && (
                                <p className="text-sm text-gray-600">{rating.comment}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Release Payment Modal */}
        {releaseModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeReleaseModal}
            />
            <div className="relative bg-white w-full max-w-md border border-gray-200 rounded-lg shadow-lg animate-slide-up">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Confirm Payment Release</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to release the payment for booking <span className="font-bold">#{selectedBooking.id}</span>?
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service:</span>
                    <span className="font-medium text-gray-800">{selectedBooking.service || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Provider:</span>
                    <span className="font-medium text-gray-800">{selectedBooking.serviceprovider || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-bold text-green-600">
                      Rs. {selectedBooking.confirmed_bid_amount ?? selectedBooking.confirmed_money ?? '—'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={closeReleaseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReleasePayment}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Confirm & Release
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateY(-1rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slide-up {
          from {
            transform: translateY(2rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
