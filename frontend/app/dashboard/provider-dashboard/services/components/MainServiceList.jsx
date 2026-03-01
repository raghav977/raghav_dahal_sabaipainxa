"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Eye, Trash2, Package, Search, Edit2 } from "lucide-react";
import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import ServiceDetailModal from "./ServiceDetailModal";
import AddPackageModal from "./AddPackageModal";
import { fetchMyServicesTitleRate } from "@/app/redux/thunks/serviceThunks";
import { useRouter } from "next/navigation";
import AddService from "./AddService";

export default function MainServiceList() {
  const token = getTokenFromLocalStorage("token");
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
  const dispatch = useDispatch();
  const {
    list = [],
    loading,
    error,
    currentPage = 1,
    totalPages = 1,
  } = useSelector((state) => state.servicesReal.myServices || {});

  console.log("THis is my loaidng", list);

  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const router = useRouter();

  const [editingService, setEditingService] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  // per-service loading state for actions like toggling active status
  const [loadingActions, setLoadingActions] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [addPackageOpen, setAddPackageOpen] = useState(false);
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const limit = 12;

  // UI state
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    dispatch(fetchMyServicesTitleRate({ limit, offset: (page - 1) * limit }));
  }, [dispatch, page]);

  // handlers
  const openView = (service) => {
    router.push(
      `/dashboard/provider-dashboard/services/service-detail/${service.id}`
    );
  };

  const openEdit = (service) => {
    router.push(`/dashboard/provider-dashboard/services/edit/${service.id}`);
  };

  const handleAddPackage = (service) => {
    setModalData(service);
    setAddPackageOpen(true);
  };

  const handleDelete = async (service) => {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      `Delete service "${
        service?.Service?.name || "Service"
      }"? This cannot be undone.`
    );
    if (!ok) return;
    try {
      const response = await fetch(
        `${BASE_URL}/api/services/delete/${service.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-refresh-token": refreshToken,
          },
        }
      );
      if (!response.ok) {
        const txt = await response.text().catch(() => "");
        throw new Error(txt || "Failed to delete service");
      }
      toast({
        title: "Deleted",
        description: "Service deleted successfully",
        variant: "success",
      });
      dispatch(fetchMyServicesTitleRate({ limit, offset: (page - 1) * limit }));
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Delete failed",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (service) => {
    if (!service || !service.id) return;
    const id = service.id;
    setLoadingActions((p) => ({ ...p, [id]: 'toggling' }));
    try {
      const res = await fetch(`${BASE_URL}/api/services/toggle-active-status/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(refreshToken ? { 'x-refresh-token': refreshToken } : {}),
        },
        body: JSON.stringify({ is_active: !service.is_active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: 'Error', description: data.message || 'Failed to toggle active status', variant: 'destructive' });
        return;
      }
      toast({ title: 'Updated', description: `Service ${data?.serviceProviderService ? (data.serviceProviderService.is_active ? 'activated' : 'deactivated') : (service.is_active ? 'deactivated' : 'activated') } successfully`, variant: 'success' });
      // refresh list
      dispatch(fetchMyServicesTitleRate({ limit, offset: (page - 1) * limit }));
    } catch (err) {
      console.error('Error toggling active status:', err);
      toast({ title: 'Error', description: 'Network error while toggling status', variant: 'destructive' });
    } finally {
      setLoadingActions((p) => {
        const copy = { ...p };
        delete copy[id];
        return copy;
      });
    }
  };

  // client-side search / filter / sort for instant UX (backend still used for main fetch)
  const filtered = useMemo(() => {
    let items = Array.isArray(list) ? [...list] : [];
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((s) => {
        const title = s.Service?.name || "";
        const desc = s.description || "";
        return (
          title.toLowerCase().includes(q) || desc.toLowerCase().includes(q)
        );
      });
    }
    if (statusFilter !== "all") {
      items = items.filter(
        (s) => String(s.status || "").toLowerCase() === statusFilter
      );
    }
    if (sortBy === "rate-asc")
      items.sort((a, b) => Number(a.rate || 0) - Number(b.rate || 0));
    if (sortBy === "rate-desc")
      items.sort((a, b) => Number(b.rate || 0) - Number(a.rate || 0));
    if (sortBy === "newest")
      items.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    return items;
  }, [list, query, statusFilter, sortBy]);

  const placeholderImage = "/images/service-placeholder.png";

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const halfMaxPages = Math.floor(maxPagesToShow / 2);
    let startPage = Math.max(1, page - halfMaxPages);
    let endPage = Math.min(totalPages, page + halfMaxPages);

    if (page - 1 <= halfMaxPages) {
      endPage = Math.min(totalPages, maxPagesToShow);
    }

    if (totalPages - page <= halfMaxPages) {
      startPage = Math.max(1, totalPages - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(
        <PaginationItem key="start-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setPage(i);
            }}
            isActive={i === page}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      pageNumbers.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    return pageNumbers;
  };

  return (
    <main className="px-6 py-8 bg-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={16} />
            </span>
            <input
              aria-label="Search services"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or description"
              className="w-full pl-10 pr-3 py-2 rounded-[4px] border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[4px] border border-gray-300 px-3 py-2 bg-white"
            aria-label="Filter by status"
          >
            <option value="all">All status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-[4px] border border-gray-300 px-3 py-2 bg-white"
            aria-label="Sort services"
          >
            <option value="newest">Newest</option>
            <option value="rate-desc">Rate: High → Low</option>
            <option value="rate-asc">Rate: Low → High</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-[4px] border border-gray-300"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
              setSortBy("newest");
            }}
          >
            Reset
          </Button>
          <Button
            onClick={() => {
              setPage(1);
              dispatch(fetchMyServicesTitleRate({ limit, offset: 0 }));
            }}
            className="bg-green-600 hover:bg-green-700 rounded-[4px] border-0"
          >
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="animate-pulse bg-white border rounded-[4px] border-gray-300"
            >
              <div className="h-40 bg-slate-100" />
              <CardContent>
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/3 mb-3" />
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-slate-100 rounded" />
                  <div className="h-8 w-20 bg-slate-100 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-600">
          <div className="mx-auto text-slate-400">
            <Package size={48} />
          </div>
          <p className="mt-4">
            No services found. Add your first service to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((service) => {
              const img =
                service.ServiceImages?.[0]?.image_path ||
                service.ServiceImages?.[0]?.image_path ||
                placeholderImage;
              console.log("This is service image", img);
              const status = String(service.status || "").toLowerCase();
              return (
                <Card
                  key={service.id}
                  className="bg-white border border-gray-200 rounded-[4px] overflow-hidden hover:border-gray-300 transition-colors"
                >
                  {/* Image Section */}
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={
                        img && String(img).startsWith("http")
                          ? img
                          : `${BASE_URL}${img}`
                      }
                      alt={service.Service?.name || "service"}
                      className="w-full h-full object-cover"
                    />
                    {/* Rate Badge */}
                    <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-[4px] text-xs font-medium border border-gray-200">
                      Rs. {Number(service.rate || 0).toFixed(0)}/hr
                    </div>
                    {/* Status Badge */}
                    <div
                      className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                        status === "approved"
                          ? "text-green-700 bg-green-200"
                          : status === "pending"
                          ? "text-yellow-700 bg-yellow-200"
                          : "text-red-700 bg-red-200"
                      }`}
                    >
                      {status || "unknown"}
                    </div>

                    {/* Active / Inactive Badge (shows is_active) */}
                    {typeof service.is_active !== "undefined" && (
                      <div className={`absolute top-12 right-3 px-2 py-1 rounded-full text-xs font-medium ${service.is_active ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    {/* Title and Date */}
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                        {service.Service?.name || "Untitled"}
                      </h3>
                      <div className="text-sm text-gray-500">
                        Since {service.createdAt
                          ? (() => {
                              const d = new Date(service.createdAt);
                              if (isNaN(d)) return "N/A";
                              const month = d.toLocaleString("en-US", { month: "short" });
                              const day = d.getDate();
                              const year = d.getFullYear();
                              return `${month} ${day}, ${year}`;
                            })()
                          : "N/A"}
                      </div>
                    </div>

                    {/* Location Tags */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {(service.ServiceLocations || [])
                          .slice(0, 2)
                          .map((loc, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-[4px] border border-gray-200"
                            >
                              {loc.city || loc.address || "Location"}
                            </span>
                          ))}
                        {service.Service?.package_enabled && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-[4px] border border-blue-200">
                            Packages
                          </span>
                        )}
                      </div>
                    </div>

                    {/* If the service was rejected, show the rejection reason */}
                    {status === "rejected" && (
                      (() => {
                        const rejectedReason =
                          service.rejected_reason ||
                          service.rejectedReason ||
                          service.rejectionMessage ||
                          service.rejected_reason;
                        if (!rejectedReason) return null;
                        return (
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 whitespace-pre-wrap">
                            <strong className="block mb-1">Rejection reason:</strong>
                            <span>{rejectedReason}</span>
                          </div>
                        );
                      })()
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openView(service)}
                        className="flex-1 rounded-[4px] border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Eye size={14} className="mr-1" />
                        View
                      </Button>

                      {service.Service?.package_enabled && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddPackage(service)}
                          className="rounded-[4px] border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <Package size={14} />
                        </Button>
                      )}

                      {service.status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(service)}
                          className={`rounded-[4px] ${service.is_active ? 'bg-green-600 text-white hover:bg-green-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                          disabled={Boolean(loadingActions[service.id])}
                        >
                          {loadingActions[service.id] === 'toggling' ? (
                            <>
                              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                              Updating...
                            </>
                          ) : (
                            service.is_active ? 'Deactivate' : 'Activate'
                          )}
                        </Button>
                      )}

                      {/* <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(service)}
                        className="rounded-[4px] border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </Button> */}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {isEditOpen && (
            <AddService
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              editService={editingService}
            />
          )}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-slate-600">
              Showing page {page} of {totalPages}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                    disabled={page <= 1}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    {page}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                    disabled={page >= totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}

      <AddPackageModal
        open={addPackageOpen}
        onClose={() => setAddPackageOpen(false)}
        serviceProviderServiceId={modalData?.id}
      />
    </main>
  );
}
