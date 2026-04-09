"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export default function BusinessDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [businessAccount, setBusinessAccount] = useState(null);
  const [jobs, setJobs] = useState([]);
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

        // Decode token
        const payloadBase64 = token.split(".")[1];
        const payload = JSON.parse(atob(payloadBase64));
        const userId = payload.userId || payload.id;

        // Fetch user profile
        const userRes = await fetch(`${BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!userRes.ok) throw new Error("Failed to fetch user");
        const userData = await userRes.json();
        setUser(userData.data || userData);

        // Fetch business account
        const baRes = await fetch(`${BASE_URL}/api/business-accounts/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (baRes.ok) {
          const baData = await baRes.json();
          setBusinessAccount(baData.data || baData);
        }

        // Fetch user's jobs
        const jobsRes = await fetch(`${BASE_URL}/api/jobs?created_by=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobs(jobsData.results || jobsData.data || []);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load dashboard");
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
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🏢 Business Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.name || "Welcome"}, manage your jobs and find candidates
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* KYC Status Card */}
        <div className="mb-8">
          {businessAccount ? (
            <div
              className={`rounded-lg shadow p-6 border-l-4 ${
                businessAccount.is_active
                  ? "bg-green-50 border-green-500"
                  : businessAccount.kyc_status === "pending"
                  ? "bg-yellow-50 border-yellow-500"
                  : "bg-red-50 border-red-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    {businessAccount.is_active ? (
                      <span className="text-green-700">
                        ✓ Account Verified & Active
                      </span>
                    ) : businessAccount.kyc_status === "pending" ? (
                      <span className="text-yellow-700">
                        ⏳ Awaiting KYC Verification
                      </span>
                    ) : (
                      <span className="text-red-700">
                        ✗ KYC Verification Failed
                      </span>
                    )}
                  </h2>

                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Company:</strong> {businessAccount.company_name}
                    </p>
                    <p>
                      <strong>Email:</strong> {businessAccount.company_email}
                    </p>
                    {businessAccount.industry && (
                      <p>
                        <strong>Industry:</strong> {businessAccount.industry}
                      </p>
                    )}
                    <p>
                      <strong>Status:</strong>{" "}
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          businessAccount.is_active
                            ? "bg-green-200 text-green-800"
                            : businessAccount.kyc_status === "pending"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {businessAccount.kyc_status}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {businessAccount.is_active && (
                    <div className="text-5xl">✅</div>
                  )}
                  {businessAccount.kyc_status === "pending" && (
                    <div className="text-5xl">⏳</div>
                  )}
                  {!businessAccount.is_active &&
                    businessAccount.kyc_status !== "pending" && (
                      <div className="text-5xl">❌</div>
                    )}
                </div>
              </div>

              {!businessAccount.is_active && (
                <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded text-sm">
                  <strong>Note:</strong> Your account must be verified before you can create jobs
                  and search for candidates. Our admin team will review your KYC documents
                  within 24-48 hours.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">
                Register Your Business Account
              </h2>
              <p className="text-blue-700 mb-4">
                You need to register a business account to post jobs and find candidates.
              </p>
              <Link
                href="/business-account/register"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Start Registration →
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {businessAccount?.is_active && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link
              href="/dashboard/business-account/manage-jobs/create"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-t-4 border-blue-500"
            >
              <div className="text-3xl mb-2">➕</div>
              <h3 className="font-semibold text-gray-900">Create New Job</h3>
              <p className="text-sm text-gray-600 mt-1">
                Post a new job opening
              </p>
            </Link>

            <Link
              href="/dashboard/business-account/manage-jobs/search"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-t-4 border-green-500"
            >
              <div className="text-3xl mb-2">🗺️</div>
              <h3 className="font-semibold text-gray-900">Find Candidates</h3>
              <p className="text-sm text-gray-600 mt-1">
                Search candidates by location
              </p>
            </Link>

            <Link
              href="/dashboard/business-account/manage-jobs"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-t-4 border-purple-500"
            >
              <div className="text-3xl mb-2">📋</div>
              <h3 className="font-semibold text-gray-900">View All Jobs</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage your job postings
              </p>
            </Link>
          </div>
        )}

        {/* Jobs Section */}
        {businessAccount?.is_active && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  📊 Your Jobs ({jobs.length})
                </h2>
                <Link
                  href="/dashboard/business-account/manage-jobs/create"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  + New Job
                </Link>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {jobs.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-5xl mb-3">📭</div>
                  <p className="text-gray-600 mb-4">
                    You haven't created any jobs yet
                  </p>
                  <Link
                    href="/dashboard/business-account/manage-jobs/create"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                  >
                    Create Your First Job
                  </Link>
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {job.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {job.description?.substring(0, 100)}
                          {job.description?.length > 100 ? "..." : ""}
                        </p>

                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          {job.work_type && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {job.work_type}
                            </span>
                          )}
                          {job.salary_min && job.salary_max && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                              Rs. {job.salary_min} - {job.salary_max}
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 rounded ${
                              job.status === "open"
                                ? "bg-green-100 text-green-800"
                                : job.status === "closed"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {job.status}
                          </span>
                        </div>
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {job.responses?.length || 0}
                        </div>
                        <div className="text-xs text-gray-600">Applications</div>
                        <div className="mt-3 space-y-1">
                          <Link
                            href={`/dashboard/business-account/manage-jobs/${job.id}`}
                            className="block text-blue-600 hover:underline text-xs"
                          >
                            View Details
                          </Link>
                          <Link
                            href={`/dashboard/business-account/manage-jobs/${job.id}/edit`}
                            className="block text-blue-600 hover:underline text-xs"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
