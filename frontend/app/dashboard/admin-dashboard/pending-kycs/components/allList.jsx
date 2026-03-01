"use client";
import React, { useEffect, useState, useMemo } from "react";
import UserDetailModal from "./userdetailModal";

import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "../../../../../helper/token";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL
const API_URL = `${BASE_URL}/api/admin/kyc`;

function formatDate(iso) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  return d.toLocaleDateString();
}

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

export default function AllList() {
  const token = getTokenFromLocalStorage("token");
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
  const [kycData, setKycData] = useState([]);
  const [rejectModal, setRejectModal] = useState({
    open: false,
    id: null,
    reason: "",
  });
  // loading state per KYC id: 'approving' | 'rejecting'
  const [loadingActions, setLoadingActions] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });

  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [documentModal, setDocumentModal] = useState({ open: false, url: "", title: "" });

  const handleUserDetailModal = (user) => {
    setSelectedUser(user);
    setUserDetailModalOpen(!userDetailModalOpen);
  };


  const [selectedStatus, setSelectedStatus] = useState("pending");

  useEffect(() => {
    fetchCategories();
  }, []);

  // when filters or page change, fetch list
  useEffect(() => {
    fetchKycList(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedStatus, selectedCategory, selectedEntity]);

  // also refetch when searching (reset to page 1)
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchKycList(1);
      fetchCounts();
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kyc/document-types`, {
        headers:{
          'authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        }
      });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setCategories([]);
    }
  };

  const fetchCountForStatus = async (status) => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("document_type", selectedCategory);
      if (selectedEntity) params.append("entityType", selectedEntity);
      if (searchText) params.append("q", searchText);
      // ask for minimal data but let server return total/count
      params.append("limit", "1");
      if (status && status !== "all") params.append("status", status);

      const url = `${API_URL}/all?${params.toString()}`;
      const res = await fetch(url, { 
        headers:{
          'authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        }
      });
      const data = await res.json();

      const list =
        data?.data?.result ||
        data?.results ||
        data?.data ||
        data?.result ||
        data?.items ||
        [];
      const totalCount =
        (data?.data && (data.data.total ?? data.data.count)) ??
        data?.total ??
        data?.count ??
        (Array.isArray(list) ? list.length : 0);

      return Number(totalCount || 0);
    } catch (err) {
      console.error("Failed to fetch count for status", status, err);
      return 0;
    }
  };

  const fetchCounts = async () => {
    try {
      const statuses = ["all", "pending", "approved", "rejected"];
      const promises = statuses.map((s) => fetchCountForStatus(s));
      const results = await Promise.all(promises);
      setCounts({ all: results[0], pending: results[1], approved: results[2], rejected: results[3] });
    } catch (err) {
      console.error("Failed to fetch counts", err);
      setCounts({ all: 0, pending: 0, approved: 0, rejected: 0 });
    }
  };

  const fetchKycList = async (pageToFetch = 1) => {
    try {
      const offset = (pageToFetch - 1) * limit;
      const params = new URLSearchParams();
      if (selectedStatus && selectedStatus !== "all")
        params.append("status", selectedStatus);
      if (limit) params.append("limit", String(limit));
      if (offset) params.append("offset", String(offset));
      if (selectedCategory) params.append("document_type", selectedCategory);
      if (selectedEntity) params.append("entityType", selectedEntity);
      if (searchText) params.append("q", searchText);

      const url = `${API_URL}/all?${params.toString()}`;
      const res = await fetch(url, { 
        headers:{
          'authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        }
       });
      const data = await res.json();
      const list =
        data?.data?.result ||
        data?.results ||
        data?.data ||
        data?.result ||
        data?.items ||
        [];
      const totalCount =
        (data?.data && (data.data.total ?? data.data.count)) ??
        data?.total ??
        data?.count ??
        (Array.isArray(list) ? list.length : 0);

      setKycData(Array.isArray(list) ? list : []);
      setTotal(Number(totalCount || 0));
    } catch (err) {
      console.error("Failed to fetch KYC list:", err);
      setKycData([]);
      setTotal(0);
    }
  };

  const handleKycAction = async (kycId, action, reason = "") => {
    try {
      // mark loading for this kyc id
      setLoadingActions((p) => ({ ...p, [kycId]: action === "approve" ? "approving" : "rejecting" }));
      const payload =
        action === "reject"
          ? { kycId, action, rejectionReason: reason }
          : { kycId, action };

      console.log("THis is payload" + JSON.stringify(payload));

      const res = await fetch(`${API_URL}/verify`, {
        method: "POST",

        headers: { "Content-Type": "application/json",
          'authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken
         },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update KYC");

      // success feedback
      // you can replace these alerts with a toast in future
      alert(action === "approve" ? "KYC Approved ✅" : "KYC Rejected ❌");
      await Promise.all([fetchKycList(page), fetchCounts()]);
      setRejectModal({ open: false, id: null, reason: "" });
      // clear loading for this id
      setLoadingActions((p) => {
        const copy = { ...p };
        delete copy[kycId];
        return copy;
      });
    } catch (err) {
      console.error("KYC action error:", err);
      alert("Action failed");
      // clear loading on error as well
      setLoadingActions((p) => {
        const copy = { ...p };
        delete copy[kycId];
        return copy;
      });
    }
  };

  // client-side safeguard filtering (server already applies filters)
  const filteredData = useMemo(() => {
    return kycData.filter((dt) => {
      const matchesCategory = selectedCategory
        ? dt.document_type === selectedCategory
        : true;
      const matchesEntity = selectedEntity
        ? dt.entityType === selectedEntity
        : true;
      const matchesStatus =
        selectedStatus && selectedStatus !== "all"
          ? dt.status === selectedStatus
          : true;
      const user = dt.user || {};
      const matchesSearch = searchText
        ? user.username?.toLowerCase().includes(searchText.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchText.toLowerCase())
        : true;
      return matchesCategory && matchesEntity && matchesSearch && matchesStatus;
    });
  }, [kycData, selectedCategory, selectedEntity, searchText, selectedStatus]);

  const totalPages = Math.max(
    1,
    Math.ceil((total || filteredData.length) / limit)
  );

  return (
    <div>
      {/* Counts / Summary Row */}
      
      <div className="bg-white p-2 mb-4 rounded-[4px]">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <input
            type="text"
            placeholder="Search applicants by name or email..."
            className="flex-1 border rounded-[4px] px-3 py-2 text-sm focus:ring-0 outline-none"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <select
            value={selectedEntity}
            onChange={(e) => {
              setSelectedEntity(e.target.value);
              setPage(1);
            }}
            className="border rounded-[4px] px-3 py-2 text-sm focus:ring-0 outline-none"
          >
            <option value="">All Entity Types</option>
            <option value="service_provider">Service Provider</option>
            <option value="gharbeti">Gharbeti</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="border rounded-[4px] px-3 py-2 text-sm focus:ring-0 outline-none"
          >
            <option value="">All Document Types</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="ml-auto flex gap-2">
            <button
              className="px-3 py-2 bg-white border rounded-[4px] text-sm hover:bg-green-50"
              onClick={() => {
                setSearchText("");
                setSelectedCategory("");
                setSelectedEntity("");
                setSelectedStatus("all");
                setPage(1);
                fetchKycList(1);
              }}
            >
              Reset
            </button>
            <button
              className="px-3 py-2 bg-green-600 text-white rounded-[4px] text-sm hover:bg-green-700"
              onClick={() => fetchKycList(1)}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs (status) */}
      <div className="flex gap-2 mb-4">
        {["all", "pending", "approved", "rejected"].map((st) => (
          <button
            key={st}
            onClick={() => {
              setSelectedStatus(st);
              setPage(1);
            }}
            className={`px-3 py-1 rounded-[4px] text-sm ${
              selectedStatus === st
                ? "bg-green-600 text-white"
                : "bg-white border"
            }`}
          >
            {st === "all"
              ? "All Applications"
              : st.charAt(0).toUpperCase() + st.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-[4px] p-6 text-center text-slate-500 border">
            No KYC records found 🚫
          </div>
        ) : (
          filteredData.map((dt) => {
            const user = dt.user || {};
            const images = dt.KycImages || [];

            const passportPhoto = images.find(
              (img) => img.image_type === "passport_photo"
            );
            const fileImage = images.find((img) => img.image_type === "file");
            const front = images.find((img) => img.image_type === "front");
            const back = images.find((img) => img.image_type === "back");

            const documentLinks = [];
            if (front)
              documentLinks.push({ label: "Front", path: front.image_path });
            if (back)
              documentLinks.push({ label: "Back", path: back.image_path });
            if (fileImage)
              documentLinks.push({ label: "File", path: fileImage.image_path });

            return (
              <div
                key={dt.id}
                className={`bg-white border rounded-[4px] p-4 ${
                  dt.status === "rejected"
                    ? "border-red-300"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                      {initials(user.username || user.email || "U")}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">{user.username || "Unknown"}</div>
                      <div className="text-sm text-gray-500">{user.email || "N/A"}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Applied{" "}
                        {(() => {
                          const d = new Date(dt.createdAt);
                          if (isNaN(d)) return "N/A";
                          const month = d.toLocaleString("en-US", { month: "short" }).toLowerCase();
                          const day = d.getDate();
                          const year = d.getFullYear();
                          return `${month} ${day} ${year}`;
                        })()}{" "}
                        • {dt.entityType || "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        dt.status === "approved"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : dt.status === "rejected"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }`}
                    >
                      {dt.status}
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700">Submitted Documents</div>
                    <div className="flex gap-2">
                      {documentLinks.length > 0 ? (
                        documentLinks.map((link, i) => (
                          <button
                            key={i}
                            onClick={() => setDocumentModal({
                              open: true,
                              url: `${BASE_URL}${link.path.replace(/\\/g, "/")}`,
                              title: `${link.label} Document`
                            })}
                            className="px-2 py-1 border border-gray-300 rounded-[4px] text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            {link.label}
                          </button>
                        ))
                      ) : null}
                      {passportPhoto && (
                        <button
                          onClick={() => setDocumentModal({
                            open: true,
                            url: `${BASE_URL}${passportPhoto.image_path.replace(/\\/g, "/")}`,
                            title: "Passport Photo"
                          })}
                          className="px-2 py-1 border border-gray-300 rounded-[4px] text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          Passport Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1.5 border border-gray-300 rounded-[4px] text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => handleUserDetailModal(user)}
                      >
                        View Details
                      </button>
                      <button
                        className="px-3 py-1.5 border border-gray-300 rounded-[4px] text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => window.open(`mailto:${user.email || ""}`)}
                      >
                        Contact
                      </button>
                    </div>

                    {dt.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1.5 border border-red-300 text-red-600 rounded-[4px] text-xs hover:bg-red-50 transition-colors flex items-center"
                          onClick={() => setRejectModal({ open: true, id: dt.id, reason: "" })}
                          disabled={Boolean(loadingActions[dt.id])}
                        >
                          {loadingActions[dt.id] === "rejecting" ? (
                            <>
                              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                              Rejecting...
                            </>
                          ) : (
                            "Reject"
                          )}
                        </button>
                        <button
                          className="px-3 py-1.5 bg-green-600 text-white rounded-[4px] text-xs hover:bg-green-700 transition-colors flex items-center"
                          onClick={() => handleKycAction(dt.id, "approve")}
                          disabled={Boolean(loadingActions[dt.id])}
                        >
                          {loadingActions[dt.id] === "approving" ? (
                            <>
                              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Approving...
                            </>
                          ) : (
                            "Approve"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">
              Reject KYC #{rejectModal.id}
            </h3>
            <textarea
              className="border p-3 w-full rounded-lg mb-4 focus:ring-2 focus:ring-red-400 outline-none"
              rows="4"
              placeholder="Enter rejection reason..."
              value={rejectModal.reason}
              onChange={(e) =>
                setRejectModal((prev) => ({ ...prev, reason: e.target.value }))
              }
            />
            <div className="flex justify-end space-x-3">
              <button
                className="bg-green-200 px-4 py-2 rounded-lg hover:bg-green-300"
                onClick={() =>
                  setRejectModal({ open: false, id: null, reason: "" })
                }
              >
                Cancelin
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center"
                disabled={!rejectModal.reason.trim() || loadingActions[rejectModal.id] === "rejecting"}
                onClick={() =>
                  handleKycAction(rejectModal.id, "reject", rejectModal.reason)
                }
              >
                {loadingActions[rejectModal.id] === "rejecting" ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Rejecting...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Showing page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  page === i + 1 ? "bg-green-600 text-white" : "bg-white border"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
      {/* Document Zoom Modal */}
      {documentModal.open && (
        <div
          className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setDocumentModal({ open: false, url: "", title: "" })}
        >
          <div
            className="bg-white border border-gray-200 rounded-[4px] w-full max-w-4xl max-h-[90vh] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{documentModal.title}</h3>
              <button
                onClick={() => setDocumentModal({ open: false, url: "", title: "" })}
                className="px-3 py-1.5 border border-gray-300 rounded-[4px] text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              <img
                src={documentModal.url}
                alt={documentModal.title}
                className="w-full h-auto max-w-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="hidden text-center py-8 text-gray-500">
                <p>Failed to load image</p>
                <a
                  href={documentModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Open in new tab
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {userDetailModalOpen && selectedUser && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-50 overflow-auto p-4"
          onClick={() => setUserDetailModalOpen(false)}
        >
          <div
            className="bg-white border border-gray-200 rounded-[4px] w-full max-w-4xl max-h-[90vh] relative overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <UserDetailModal
              user={selectedUser}
              onClose={() => setUserDetailModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
