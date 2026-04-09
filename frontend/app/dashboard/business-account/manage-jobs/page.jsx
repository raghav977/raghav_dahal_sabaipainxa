"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import JobsList from "./JobsList";
import MapCandidateSearch from "./MapCandidateSearch";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export default function ManageJobsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [businessAccount, setBusinessAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // Decode token to get user ID
        const payloadBase64 = token.split(".")[1];
        const payload = JSON.parse(atob(payloadBase64));
        const userId = payload.userId || payload.id;

        // Fetch business account
        const baRes = await fetch(`${BASE_URL}/api/business-accounts/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!baRes.ok) {
          throw new Error("No business account found. Please register first.");
        }

        const baData = await baRes.json();
        setBusinessAccount(baData.data || baData);

        // Fetch jobs for this user
        const jobsRes = await fetch(`${BASE_URL}/api/jobs/business?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          console.log("Fetched jobs data:", jobsData);
          setJobs(jobsData.results || jobsData.data.data || []);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Cannot Access</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard/business-account")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">📋 Manage Jobs</h1>
          <p className="text-gray-600 mt-1">Create, edit, and track job applications</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === "jobs"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            📋 Your Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === "search"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            🗺️ Find Candidates
          </button>
        </div>

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div>
            <div className="mb-6">
              <a
                href="/dashboard/business-account/manage-jobs/create-job"
                className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                + Create New Job
              </a>
            </div>

            {jobs?.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-600 mb-4">You haven't created any jobs yet</p>
                <a
                  href="/dashboard/business-account/manage-jobs/create-job"
                  className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
                >
                  Create First Job
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {jobs?.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-blue-500"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {job.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {job.description?.substring(0, 150)}
                          {job.description?.length > 150 ? "..." : ""}
                        </p>

                        <div className="flex flex-wrap gap-2 text-sm">
                          {job.work_type && (
                            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                              {job.work_type}
                            </span>
                          )}
                          {job.salary_min && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                              Rs. {Number(job.salary_min).toLocaleString()} - {Number(job.salary_max).toLocaleString()}
                            </span>
                          )}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              job.status === "open"
                                ? "bg-green-100 text-green-800"
                                : job.status === "closed"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {job.status}
                          </span>
                        </div>
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {job.responses?.length || 0}
                        </div>
                        <p className="text-xs text-gray-600 mb-3">Applications</p>
                        <div className="space-y-2">
                          <a
                            href={`/dashboard/business-account/manage-jobs/${job.id}`}
                            className="block text-blue-600 hover:text-blue-700 font-semibold text-sm"
                          >
                            View Applicants
                          </a>
                          <a
                            href={`/dashboard/business-account/manage-jobs/${job.id}/edit`}
                            className="block text-gray-600 hover:text-gray-700 text-sm"
                          >
                            Edit
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === "search" && (
          <div className="bg-white rounded-lg shadow p-6">
            <MapCandidateSearch />
          </div>
        )}
      </div>
    </div>
  );
}