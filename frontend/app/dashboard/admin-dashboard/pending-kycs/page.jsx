"use client";
import { useEffect, useState } from "react";
import { FaUserCheck, FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import AllList from "./components/allList";

import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "../../../../helper/token";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function PendingKycs() {
  const [kycData, setKycData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [counts, setCounts] = useState({ totalKycSubmissions: 0, approvedKyc: 0, pendingKyc: 0, rejectedKyc: 0 });

  const fetchPendingKyc = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kyc/pending-kyc`, {
        headers: {
          'authorization': `Bearer ${getTokenFromLocalStorage("token")}`,
          'x-refresh-token': getRefreshTokenFromLocalStorage("refreshToken"),
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch KYC data:", response.status);
        return;
      }

      const data = await response.json();
      // Parse the expected data structure
      if (data.status === "success" && data.data) {
        const { result = [], total = 0 } = data.data;
        setKycData(result);

        // Calculate stats from the data
        const pendingCount = result.filter(item => item.status === "pending").length;
        const approvedCount = result.filter(item => item.status === "approved").length;
        const rejectedCount = result.filter(item => item.status === "rejected").length;

        setStats({
          total,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount
        });
      }
    } catch (error) {
      console.error("Error fetching KYC data:", error);
    }
  };

  const fetchCounts = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/dashboard/kyc`, { 
        headers: {
          'authorization': `Bearer ${getTokenFromLocalStorage("token")}`,
          'x-refresh-token': getRefreshTokenFromLocalStorage("refreshToken"),
        },
      });
      const json = await res.json();
      const d = json?.data || {};
      setCounts({
        totalKycSubmissions: Number(d.totalKycSubmissions ?? 0),
        approvedKyc: Number(d.approvedKyc ?? 0),
        pendingKyc: Number(d.pendingKyc ?? 0),
        rejectedKyc: Number(d.rejectedKyc ?? 0),
      });
    } catch (err) {
      console.error("Failed to fetch KYC dashboard counts:", err);
    }
  };

  useEffect(() => {
    fetchPendingKyc();
    fetchCounts();
  }, []);

  const handleRefresh = async () => {
    await Promise.all([fetchPendingKyc(), fetchCounts()]);
  };


  const shownStats = {
    total: counts.totalKycSubmissions || stats.total,
    pending: counts.pendingKyc || stats.pending,
    approved: counts.approvedKyc || stats.approved,
    rejected: counts.rejectedKyc || stats.rejected,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaUserCheck className="w-6 h-6 text-green-600" />
            KYC Verification Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve provider applications and documentation</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-green-600 text-white rounded-[4px] text-sm hover:bg-green-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-[4px] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total KYC Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{shownStats.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-[4px] flex items-center justify-center">
              <FaUserCheck className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[4px] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending KYC</p>
              <p className="text-2xl font-bold text-yellow-600">{shownStats.pending}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-[4px] flex items-center justify-center">
              <FaClock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[4px] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved KYC</p>
              <p className="text-2xl font-bold text-green-600">{shownStats.approved}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-[4px] flex items-center justify-center">
              <FaCheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[4px] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected KYC</p>
              <p className="text-2xl font-bold text-red-600">{shownStats.rejected}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-[4px] flex items-center justify-center">
              <FaTimesCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* KYC List */}
      <AllList data={kycData} onDataUpdate={fetchPendingKyc} />
    </div>
  );
}