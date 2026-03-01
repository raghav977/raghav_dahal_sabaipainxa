"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const resolveUrl = (path) => {
  if (!path) return "";
  try {
    const url = new URL(path);
    return url.toString();
  } catch (e) {
    if (!BASE_URL) return path;
    return `${BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  }
};

const getInitials = (name = "") => {
  const safe = String(name || "").trim();
  if (!safe) return "U";
  const parts = safe.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return (parts[0][0] || "U").toUpperCase();
  return ((parts[0][0] || "U") + (parts[1][0] || "")).toUpperCase();
};

const formatDate = (iso) => {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString();
};

const modalVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: 50, transition: { duration: 0.2 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const renderStatusBadge = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "active" || s === "confirmed" || s === "completed")
    return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">{status}</span>;
  if (s === "blocked" || s === "rejected")
    return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-800">{status}</span>;
  return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">{status || "Unknown"}</span>;
};

export default function UserModal({ user, userDetail, onClose, onToggleBlock, onRefresh, loading: detailLoading }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!user) return null;

  const data = { ...user, ...(userDetail || {}) };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white w-full max-w-4xl border rounded-[6px] p-6 relative overflow-y-auto max-h-[90vh] shadow-lg"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top buttons */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              aria-label="Refresh user detail"
              disabled={!!detailLoading}
              className={`text-sm ${detailLoading ? "text-gray-400 bg-gray-100" : "text-green-700 bg-green-50"} px-2 py-1 rounded`}
              onClick={() => onRefresh && onRefresh(data.id)}
            >
              {detailLoading ? "Refreshing..." : "Refresh"}
            </button>
            <button className="text-gray-500 hover:text-gray-700" onClick={onClose}><X className="w-6 h-6" /></button>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-semibold text-slate-700 overflow-hidden border">
              {data.profile_picture ? (
                <img src={resolveUrl(data.profile_picture)} alt={`${data.name || data.email}'s profile`} className="h-full w-full object-cover" />
              ) : getInitials(data.name || data.email || data.username)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900">{data.name || data.email || data.username}</h2>
              <p className="text-sm text-gray-600">{data.email || "—"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(data.roles || []).map((r, i) => (
                  <span key={i} className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">{r}</span>
                ))}
              </div>
              {data.municipal && (
                <p className="text-xs text-gray-500 mt-2">{data.municipal.name_en} — <span className="text-gray-600">{data.municipal.district}</span></p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-6">
            {["overview", "pastBookings", "services"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab ? "border-b-2 border-green-600 text-green-700" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "overview" ? "Overview" : tab === "pastBookings" ? "Past Bookings" : "Services"}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {detailLoading && !userDetail ? (
            <div className="py-8 flex items-center justify-center">
              <svg className="animate-spin h-6 w-6 text-gray-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-800">{data.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium text-gray-800">{data.phone || "—"}</p>
              </div>

              <div>
                <p className="text-gray-500">Status</p>
                <p className={`font-medium ${data.status === "active" ? "text-green-600" : "text-red-600"}`}>
                  {data.status === "active" ? "Active" : (data.status || "Unknown")}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Joined</p>
                <p className="font-medium text-gray-800">{formatDate(data.joinedAt)}</p>
              </div>

              <div className="md:col-span-2">
                <p className="text-gray-500">Roles</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(data.roles || []).map((r, i) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">{r}</span>
                  ))}
                </div>
              </div>

              {/* KYC Section */}
             {/* KYC Section */}
<div className="md:col-span-2">
  <p className="text-gray-500 font-semibold mb-2">KYC Documents</p>
  {Array.isArray(data.kycs) && data.kycs.length > 0 ? (
    data.kycs.map((k) => (
      <div key={k.id} className="mb-4 border rounded-lg p-3 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="font-medium text-sm">
            {k.document_type?.replace(/_/g, " ").toUpperCase() || "UNKNOWN"} — {k.status?.toUpperCase() || "NOT SUBMITTED"}
          </p>
          {k.rejection_reason && (
            <p className="text-xs text-red-600 font-medium">{k.rejection_reason}</p>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Array.isArray(k.images) && k.images.length > 0 ? (
            k.images.map((img) => (
              <a
                key={img.id}
                href={resolveUrl(img.image_path)}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-md border hover:shadow-md transition-shadow"
              >
                {img.image_type?.endsWith(".pdf") ? (
                  <div className="h-28 w-full flex items-center justify-center bg-gray-100 text-gray-600 text-xs font-semibold">
                    PDF Document
                  </div>
                ) : (
                  <img
                    src={resolveUrl(img.image_path)}
                    alt={img.image_type || "KYC Document"}
                    className="h-28 w-full object-cover"
                  />
                )}
              </a>
            ))
          ) : (
            <p className="text-gray-500 text-sm col-span-full">No images uploaded for this document.</p>
          )}
        </div>
      </div>
    ))
  ) : (
    <p className="text-gray-500 text-sm">No KYC documents found.</p>
  )}
</div>

            </div>
          )}

          {/* Past Bookings Tab */}
          {activeTab === "pastBookings" && (
            <div>
              {data.pastBookings?.length ? (
                <div className="space-y-4">
                  {data.pastBookings.map((booking, idx) => {
                    const accepted = (booking.bids || []).find((b) => b.status === "accepted");
                    const dotColor = booking.status === "completed" || booking.status === "confirmed"
                      ? "bg-green-600"
                      : booking.status === "cancelled"
                      ? "bg-red-600"
                      : "bg-yellow-500";

                    return (
                      <div key={booking.id} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`h-3 w-3 rounded-full ${dotColor}`} />
                          {idx !== data.pastBookings.length - 1 && <div className="h-full w-px bg-gray-200 mt-1" />}
                        </div>

                        <div className="flex-1 border rounded-lg p-3 bg-slate-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-800">{booking.service?.name || booking.service || "Unknown Service"}</p>
                              <p className="text-xs text-gray-500">{formatDate(booking.date)}</p>
                            </div>
                            <div className="text-right">{renderStatusBadge(booking.status)}</div>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <div className="text-sm text-gray-700">Bids: {(booking.bids || []).length}</div>
                            {accepted && <div className="text-sm font-semibold text-green-700">Accepted: NPR {accepted.amount}</div>}
                          </div>

                          {booking.lat && booking.lng && (
                            <div className="mt-2">
                              <a
                                href={`https://www.google.com/maps?q=${booking.lat},${booking.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm font-medium"
                              >
                                See on Google Maps
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No past bookings found.</p>
              )}
            </div>
          )}

          {/* Services Tab */}
          {activeTab === "services" && (
            <div>
              {Array.isArray(data.services) && data.services.length ? (
                <>
                  {data.services.map((group) => (
                    <motion.div key={group.id} className="mb-6" variants={cardVariants} initial="hidden" animate="visible">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg text-gray-800">Service Group #{group.id}</h3>
                        <div className="text-sm text-gray-600">{group.is_verified ? "Verified" : "Not verified"}</div>
                      </div>

                      {(group.serviceList || []).map((svc) => (
                        <div key={svc.id} className="mb-4 border rounded-lg p-3 bg-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-800">{svc.name}</p>
                              <p className="text-xs text-gray-500">Service id: {svc.id}</p>
                            </div>
                            <div className="text-sm text-gray-600">Bookings: {(svc.bookings || []).length}</div>
                          </div>

                          {(svc.bookings || []).length ? (
                            <div className="mt-3 space-y-2">
                              {svc.bookings.map((b) => {
                                const accepted = (b.bids || []).find((bb) => bb.status === "accepted");
                                return (
                                  <div key={b.id} className="flex items-center justify-between p-2 rounded bg-slate-50">
                                    <div>
                                      <p className="text-sm font-medium">{formatDate(b.date)}</p>
                                      <p className="text-xs text-gray-500">Status: {b.status}</p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs text-gray-600">Bids: {(b.bids || []).length}</div>
                                      {accepted && <div className="text-sm font-semibold text-green-700">Accepted: NPR {accepted.amount}</div>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mt-2">No bookings for this service.</p>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  ))}
                </>
              ) : (
                <p className="text-gray-500 text-sm">No services available.</p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <button className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition-colors" onClick={onClose}>Close</button>
            <button
              onClick={() => { onToggleBlock(data); onClose(); }}
              className={`px-4 py-2 rounded-lg text-white ${data.blocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} transition-colors`}
            >
              {data.blocked ? "Unblock" : "Block"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
