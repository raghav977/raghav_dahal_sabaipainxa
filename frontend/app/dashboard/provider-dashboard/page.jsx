"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token";
import { Calendar } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { format } from "date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ProviderDashboard() {
  const [loading, setLoading] = useState(true);
  const token = getTokenFromLocalStorage("token");
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    totalServices: 0,
    totalRevenue: 0,
  });
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/service-providers/dashboard`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-refresh-token": refreshToken,
          },
        });
        const json = await res.json();

        if (!mounted) return;

        if (json.status === "success") {
          const data = json.data || {};

          setMetrics({
            totalBookings: data.totalBookings || 0,
            totalServices: data.totalServices || 0,
            totalRevenue: data.totalRevenue || 0,
          });

          // Flatten recent bookings for easier rendering
          const bookings = (data.recentBookings || []).map((b) => ({
            id: b.id,
            status: b.status,
            contact_number: b.contact_number,
            createdAt: b.createdAt,
            customer: b.user?.name,
            customerEmail: b.user?.email,
            service: b.ServiceProviderService?.Service?.name,
            rate: b.ServiceProviderService?.rate,
            bidAmount: b.Bids?.[0]?.bidAmount || 0, // only accepted bid
          }));

          setRecentBookings(bookings);

          // Example: recent reviews fallback
          setRecentReviews([]); // replace with real fetch if you have reviews
        } else {
          setError("Failed to load dashboard data.");
        }
      } catch (err) {
        console.error("Provider dashboard error:", err);
        setError("Failed to load dashboard. Try again later.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const lineData = useMemo(() => {
    const labels = revenueSeries.map((p) => format(new Date(p.date), "MMM d"));
    const data = revenueSeries.map((p) => Number(p.value || 0));
    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data,
          borderColor: "#10B981",
          backgroundColor: "rgba(16,185,129,0.12)",
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, [revenueSeries]);

  if (loading)
    return (
      <div className="text-center py-20 text-slate-600">
        Loading dashboard...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-playfair font-semibold text-foreground">
            Provider Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of your services and performance
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Today: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
      {error && <div className="text-red-600 font-medium">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Bookings"
          value={metrics.totalBookings}
          color="green"
        />
        <MetricCard
          title="Total Services"
          value={metrics.totalServices}
          color="blue"
        />
        <MetricCard
          title="Total Revenue"
          value={`Rs. ${metrics.totalRevenue}`}
          color="emerald"
        />
      </div>
      <Card className="rounded-[4px] border">
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Recent Bookings</h3>
            <Badge className="bg-green-100 text-green-700">
              {recentBookings.length} recent
            </Badge>
          </div>
          <div className="space-y-3">
            {recentBookings.length === 0 ? (
              <div className="text-sm text-slate-500">No recent bookings</div>
            ) : (
              recentBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3 border border-green-100 rounded-lg hover:bg-green-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{b.customer}</div>
                      <div className="text-sm text-gray-600">
                        {b.service} ·{" "}
                        {format(new Date(b.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">Rs. {b.bidAmount}</div>
                      <div className="mt-1">
                        <StatusBadge status={b.status} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* --- Helpers --- */
function MetricCard({ title, value, color = "green" }) {
  const colorMap = {
    green: "bg-emerald-50 text-emerald-800",
    blue: "bg-blue-50 text-blue-800",
    emerald: "bg-emerald-50 text-emerald-800",
  };
  return (
    <Card className="h-full rounded-[4px] border">
      <CardContent className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
        <div className={`px-3 py-2 rounded-[4px] ${colorMap[color]}`}></div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  if (s === "confirmed")
    return <Badge className="bg-green-100 text-green-700">Confirmed</Badge>;
  if (s === "pending")
    return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
  if (s === "cancelled")
    return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
  return <Badge className="bg-gray-100 text-gray-700">{status || "N/A"}</Badge>;
}
