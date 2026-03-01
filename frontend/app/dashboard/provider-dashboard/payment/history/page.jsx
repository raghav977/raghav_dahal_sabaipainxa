"use client";

import React, { useEffect, useState } from "react";
import { XCircle, CheckCircle, AlertCircle, User, Mail, Calendar, DollarSign, Star, FileText, Package } from "lucide-react";
  
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, Eye } from "lucide-react";
import { format } from "date-fns";

import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "initiated", label: "Initiated" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "released", label: "Released" },
];


export default function PaymentHistory() {
  const token = getTokenFromLocalStorage("token");
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [detail, setDetail] = useState(null);
  const handleViewDetail = async (bookingId) => {
    if (!bookingId) return;
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);
    try {
      const res = await fetch(`${API_BASE}/api/booking/detail/${bookingId}`, { 
        headers:{
          'authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        }
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || json?.error || `Failed (${res.status})`);
      setDetail(json?.data?.booking || null);
    } catch (e) {
      setDetailError(e.message || String(e));
    } finally {
      setDetailLoading(false);
    }
  };
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL(`${API_BASE}/api/payments/provider/payment-history`);
        if (statusFilter && statusFilter !== "all") url.searchParams.set("status", statusFilter);
        const res = await fetch(url.toString(), { 
          headers:{
            'authorization': `Bearer ${token}`,
            'x-refresh-token': refreshToken,
          }
        });
        let data = null;
        if (res && res.ok) {
          const json = await res.json().catch(() => null);
          data = Array.isArray(json?.message) ? json.message : [];
        }
        if (!mounted) return;
        setRecords(data || []);
      } catch (err) {
        setError("Failed to load payment history");
        setRecords([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [statusFilter]);

  // client-side search
  const filtered = records.filter((rec) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      String(rec.id || "").toLowerCase().includes(q) ||
      String(rec.bookingId || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="lg:p-10">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Payment History</h1>
            <p className="text-sm text-slate-500 mt-1">All payouts and payment records for your account.</p>
          </div>
        </div>

        <Card>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Input
                  placeholder="Search by payment id or booking id..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-w-0"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-md border border-slate-200 px-3 py-2 bg-white"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-slate-500">
                {loading ? "Loading..." : `${filtered.length} records`}
              </div>
            </div>

            {error && <div className="text-red-600 mb-3">{error}</div>}

            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse">
                <thead>
                  <tr className="text-left text-sm text-slate-700 border-b">
                    <th className="px-3 py-2">Payment ID</th>
                    <th className="px-3 py-2">Booking ID</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Currency</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Created At</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-sm text-slate-500">No records found</td>
                    </tr>
                  ) : (
                    filtered.map((rec) => (
                      <tr key={rec.id} className="border-b last:border-b-0 hover:bg-slate-50">
                        <td className="px-3 py-3 align-top font-mono text-xs">{rec.id}</td>
                        <td className="px-3 py-3 align-top">{rec.bookingId || "—"}</td>
                        <td className="px-3 py-3 align-top font-medium">Rs. {Number(rec.amount || 0).toLocaleString()}</td>
                        <td className="px-3 py-3 align-top">{rec.currency || "NPR"}</td>
                        <td className="px-3 py-3 align-top"><StatusBadge status={rec.status} /></td>
                        <td className="px-3 py-3 align-top">{rec.createdAt ? format(new Date(rec.createdAt), "MMM d, yyyy HH:mm") : "—"}</td>
                        <td className="px-3 py-3 align-top">
                          <Button size="sm" variant="outline" onClick={() => handleViewDetail(rec.bookingId)}>
                            <Eye className="w-4 h-4" /> <span className="ml-2 hidden sm:inline">View Detail</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
      {/* Detail Modal */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => setDetailOpen(false)}
          />
          <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Booking Details</h2>
                {detail?.id && (
                  <p className="text-indigo-100 mt-1">Booking #{detail.id}</p>
                )}
              </div>
              <button
                onClick={() => setDetailOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {detailLoading ? (
                <div className="py-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4" />
                  <p className="text-gray-500">Loading details...</p>
                </div>
              ) : detailError ? (
                <div className="py-12 text-center">
                  <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                  <p className="text-rose-600 font-medium">{detailError}</p>
                </div>
              ) : !detail ? (
                <div className="py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No details found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* General Info */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
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
                        <p className="text-sm text-gray-700">{detail.createdAt ? format(new Date(detail.createdAt), "MMM d, yyyy HH:mm") : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Client Completed</p>
                        <div className="flex items-center gap-2">
                          {detail.clientCompleted ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-600" />
                          )}
                          <span className="text-sm font-semibold">
                            {detail.clientCompleted ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Provider Completed</p>
                        <div className="flex items-center gap-2">
                          {detail.providerCompleted ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-600" />
                          )}
                          <span className="text-sm font-semibold">
                            {detail.providerCompleted ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-emerald-600" />
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
                          <Mail className="w-4 h-4 text-gray-400" />
                          {detail.user?.email || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Service Info */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-purple-600" />
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
                          <p className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
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
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-orange-600" />
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
                          <Mail className="w-4 h-4 text-gray-400" />
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
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-600" />
                          )}
                          <span className="text-sm font-semibold">
                            {detail.ServiceProviderService?.ServiceProvider?.is_verified ? "Verified" : "Not Verified"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ratings */}
                  {detail.Ratings && detail.Ratings.length > 0 && (
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-600" />
                        Ratings & Reviews
                      </h3>
                      <div className="space-y-4">
                        {detail.Ratings.map((rating, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-4 border border-yellow-100">
                            <div className="flex items-center gap-2 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < (rating.rating || 0)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                              <span className="text-sm font-bold text-gray-700">
                                {rating.rating || 0}/5
                              </span>
                            </div>
                            {rating.review && (
                              <p className="text-sm text-gray-700">{rating.review}</p>
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
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = String(status || "unknown").toLowerCase();
  if (s === "completed" || s === "paid" || s === "success") return <Badge className="bg-emerald-100 text-emerald-800">Completed</Badge>;
  if (s === "pending") return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
  if (s === "failed" || s === "cancelled") return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
  return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
}

// fallback sample data when backend not available
function sampleData() {
  const now = new Date();
  return [
    {
      id: 1,
      invoice_id: "INV-2025-001",
      invoice_to: "Ram Shrestha",
      customer: "Ram Shrestha",
      email: "ram@example.com",
      amount: 1200,
      currency: "NPR",
      date: now.toISOString(),
      status: "completed",
      invoice_url: `${API_BASE}/sample-invoices/INV-2025-001.pdf`,
    },
    {
      id: 2,
      invoice_id: "INV-2025-002",
      invoice_to: "Gita Rai",
      customer: "Gita Rai",
      email: "gita@example.com",
      amount: 800,
      currency: "NPR",
      date: new Date(now.getTime() - 86400000).toISOString(),
      status: "pending",
      invoice_url: `${API_BASE}/sample-invoices/INV-2025-002.pdf`,
    },
    {
      id: 3,
      invoice_id: "INV-2025-003",
      invoice_to: "Suman Karki",
      customer: "Suman Karki",
      email: "suman@example.com",
      amount: 1500,
      currency: "NPR",
      date: new Date(now.getTime() - 2 * 86400000).toISOString(),
      status: "failed",
      invoice_url: `${API_BASE}/sample-invoices/INV-2025-003.pdf`,
    },
  ];
}