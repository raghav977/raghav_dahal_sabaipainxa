import { useEffect, useState } from "react";
import { FaUser, FaEnvelope, FaPhone, FaIdCard } from "react-icons/fa";
import { getTokenFromLocalStorage, getRefreshTokenFromLocalStorage } from "@/helper/token";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const resolveUrl = (path) => {
  if (!path) return "";
  try {
    return new URL(path).toString();
  } catch (e) {
    if (!BASE_URL) return path;
    return `${BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  }
};

const formatDate = (iso) => {
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleDateString();
  } catch (e) {
    return iso;
  }
};

export default function UserDetailModal({ onClose, user }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${BASE_URL}/api/admin/users/user-detail/${user.id}`, {
          headers: {
            authorization: `Bearer ${getTokenFromLocalStorage("token")}`,
            "x-refresh-token": getRefreshTokenFromLocalStorage("refreshToken"),
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

        const json = await res.json().catch(() => ({}));
        const payload = json?.data?.userDetail || json?.data || json;

        const norm = {
          id: payload?.id || payload?.user_id || user?.id,
          username: payload?.username || payload?.email || user?.username || "",
          name: payload?.name || payload?.fullName || "",
          email: payload?.email || "",
          phone_number: payload?.phone_number || payload?.phone || null,
          profile_picture: resolveUrl(payload?.profile_picture || payload?.avatar || payload?.profile_image),
          is_active: payload?.is_active ?? payload?.active ?? true,
          status: payload?.status || (payload?.is_active === false ? "blocked" : "active"),
          createdAt: payload?.createdAt || payload?.created_at || payload?.created || null,
          updatedAt: payload?.updatedAt || payload?.updated_at || null,
          municipal: payload?.municipal || payload?.Municipal || null,
          roles: Array.isArray(payload?.Roles) ? payload.Roles.map((r) => r.name) : payload?.roles || [],
          kycs: Array.isArray(payload?.kycs)
            ? payload.kycs.map((kyc) => ({
                ...kyc,
                KycImages: Array.isArray(kyc.KycImages)
                  ? kyc.KycImages.map((img) => ({ ...img, image_path: resolveUrl(img.image_path) }))
                  : [],
              }))
            : [],
        };

        setUserData(norm);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchUserDetails();
    else setLoading(false);
  }, [user]);

  if (!user) return <div>No user selected</div>;
  if (loading)
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading user details...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">
          <FaIdCard className="w-8 h-8 mx-auto mb-2" />
          <p className="font-medium">Failed to load user data</p>
        </div>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-[4px] text-sm hover:bg-gray-700 transition-colors">
          Close
        </button>
      </div>
    );

  if (!userData) return <div>User not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden border bg-slate-100">
            {userData.profile_picture ? (
              <img src={userData.profile_picture} alt={`${userData.name || userData.email}'s avatar`} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-lg font-semibold text-slate-700">
                {userData.name ? userData.name.split(" ").map((p) => p[0]).slice(0, 2).join("") : "U"}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{userData.name || userData.username}</h2>
            <div className="text-sm text-gray-500">{userData.email}</div>
            <div className="mt-2 flex gap-2 flex-wrap">
              {(userData.roles || []).map((r, i) => (
                <span key={i} className="px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                  {r}
                </span>
              ))}
            </div>
            {userData.municipal && (
              <div className="text-xs text-gray-500 mt-1">
                {userData.municipal.name_en} — {userData.municipal.district?.name_en || userData.municipal.district}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${userData.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {userData.is_active ? "Active" : "Blocked"}
          </div>
          <button onClick={onClose} className="px-3 py-1.5 border border-gray-300 rounded-[4px] text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-[4px] p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FaUser className="w-4 h-4" /> Basic Information
          </h3>
          <div className="text-sm space-y-2">
            <div>
              <span className="text-gray-500">Username: </span>
              <span className="font-medium">{userData.username || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500">Email: </span>
              <span className="font-medium">{userData.email || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500">Phone: </span>
              <span className="font-medium">{userData.phone_number || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500">User ID: </span>
              <span className="font-medium">{userData.id}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-[4px] p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FaIdCard className="w-4 h-4" /> Account Details
          </h3>
          <div className="text-sm space-y-2">
            <div>
              <span className="text-gray-500">Status: </span>
              <span className="font-medium">{userData.status || (userData.is_active ? "active" : "blocked")}</span>
            </div>
            <div>
              <span className="text-gray-500">Joined: </span>
              <span className="font-medium">{formatDate(userData.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-500">Last Updated: </span>
              <span className="font-medium">{formatDate(userData.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KYCs */}
      {userData.kycs.length > 0 &&
        userData.kycs.map((kyc) => (
          <div key={kyc.id} className="bg-gray-50 rounded-[4px] p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <FaIdCard className="w-4 h-4" /> KYC Information
            </h3>
            <div className="text-sm space-y-2">
              <div>
                <span className="text-gray-500">Document Type: </span>
                <span className="font-medium capitalize">{kyc.document_type || "—"}</span>
              </div>
              <div>
                <span className="text-gray-500">KYC Status: </span>
                <span className={`font-medium ${
                  kyc.status === "approved" ? "text-green-600" : kyc.status === "rejected" ? "text-red-600" : "text-yellow-600"
                }`}>{kyc.status}</span>
              </div>
              <div>
                <span className="text-gray-500">Verified at: </span>
                <span className="font-medium">{formatDate(kyc.verified_at)}</span>
              </div>
              {kyc.rejection_reason && (
                <div>
                  <span className="text-gray-500">Rejection reason: </span>
                  <span className="font-medium text-red-600">{kyc.rejection_reason}</span>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                {kyc.KycImages.length ? (
                  kyc.KycImages.map((img) => (
                    <a key={img.id} href={img.image_path} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border">
                      <img src={img.image_path} alt={img.image_type} className="h-28 w-full object-cover" />
                    </a>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No KYC documents uploaded.</div>
                )}
              </div>
            </div>
          </div>
        ))}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={() => window.open(`mailto:${userData.email || user.email}`)}
          className="px-4 py-2 bg-green-600 text-white rounded-[4px] text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <FaEnvelope className="w-4 h-4" /> Send Email
        </button>
        {(userData.phone_number || user.phone_number) && (
          <button
            onClick={() => window.open(`tel:${userData.phone_number || user.phone_number}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-[4px] text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaPhone className="w-4 h-4" /> Call
          </button>
        )}
      </div>
    </div>
  );
}
