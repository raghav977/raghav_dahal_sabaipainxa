"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, X } from "lucide-react";
import BlockReasonModal from "./components/BlockReasonModal";

import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "../../../../helper/token";
import { FaUsers, FaUserCheck, FaUserSlash, FaUserTie } from "react-icons/fa";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const STATUS_FILTERS = ["all", "active", "blocked"];

// Resolve image / asset urls returned from backend. If `path` is already
// an absolute url, return it; otherwise prefix with BASE_URL (if present).
const resolveUrl = (path) => {
  if (!path) return "";
  try {
    // if it parses as an absolute url, return as-is
    const url = new URL(path);
    return url.toString();
  } catch (e) {
    // not an absolute url
    if (!BASE_URL) return path;
    // ensure single slash
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

const normalizeUser = (data = []) =>
  data.map((u) => ({
    id: u.id,
    name: u.name || u.username || u.email || "Unknown",
    email: u.email,
    username: u.username,
    phone: u.phone_number || u.phone || u.mobile || null,
    profile_picture: u.profile_picture || u.avatar || null,
    blocked: u.is_active === false || u.status === "blocked" || !!u.deletedAt,
    role: u.role || u.userRole || "User",
    createdAt: u.createdAt || u.created_at || u.created || "",
  }));

const normalizeUserDetail = (data) => {
  if (!data) return null;

  // Support both `kyc` and older `Kyc` shapes from backend responses
  const kyc = data.kyc || data.Kyc || null;
  // console.log("this is kyc in normalize user detail:",kyc);
  console.log("this is data in normalize user detail:",data);

  const base = {
    id: data.id,
    name: data.name || data.username || data.email || "Unknown",
    email: data.email || "—",
    blocked_reason: data.blocked_reason || "—",
    phone: data.phone || data.phone_number || data.mobile || "—",
    role: data.role || (data.roles && data.roles[0]) || "User",
    roles: data.roles || [],
    status: (data.status || (data.is_active === false ? "blocked" : "active") || "unknown").toLowerCase(),
    profile_picture: data.profile_picture || data.avatar || "/images/default-profile.jpg",
    joinedAt: data.joinedAt || data.createdAt || data.created_at || null,
    services: [],
    pastBookings: Array.isArray(data.pastBookings) ? data.pastBookings : [],
    kyc: kyc
      ? {
          id: kyc.id,
          status: (kyc.status || kyc.state || "not_submitted").toLowerCase(),
          rejection_reason: kyc.rejection_reason || null,
          images: Array.isArray(kyc.images) ? kyc.images : [],
        }
      : null,
    rooms: Array.isArray(data.rooms) ? data.rooms : [],
  };

  // For service providers: keep service groups and serviceList structure
  if (Array.isArray(data.services) && data.services.length) {
    data.services.forEach((group) => {
      const normalizedGroup = {
        id: group.id,
        is_verified: !!group.is_verified,
        is_blocked: !!group.is_blocked,
        serviceList: [],
      };

      (group.serviceList || []).forEach((svc) => {
        normalizedGroup.serviceList.push({
          id: svc.id,
          name: svc.name,
          bookings: (svc.bookings || []).map((b) => ({
            id: b.id,
            date: b.date,
            status: b.status,
            bids: b.bids || [],
            lat: b.lat,
            lng: b.lng,
          })),
        });
      });

      base.services.push(normalizedGroup);
    });
  }

  // Normalize past bookings shape if provided as objects with service or plain fields
  if (Array.isArray(base.pastBookings) && base.pastBookings.length > 0) {
    base.pastBookings = base.pastBookings.map((b) => ({
      id: b.id,
      date: b.date,
      status: b.status,
      service: b.service || b.service_id || null,
      bids: b.bids || [],
      lat: b.lat,
      lng: b.lng,
    }));
  }

  // convenience boolean
  base.blocked = base.status === "blocked" || base.status === "inactive" || base.status === "deleted";

  return base;
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

const UserCard = ({ user, onToggleBlock, onViewDetails }) => (
  <motion.div
    className="bg-white border rounded-md p-3 flex items-center justify-between gap-3"
    variants={cardVariants}
    initial="hidden"
    animate="visible"
  >
    <div className="flex items-center gap-3 min-w-0">
      {user.profile_picture ? (
        <img
              src={resolveUrl(user.profile_picture)}
              alt={user.name || user.email}
          className="h-10 w-10 rounded-full object-cover border"
        />
      ) : (
        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-700">
          {getInitials(user.name || user.email)}
        </div>
      )}
      <div className="min-w-0">
        <div className="font-medium text-sm text-gray-900 truncate">{user.name}</div>
        <div className="text-xs text-gray-500 truncate">{user.email}</div>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <div
        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          user.blocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
        }`}
      >
        {user.blocked ? "Blocked" : "Active"}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`View details for ${user.name || user.email}`}
          onClick={() => onViewDetails(user)}
          className="px-3 py-1 text-xs bg-white border rounded-md hover:bg-gray-50 transition-colors"
        >
          Details
        </button>
        <button
          type="button"
          aria-label={`${user.blocked ? 'Unblock' : 'Block'} ${user.name || user.email}`}
          onClick={() => onToggleBlock(user)}
          className={`px-3 py-1 text-xs rounded-md ${
            user.blocked
              ? "bg-green-600 text-white hover:bg-green-700"
              : "border-red-600 border text-red-600 hover:text-white hover:bg-red-700"
          } transition-colors`}
        >
          {user.blocked ? "Unblock" : "Block"}
        </button>
      </div>
    </div>
  </motion.div>
);

const UserModal = ({ user, userDetail, onClose, onToggleBlock, onRefresh, loading: detailLoading }) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!user) return null;

  // merge list item with fetched detail (detail overrides list)
  const data = { ...user, ...(userDetail || {}) };

  const renderStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "active" || s === "confirmed" || s === "completed") return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">{status}</span>;
    if (s === "blocked" || s === "rejected") return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-800">{status}</span>;
    return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">{status || "Unknown"}</span>;
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center  justify-center bg-white/60 backdrop-blur-[2px] z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white w-full max-w-4xl border  rounded-[6px] p-6 relative overflow-y-auto max-h-[90vh] shadow-lg"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
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

        <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-semibold text-slate-700 overflow-hidden border">
              {data.profile_picture ? (
                <img src={resolveUrl(data.profile_picture)} alt={`${data.name || data.email}'s profile`} className="h-full w-full object-cover" />
              ) : (
                getInitials(data.name || data.email || data.username)
              )}
            </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{data.name || data.email || data.username}</h2>
            <p className="text-sm text-gray-600">{data.email || "—"}</p>


            <div className="mt-2 flex flex-wrap gap-2">{(data.roles || []).map((r, i) => (<span key={i} className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">{r}</span>))}</div>
            {data.municipal && (<p className="text-xs text-gray-500 mt-2">{data.municipal.name_en} — <span className="text-gray-600">{data.municipal.district}</span></p>)}
          </div>
        </div>

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
              <p className="text-gray-500">Blocked Reason</p>
              <p className="font-medium text-gray-800">{data.blocked_reason || "—"}</p>
            </div>

            <div>
              <p className="text-gray-500">Joined</p>
              <p className="font-medium text-gray-800">{formatDate(data.joinedAt)}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-gray-500">Roles</p>
              <div className="flex flex-wrap gap-2 mt-2">{(data.roles || []).map((r, i) => (<span key={i} className="px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">{r}</span>))}</div>
            </div>

            {/* <div className="md:col-span-2">
              <p className="text-gray-500">KYC</p>
              <div className="mt-2 border rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold">{(data.kyc?.status || "Not submitted").toString()}</div>
                  {data.kyc?.rejection_reason && <div className="text-xs text-red-600">{data.kyc.rejection_reason}</div>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(data.kyc?.images || []).length ? data.kyc.images.map((img) => (
                    <a key={img.id} href={resolveUrl(img.image_path)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border">
                      <img src={resolveUrl(img.image_path)} alt={img.image_type} className="h-28 w-full object-cover" />
                    </a>
                  )) : <div className="text-sm text-gray-500">No KYC documents uploaded.</div>}
                </div>
              </div>
            </div> */}
          </div>
        )}

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
                  {accepted ? <div className="text-sm font-semibold text-green-700">Accepted: NPR {accepted.amount}</div> : null}
                </div>

                {/* Google Maps link */}
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


        {activeTab === "services" && (
          <div>
            {data.services?.length ? (
              data.services.map((group) => (
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
              ))
            ) : (
              <p className="text-gray-500 text-sm">No services available.</p>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition-colors" onClick={onClose}>Close</button>
          <button
            onClick={() => { onToggleBlock(data); onClose(); }}
            className={`px-4 py-2 rounded-lg text-white ${data.blocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} transition-colors`}
          >
            {data.blocked ? "Unblock" : "Block"}
          </button>
        </div>
        {/* block modal is rendered at page level (see below) */}
      </motion.div>
    </motion.div>
  );
};

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [counts, setCounts] = useState({ totalUsers: 0, activeUsers: 0, blockedUsers: 0, providers: 0 });
  const fetchControllerRef = useRef(null);
  // block-reason modal state
  const [blockModal, setBlockModal] = useState({ open: false, user: null, reason: "" });
  const [blocking, setBlocking] = useState(false);

  const fetchUsers = useCallback(async ({ pageArg = 1, limitArg = 20, statusArg = "all", searchArg = "", roleArg = "all" } = {}) => {
    setLoading(true);
    setError(null);


    try {
      if (fetchControllerRef.current) fetchControllerRef.current.abort();
    } catch (e) {}
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    try {
      const token = getTokenFromLocalStorage("token");
      const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");

      const params = new URLSearchParams();
      if (roleArg) params.set("role", roleArg);
      if (statusArg) params.set("status", statusArg);
      if (searchArg) params.set("search", searchArg);
      params.set("page", String(pageArg || 1));
      params.set("limit", String(limitArg || 20));

      const url = `${BASE_URL}/api/admin/users/all?${params.toString()}`;

      const res = await fetch(url, {
        headers: {
          authorization: `Bearer ${token}`,
          "x-refresh-token": refreshToken,
        },
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const body = await res.json().catch(() => ({}));

      // backend returns { users, total, page, limit, totalPages }
      const list = Array.isArray(body?.data?.users)
        ? body.data.users
        : Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body?.users)
        ? body.users
        : [];

      setUsers(normalizeUser(list));
      // update pagination meta if provided
      if (body?.data?.total !== undefined) {
        const total = body.data.total;
        const srvLimit = parseInt(body.data.limit || limitArg);
        const srvPage = parseInt(body.data.page || pageArg);
        const srvTotalPages = Math.max(1, Math.ceil(total / srvLimit));
        setTotalPages(srvTotalPages);
        setPage(srvPage);
        setLimit(srvLimit);
      }
      return body?.data || {};
    } catch (err) {
      if (err.name === "AbortError") return {};
      console.error("Fetch error:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
      if (fetchControllerRef.current === controller) fetchControllerRef.current = null;
    }
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const token = getTokenFromLocalStorage("token");
      const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");

      // metrics for total users and providers
      const metricsRes = await fetch(`${BASE_URL}/api/admin/dashboard/metrics`, {
        headers: { authorization: `Bearer ${token}`, "x-refresh-token": refreshToken },
      });
      const metricsJson = await metricsRes.json().catch(() => ({}));
      const totalUsers = Number(metricsJson?.data?.totalUsers ?? metricsJson?.totalUsers ?? 0);
      const providers = Number(metricsJson?.data?.totalServiceProviders ?? metricsJson?.totalServiceProviders ?? 0);

      // use users/all to get counts for active & blocked (reuse service which returns total)
      const activeRes = await fetch(`${BASE_URL}/api/admin/users/all?status=active&limit=1`, {
        headers: { authorization: `Bearer ${token}`, "x-refresh-token": refreshToken },
      });
      const activeJson = await activeRes.json().catch(() => ({}));
      const activeTotal = Number(activeJson?.data?.total ?? activeJson?.total ?? 0);

      const blockedRes = await fetch(`${BASE_URL}/api/admin/users/all?status=blocked&limit=1`, {
        headers: { authorization: `Bearer ${token}`, "x-refresh-token": refreshToken },
      });
      const blockedJson = await blockedRes.json().catch(() => ({}));
      const blockedTotal = Number(blockedJson?.data?.total ?? blockedJson?.total ?? 0);

      setCounts({ totalUsers, activeUsers: activeTotal, blockedUsers: blockedTotal, providers });
    } catch (err) {
      console.error("Failed to fetch users dashboard counts:", err);
    }
  }, []);

  const fetchUserDetail = useCallback(async (id) => {
    setUserDetailLoading(true);
    try {
      const token = getTokenFromLocalStorage("token");
      const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
      const res = await fetch(`${BASE_URL}/api/admin/users/user-all-detail/${id}`, {
        headers: {
          authorization: `Bearer ${token}`,
          "x-refresh-token": refreshToken,
        },
      });
      const body = await res.json().catch(() => ({}));
      // backend may wrap data under `.data` and return status
      const payload = body?.data || body;
      if (body?.status === "success" || payload) {
        setUserDetail(normalizeUserDetail(payload));
      } else {
        setUserDetail(null);
      }
    } catch (err) {
      console.error("Error fetching user detail:", err);
      setUserDetail(null);
    } finally {
      setUserDetailLoading(false);
    }
  }, []);

  const toggleBlock = useCallback(async (user, reason = null) => {
    const wantBlock = !user.blocked;
    const action = wantBlock ? "block" : "unblock";

    // If trying to block but no reason provided, open the modal UI
    if (wantBlock && reason == null) {
      setBlockModal({ open: true, user, reason: "" });
      return;
    }

    // Confirm action with a simple confirmation (blocking modal already asks for reason)
    if (!confirm(`Are you sure you want to ${action} ${user.name || user.email}?${reason ? "\nReason: " + reason : ""}`)) return;

    try {
      setBlocking(true);
      const token = getTokenFromLocalStorage("token");
      const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
      // call backend
      const url = `${BASE_URL}/api/admin/users/change-status/${user.id}/${action}`;
      const headers = { authorization: `Bearer ${token}`, "x-refresh-token": refreshToken };
      const opts = { method: "POST", headers };

      // include JSON body when blocking to send the reason
      if (wantBlock) {
        headers["Content-Type"] = "application/json";
        opts.body = JSON.stringify({ blocked_reason: reason });
      }

      const res = await fetch(url, opts);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = body?.message || body?.error || `Failed to ${action} user`;
        alert(message);
        return;
      }

      // backend returns user { id, is_active }
      const updatedActive = body?.data?.user?.is_active;
      const updatedBlocked = updatedActive === undefined ? !wantBlock : !updatedActive;

      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, blocked: updatedBlocked } : u)));

      // if modal is open for this user, update it too
      setSelectedUser((prev) => (prev && prev.id === user.id ? { ...prev, blocked: updatedBlocked } : prev));

      alert(body?.message || `User ${action}ed successfully`);
    } catch (err) {
      console.error("Block/unblock error:", err);
      setError(err.message || "Failed to update user status");
      alert("Failed to update user status. Try again.");
    } finally {
      setBlocking(false);
      // close modal if it was used
      setBlockModal((m) => (m.open ? { open: false, user: null, reason: "" } : m));
    }
  }, []);

  useEffect(() => {
    // fetch current page with selected filters
    fetchUsers({ pageArg: page, limitArg: limit, statusArg: selectedStatus, searchArg: query });
    fetchCounts();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    // server-side search is used; only apply status filter locally as a safety
    let list = users;
    if (selectedStatus === "active") list = list.filter((u) => !u.blocked);
    if (selectedStatus === "blocked") list = list.filter((u) => u.blocked);
    return list;
  }, [users, query, selectedStatus]);

  // Debounced server-side search: when `query` changes, reset to page 1 and fetch after a short delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchUsers({ pageArg: 1, limitArg: limit, statusArg: selectedStatus, searchArg: query });
    }, 400);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleViewDetails = useCallback(
    (user) => {
      setSelectedUser(user);
      setUserDetail(null);
      fetchUserDetail(user.id);
    },
    [fetchUserDetail]
  );

  // helper to change status filter and reload page 1
  const changeStatusFilter = (status) => {
    setSelectedStatus(status);
    setPage(1);
    fetchUsers({ pageArg: 1, limitArg: limit, statusArg: status, searchArg: query });
  };

  // go to a specific page (numbered pagination)
  const goToPage = (n) => {
    if (!n || n === page) return;
    const next = Math.max(1, Math.min(n, totalPages || 1));
    setPage(next);
    fetchUsers({ pageArg: next, limitArg: limit, statusArg: selectedStatus, searchArg: query });
  };

  // small helper to compute a compact range of page numbers to show
  const getPageRange = (maxButtons = 7) => {
    const total = totalPages || 1;
    if (total <= maxButtons) return Array.from({ length: total }, (_, i) => i + 1);
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = Math.min(total, start + maxButtons - 1);
    if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-6 h-6 text-green-600" />
            Manage Users
          </h1>
          <p className="text-sm text-gray-500 mt-1">Search, filter, and manage user access.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setQuery("");
              setSelectedStatus("all");
              setPage(1);
              fetchUsers({ pageArg: 1, limitArg: limit, statusArg: "all", searchArg: "" });
              fetchCounts();
            }}
            className="px-4 py-2 bg-white border rounded-[4px] text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={async () => {
              await Promise.all([
                fetchUsers({ pageArg: page, limitArg: limit, statusArg: selectedStatus, searchArg: query }),
                fetchCounts(),
              ]);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-[4px] text-sm hover:bg-green-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards (users dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-[4px] p-4 cursor-pointer" onClick={() => { setSelectedStatus('all'); setPage(1); fetchUsers({ pageArg:1, limitArg: limit, statusArg: 'all' }); }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{counts.totalUsers}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-[4px] flex items-center justify-center">
              <FaUsers className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[4px] p-4 cursor-pointer" onClick={() => { changeStatusFilter('active'); fetchCounts(); }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{counts.activeUsers}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-[4px] flex items-center justify-center">
              <FaUserCheck className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[4px] p-4 cursor-pointer" onClick={() => { changeStatusFilter('blocked'); fetchCounts(); }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Blocked Users</p>
              <p className="text-2xl font-bold text-red-600">{counts.blockedUsers}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-[4px] flex items-center justify-center">
              <FaUserSlash className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[4px] p-4 cursor-pointer" onClick={() => { setSelectedStatus('all'); setPage(1); fetchUsers({ pageArg:1, limitArg: limit, statusArg: 'all', roleArg: 'service_provider' }); }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Service Providers</p>
              <p className="text-2xl font-bold text-gray-900">{counts.providers}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-[4px] flex items-center justify-center">
              <FaUserTie className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="flex-1 border rounded-[4px] px-4 py-3 text-sm focus:ring-2 focus:ring-green-300 outline-none transition-shadow"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                fetchUsers({ pageArg: 1, limitArg: limit, statusArg: selectedStatus, searchArg: query });
              }
            }}
          />
          <div className="flex gap-2">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => changeStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedStatus === status
                    ? "bg-green-600 text-white"
                    : "bg-white border text-gray-700 hover:bg-gray-50"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500 flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading users…
        </div>
      ) : error ? (
        <div className="text-red-600 text-center py-10 bg-white rounded-xl border p-6">Error: {error}</div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl p-6 text-center text-slate-500 border">No users found 🚫</div>
      ) : (
        <motion.div
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} onToggleBlock={toggleBlock} onViewDetails={handleViewDetails} />
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {selectedUser && (
          <UserModal
            user={selectedUser}
            userDetail={userDetail}
            onClose={() => setSelectedUser(null)}
            onToggleBlock={toggleBlock}
            onRefresh={fetchUserDetail}
            loading={userDetailLoading}
          />
        )}
      </AnimatePresence>

      {/* Block reason modal (page-level) */}
      <BlockReasonModal
        open={blockModal.open}
        user={blockModal.user}
        reason={blockModal.reason}
        onChangeReason={(r) => setBlockModal((m) => ({ ...m, reason: r }))}
        onCancel={() => setBlockModal({ open: false, user: null, reason: "" })}
        onConfirm={async () => {
          if (!blockModal.user) return;
          await toggleBlock(blockModal.user, blockModal.reason.trim());
        }}
        loading={blocking}
      />
    </div>
  );
}
