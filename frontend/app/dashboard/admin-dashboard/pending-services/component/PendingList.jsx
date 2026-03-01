"use client";

import React, { useEffect, useState, useMemo } from "react";
import { fetchServices } from "@/app/redux/slices/categorySlice";
import { fetchServiceByStatus } from "@/app/redux/slices/serviceSlice";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import { getTokenFromLocalStorage, getRefreshTokenFromLocalStorage } from "../../../../../helper/token";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function PendingList({ selectedStatusProp, onSelectedStatusChange }) {
  const dispatch = useDispatch();
  const router = useRouter();

  const { list, total = 0, loading, error } = useSelector((state) => state.service);
  const categories = useSelector((state) => state.category.list) || [];
  const servicesList = list?.results || [];

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(selectedStatusProp || "pending");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [showKycModal, setShowKycModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // per-service loading state: { [serviceId]: 'approving' | 'rejecting' }
  const [loadingActions, setLoadingActions] = useState({});

  const token = getTokenFromLocalStorage("token");
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");

  // view modal state left in file but not used when navigating to detail page
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState(null);
  const [serviceDetail, setServiceDetail] = useState(null);

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  const buildStatusQuery = (sel) => {
    // returns object { status, is_active }
    if (sel === "active") return { status: "approved", is_active: true };
    if (sel === "inactive") return { status: "approved", is_active: false };
    return { status: sel };
  };

  useEffect(() => {
    const q = buildStatusQuery(selectedStatus);
    dispatch(fetchServiceByStatus({ status: q.status, is_active: q.is_active, limit, offset: (page - 1) * limit }));
    if (typeof onSelectedStatusChange === "function") onSelectedStatusChange(selectedStatus);
  }, [dispatch, page, limit, selectedStatus, onSelectedStatusChange]);

  useEffect(() => {
    if (selectedStatusProp && selectedStatusProp !== selectedStatus) {
      setSelectedStatus(selectedStatusProp);
    }

  }, [selectedStatusProp]);


  const openDetails = (id) => {
    const svcId = id || "";
    if (!svcId) return;
    router.push(`/dashboard/admin-dashboard/service-detail/${svcId}`);
  };

  const closeDetails = () => {
    setViewOpen(false);
    setServiceDetail(null);
    setViewError(null);
  };


  const handleVerifyService = async (serviceId, action, rejectionReasonParam = "") => {
    try {

      setLoadingActions((p) => ({ ...p, [serviceId]: action === "approve" ? "approving" : "rejecting" }));

      const response = await fetch(`${BASE_URL}/api/admin/service/verifyservice/${serviceId}`, {
        method: "POST",

        headers: { "Content-Type": "application/json",
          'authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken
         },
        body: JSON.stringify({
          status: action === "approve" ? "approved" : "rejected",
          rejected_reason: action === "reject" ? rejectionReasonParam : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error verifying service:", errorData.message || response.statusText);
        alert(`Failed to ${action} service: ${errorData.message || response.statusText}`);
        return false;
      }

  // refresh
  const q2 = buildStatusQuery(selectedStatus);
  dispatch(fetchServiceByStatus({ status: q2.status, is_active: q2.is_active, limit, offset: (page - 1) * limit }));
      return true;
    } catch (err) {
      console.error("Network error:", err);
      alert(`Network error while trying to ${action} service.`);
      return false;
    } finally {
      // clear loading for this service
      setLoadingActions((p) => {
        const copy = { ...p };
        delete copy[serviceId];
        return copy;
      });
    }
  };

  // toggle active/inactive for approved services
  const handleToggleActive = async (service) => {
    if (!service || !service.serviceId) return;
    const serviceId = service.serviceId;
    // mark loading for this service
    setLoadingActions((p) => ({ ...p, [serviceId]: "toggling" }));
    try {
      const res = await fetch(`${BASE_URL}/api/admin/service/toogle-service-status/${serviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json", 
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...(refreshToken ? { "x-refresh-token": refreshToken } : {}),
        },
        body: JSON.stringify({ is_active: !service.is_active }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Failed to toggle service active state:", data);
        alert(data.message || "Failed to toggle service status");
        return false;
      }

  // refresh list
  const q3 = buildStatusQuery(selectedStatus);
  dispatch(fetchServiceByStatus({ status: q3.status, is_active: q3.is_active, limit, offset: (page - 1) * limit }));
      return true;
    } catch (err) {
      console.error("Network error while toggling service:", err);
      alert("Network error while toggling service status.");
      return false;
    } finally {
      setLoadingActions((p) => {
        const copy = { ...p };
        delete copy[serviceId];
        return copy;
      });
    }
  };

  const handleVerifyBeforeAction = (service, action) => {
    if (!service.providerVerified) {
      setSelectedService(service);
      setPendingAction(action);
      setShowKycModal(true);
    } else {
      if (action === "approve") handleVerifyService(service.serviceId, "approve");
      else handleRejectModal(service);
    }
  };

  const handleAccept = (service) => handleVerifyBeforeAction(service, "approve");

  const handleRejectModal = (service) => {
    setSelectedService(service);
    setShowRejectModal(true);
    setRejectionReason("");
  };

  const handleRejectService = async () => {
    if (!selectedService || !rejectionReason.trim()) return alert("Please provide a rejection reason.");
    await handleVerifyService(selectedService.serviceId, "reject", rejectionReason.trim());
    setShowRejectModal(false);
    setSelectedService(null);
    setRejectionReason("");
  };

  const confirmKycAction = () => {
    setShowKycModal(false);
    if (pendingAction === "approve") {
      handleVerifyService(selectedService.serviceId, "approve");
    } else if (pendingAction === "reject") {
      handleRejectModal(selectedService);
    }
  };

  // client-side filtering (server already filtered by status)
  const filteredList = useMemo(() => {
    return servicesList.filter((service) => {
      const matchesName = service.serviceProviderName?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory ? service.serviceName === selectedCategory : true;
      // Handle active/inactive tabs which are server-filtered by is_active
      let matchesStatus = true;
      if (selectedStatus && selectedStatus !== "all") {
        if (selectedStatus === "active") matchesStatus = Boolean(service.is_active) === true;
        else if (selectedStatus === "inactive") matchesStatus = Boolean(service.is_active) === false;
        else matchesStatus = service.status === selectedStatus;
      }
      return matchesName && matchesCategory && matchesStatus;
    });
  }, [servicesList, search, selectedCategory, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil((total || filteredList.length) / limit));

  const statusBadge = (st) => {
    if (st === "approved") return "bg-green-100 text-green-700";
    if (st === "rejected") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-[4px] p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <input
            type="text"
            placeholder="Search by Provider Name..."
            className="flex-1 border border-gray-300 rounded-[4px] px-3 py-2 text-sm focus:ring-2 focus:ring-green-300 outline-none"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-[4px] px-3 py-2 text-sm focus:ring-2 focus:ring-green-300 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 bg-white border border-gray-300 rounded-[4px] text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => { setSearch(""); setSelectedCategory(""); setSelectedStatus("all"); setPage(1); }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2">
        {["all", "pending", "approved", "active", "inactive", "rejected"].map((st) => (
          <button
            key={st}
            onClick={() => { setSelectedStatus(st); setPage(1); }}
            className={`px-3 py-1.5 rounded-[4px] text-sm font-medium transition-colors ${
              selectedStatus === st 
                ? "bg-green-600 text-white" 
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {st === "all" ? "All Services" : st.charAt(0).toUpperCase() + st.slice(1)}
          </button>
        ))}
      </div>

      {loading && <p className="text-center py-8">Loading...</p>}
      {error && <p className="text-red-500 text-center py-4">{error}</p>}

      {/* Service Cards */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-[4px] p-6 text-center text-gray-500">
            No services found
          </div>
        ) : (
          filteredList.map((service) => (
            <div
              key={service.serviceId}
              className="bg-white border border-gray-200 rounded-[4px] p-4"
            >
              {/* Header Section */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                    {String(service.serviceProviderName || "U").split(" ").slice(0,2).map(s => s.charAt(0)).join("").toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{service.serviceName || "Unnamed Service"}</h3>
                    <p className="text-sm text-gray-500">{service.serviceProviderName || "N/A"}</p>
                    <p className="text-xs text-gray-400">Category: {service.category || "N/A"}</p>
                  </div>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    service.status === "approved"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : service.status === "rejected"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-yellow-50 text-yellow-700 border-yellow-200"
                  }`}
                >
                  {service.status || "pending"}
                </div>
              </div>

              {/* Documents Section */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Submitted Documents</div>
                <div className="flex flex-wrap gap-2">
                  {(service.documentUrls && service.documentUrls.length > 0) ? (
                    service.documentUrls.map((doc, i) => (
                      <a
                        key={i}
                        href={`${BASE_URL}${doc}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 border border-gray-300 rounded-[4px] text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        Doc {i + 1}
                      </a>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500">No documents submitted</div>
                  )}
                </div>
                {/* Rejection reason for services that were rejected */}
                {service.status === "rejected" && service.rejectedReason && (
                  <div className="mt-3 bg-red-50 border border-red-200 text-red-700 p-3 rounded-[4px]">
                    <div className="text-sm font-semibold">Rejection Reason</div>
                    <div className="text-sm whitespace-pre-wrap mt-1">{service.rejectedReason}</div>
                  </div>
                )}
              </div>

              {/* Actions Section */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 border border-gray-300 rounded-[4px] text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => window.open(`mailto:${service.serviceProviderEmail || ""}`)}
                  >
                    Contact Provider
                  </button>
                  <button
                    className="px-3 py-1.5 border border-gray-300 rounded-[4px] text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => openDetails(service.serviceId || service.id)}
                  >
                    View Details
                  </button>
                </div>

                {service.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 border border-red-300 text-red-600 rounded-[4px] text-xs hover:bg-red-50 transition-colors flex items-center"
                      onClick={() => handleRejectModal(service)}
                      disabled={Boolean(loadingActions[service.serviceId])}
                    >
                      {loadingActions[service.serviceId] === "rejecting" ? (
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
                      onClick={() => handleAccept(service)}
                      disabled={Boolean(loadingActions[service.serviceId])}
                    >
                      {loadingActions[service.serviceId] === "approving" ? (
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
                {service.status === "approved" && (
                  <div className="flex items-center gap-2">
                    <button
                      className={`px-3 py-1.5 border rounded-[4px] text-xs transition-colors flex items-center ${service.is_active ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => handleToggleActive(service)}
                      disabled={Boolean(loadingActions[service.serviceId])}
                    >
                      {loadingActions[service.serviceId] === "toggling" ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Updating...
                        </>
                      ) : (
                        service.is_active ? 'Deactivate' : 'Activate'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-3 items-center">
          <button 
            className="px-3 py-1.5 border border-gray-300 rounded-[4px] text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <div className="text-sm text-gray-600">{page} / {totalPages}</div>
          <button 
            className="px-3 py-1.5 border border-gray-300 rounded-[4px] text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={page >= totalPages} 
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* View Details Modal (kept but not opened since openDetails navigates away) */}
      {viewOpen && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-start md:items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white border border-gray-200 rounded-[4px] w-full max-w-4xl p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Service Details</h3>
              <button 
                className="px-2 py-1 border border-gray-300 rounded-[4px] text-sm text-gray-700 hover:bg-gray-50"
                onClick={closeDetails}
              >
                ✕
              </button>
            </div>

            {viewLoading ? (
              <div className="py-12 text-center">Loading details...</div>
            ) : viewError ? (
              <div className="py-12 text-center text-red-500">{viewError}</div>
            ) : serviceDetail ? (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={(serviceDetail?.ServiceImages?.[0]?.image_path || "").startsWith("http")
                      ? serviceDetail.ServiceImages[0].image_path
                      : `${BASE_URL}${serviceDetail?.ServiceImages?.[0]?.image_path || ""}`}
                    alt={serviceDetail?.Service?.name || "service image"}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                    onError={(e) => { e.currentTarget.src = "/placeholder-service.jpg"; }}
                  />
                  <div className="text-sm text-slate-600 mb-2">Category: {serviceDetail?.Service?.name || "N/A"}</div>
                  <div className="text-lg font-semibold">Rs. {serviceDetail?.rate ? parseFloat(serviceDetail.rate).toFixed(0) : "N/A"}</div>
                  <div className="text-sm text-slate-500 mt-2">Status: <span className={`inline-block px-2 py-1 rounded-full text-xs ${statusBadge(serviceDetail?.status)}`}>{serviceDetail?.status}</span></div>
                </div>

                <div>
                  <h4 className="font-semibold">Description</h4>
                  <p className="text-sm text-slate-700 mt-2">{serviceDetail?.description || "No description"}</p>

                  <div className="mt-4">
                    <h4 className="font-semibold">Includes</h4>
                    <ul className="list-disc pl-5 mt-2 text-sm text-slate-700">
                      {(serviceDetail?.includes || []).length > 0 ? serviceDetail.includes.map((inc, i) => <li key={i}>{inc}</li>) : <li>N/A</li>}
                    </ul>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-semibold">Locations</h4>
                    {(serviceDetail?.ServiceLocations || []).map((loc, i) => (
                      <div key={i} className="text-sm text-slate-600 mt-2">
                        <div>Lat: {loc.latitude}, Lng: {loc.longitude}</div>
                        <div>Radius: {loc.radius} km</div>
                        <div>Address: {loc.address || "N/A"}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <h4 className="font-semibold">Schedules</h4>
                    {(serviceDetail?.ServiceSchedules || []).map((s) => (
                      <div key={s.id} className="text-sm text-slate-600 mt-2">
                        Day: {s.day_of_week} • {s.start_time} - {s.end_time}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex gap-2">
                    {serviceDetail?.status === "pending" && (
                      <>
                        <button
                          className="px-3 py-1.5 border border-red-300 text-red-600 rounded-[4px] text-sm hover:bg-red-50 transition-colors flex items-center"
                          onClick={() => {
                            const reason = window.prompt("Enter rejection reason:");
                            if (reason && reason.trim()) handleVerifyService(serviceDetail.id || serviceDetail.serviceId, "reject", reason.trim()).then(() => closeDetails());
                          }}
                          disabled={Boolean(loadingActions[serviceDetail?.id || serviceDetail?.serviceId])}
                        >
                          {loadingActions[serviceDetail?.id || serviceDetail?.serviceId] === "rejecting" ? (
                            <>
                              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                              Rejecting...
                            </>
                          ) : (
                            "Reject"
                          )}
                        </button>
                        <button
                          className="px-3 py-1.5 bg-green-600 text-white rounded-[4px] text-sm hover:bg-green-700 transition-colors flex items-center"
                          onClick={() => handleVerifyService(serviceDetail.id || serviceDetail.serviceId, "approve").then(() => closeDetails())}
                          disabled={Boolean(loadingActions[serviceDetail?.id || serviceDetail?.serviceId])}
                        >
                          {loadingActions[serviceDetail?.id || serviceDetail?.serviceId] === "approving" ? (
                            <>
                              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Approving...
                            </>
                          ) : (
                            "Approve"
                          )}
                        </button>
                      </>
                    )}

                    {/* Show rejection reason inside detail modal if present */}
                    {serviceDetail?.status === "rejected" && (serviceDetail?.rejected_reason || serviceDetail?.rejectedReason || serviceDetail?.rejectionMessage) && (
                      <div className="w-full rounded-[4px] bg-red-50 border border-red-200 text-red-700 p-3 mt-4">
                        <div className="font-semibold text-sm">Rejection Reason</div>
                        <div className="text-sm whitespace-pre-wrap mt-1">{serviceDetail?.rejected_reason || serviceDetail?.rejectedReason || serviceDetail?.rejectionMessage}</div>
                      </div>
                    )}

                    <button
                      className="px-3 py-1.5 border border-gray-300 rounded-[4px] text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => window.open(`${BASE_URL}${serviceDetail?.ServiceImages?.[0]?.image_path || ""}`, "_blank")}
                    >
                      Open Image
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">No details available.</div>
            )}
          </div>
        </div>
      )}

      {showRejectModal && (
        <RejectModal
          service={selectedService}
          reason={rejectionReason}
          setReason={setRejectionReason}
          onClose={() => setShowRejectModal(false)}
          onReject={handleRejectService}
          isLoading={Boolean(loadingActions[selectedService?.serviceId] === "rejecting")}
        />
      )}

      {showKycModal && (
        <KycModal
          pendingAction={pendingAction}
          onConfirm={confirmKycAction}
          onClose={() => setShowKycModal(false)}
          isLoading={Boolean(loadingActions[selectedService?.serviceId] === (pendingAction === "approve" ? "approving" : "rejecting"))}
        />
      )}
    </div>
  );
}

// Reject Modal component
function RejectModal({ service, reason, setReason, onClose, onReject, isLoading }) {
  return (
    <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-[4px] w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Reject Service</h3>
          <button
            className="px-2 py-1 border border-gray-300 rounded-[4px] text-sm text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="mb-4 text-sm">
          <p><span className="font-medium">Service:</span> {service?.serviceName}</p>
          <p><span className="font-medium">Provider:</span> {service?.serviceProviderName}</p>
        </div>
        <textarea
          className="w-full border border-gray-300 rounded-[4px] p-3 text-sm focus:ring-2 focus:ring-red-300 outline-none resize-none"
          rows={4}
          placeholder="Please provide a reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-3 justify-end pt-4">
          <button 
            className="px-3 py-1.5 border border-gray-300 rounded-[4px] text-sm text-gray-700 hover:bg-gray-50 transition-colors" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className={`px-3 py-1.5 bg-red-600 text-white rounded-[4px] text-sm hover:bg-red-700 transition-colors ${!reason.trim() || isLoading ? "opacity-50 cursor-not-allowed" : ""}`} 
            onClick={onReject} 
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Rejecting...
              </>
            ) : (
              "Reject Service"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// KYC Modal component
function KycModal({ pendingAction, onConfirm, onClose, isLoading }) {
  return (
    <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-[4px] w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Provider Not Verified</h3>
          <button 
            className="px-2 py-1 border border-gray-300 rounded-[4px] text-sm text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          This provider has not completed KYC verification. <br />
          Are you sure you want to proceed with <span className="font-medium text-green-600">{pendingAction === "approve" ? "Approving" : "Rejecting"}</span> this service?
        </p>
        <div className="flex gap-3 justify-end">
          <button 
            className="px-3 py-1.5 border border-gray-300 rounded-[4px] text-sm text-gray-700 hover:bg-gray-50 transition-colors" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className={`px-3 py-1.5 rounded-[4px] text-sm text-white transition-colors ${
              pendingAction === "approve" 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-red-600 hover:bg-red-700"
            }`} 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {pendingAction === "approve" ? "Approving..." : "Rejecting..."}
              </>
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}