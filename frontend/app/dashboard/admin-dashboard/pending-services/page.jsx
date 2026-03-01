"use client";
import { useEffect, useState } from "react";
import { FaCogs, FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import PendingList from "./component/PendingList";
import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "../../../../helper/token";
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export default function PendingServices() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [counts, setCounts] = useState({ services: 0, verifiedServiceProviders: 0, pendingServiceProviders: 0, rejectedServiceProviders: 0 });
  const [selectedStatus, setSelectedStatus] = useState("pending");

  useEffect(() => {
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refresh counts when selected status changes (keeps dashboard in sync if parent or child updates status)
  useEffect(() => {
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const fetchCounts = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/dashboard/services`, { 
        headers:{
          'authorization': `Bearer ${getTokenFromLocalStorage("token")}`,
          'x-refresh-token': getRefreshTokenFromLocalStorage("refreshToken"),
        }
       });
      const json = await res.json();
      const d = json?.data || {};
      setCounts({
        services: Number(d.services ?? 0),
        verifiedServiceProviders: Number(d.verifiedServiceProviders ?? 0),
        pendingServiceProviders: Number(d.pendingServiceProviders ?? 0),
        rejectedServiceProviders: Number(d.rejectedServiceProviders ?? 0),
      });
    } catch (err) {
      console.error("Failed to fetch service dashboard counts:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaCogs className="w-6 h-6 text-green-600" />
            Pending Services Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve service applications</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-green-600 text-white rounded-[4px] text-sm hover:bg-green-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards (from dashboard API) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button onClick={() => setSelectedStatus("all")} className="bg-white border border-gray-200 rounded-[4px] p-4 text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Services</p>
              <p className="text-2xl font-bold text-gray-900">{counts.services}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-[4px] flex items-center justify-center">
              <FaCogs className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </button>

        <button onClick={() => setSelectedStatus("pending")} className="bg-white border border-gray-200 rounded-[4px] p-4 text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">{counts.pendingServiceProviders}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-[4px] flex items-center justify-center">
              <FaClock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </button>

        <button onClick={() => setSelectedStatus("approved")} className="bg-white border border-gray-200 rounded-[4px] p-4 text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Verified Providers</p>
              <p className="text-2xl font-bold text-green-600">{counts.verifiedServiceProviders}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-[4px] flex items-center justify-center">
              <FaCheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </button>

        <button onClick={() => setSelectedStatus("rejected")} className="bg-white border border-gray-200 rounded-[4px] p-4 text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected Providers</p>
              <p className="text-2xl font-bold text-red-600">{counts.rejectedServiceProviders}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-[4px] flex items-center justify-center">
              <FaTimesCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </button>
      </div>

  {/* Services List */}
  <PendingList selectedStatusProp={selectedStatus} onSelectedStatusChange={(s) => setSelectedStatus(s)} />
    </div>
  );
}