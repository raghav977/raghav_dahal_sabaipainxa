"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export default function JobApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id;

  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // Fetch job details with responses
        const jobRes = await fetch(`${BASE_URL}/api/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!jobRes.ok) {
          throw new Error("Failed to load job details");
        }

        const jobData = await jobRes.json();
        const jobPayload = jobData.data || jobData;
        setJob(jobPayload);

        // Extract applicants from responses
        if (jobPayload.responses && Array.isArray(jobPayload.responses)) {
          setApplicants(jobPayload.responses);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load job details");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchData();
    }
  }, [jobId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Cannot Load Job</h1>
          <p className="text-gray-600 mb-6">{error || "Job not found"}</p>
          <button
            onClick={() => router.push("/dashboard/business-account/manage-jobs")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Go Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const filteredApplicants = applicants.filter((applicant) => {
    if (activeTab === "all") return true;
    return applicant.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <button
                onClick={() => router.push("/dashboard/business-account/manage-jobs")}
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold mb-2"
              >
                ← Back to Jobs
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-600 mt-1">View and manage applicants</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Job Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold uppercase">Total Applications</p>
            <p className="text-4xl font-bold text-blue-600 mt-2">{applicants.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold uppercase">Status</p>
            <div className="mt-2">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  job.status === "open"
                    ? "bg-green-100 text-green-800"
                    : job.status === "closed"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {job.status || "Draft"}
              </span>
            </div>
          </div>
          {job.salary_min && (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-semibold uppercase">Salary Range</p>
              <p className="text-xl font-bold text-gray-900 mt-2">
                Rs. {job.salary_min.toLocaleString()} - {job.salary_max?.toLocaleString()}
              </p>
            </div>
          )}
          {job.work_type && (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-semibold uppercase">Work Type</p>
              <p className="text-lg font-bold text-gray-900 mt-2">{job.work_type}</p>
            </div>
          )}
        </div>

        {/* Applicants Section */}
        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-4 font-semibold border-b-2 transition ${
                  activeTab === "all"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                All ({applicants.length})
              </button>
              <button
                onClick={() => setActiveTab("applied")}
                className={`px-4 py-4 font-semibold border-b-2 transition ${
                  activeTab === "applied"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Applied ({applicants.filter((a) => a.status === "applied").length})
              </button>
              <button
                onClick={() => setActiveTab("reviewed")}
                className={`px-4 py-4 font-semibold border-b-2 transition ${
                  activeTab === "reviewed"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Reviewed ({applicants.filter((a) => a.status === "reviewed").length})
              </button>
              <button
                onClick={() => setActiveTab("selected")}
                className={`px-4 py-4 font-semibold border-b-2 transition ${
                  activeTab === "selected"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Selected ({applicants.filter((a) => a.status === "selected").length})
              </button>
              <button
                onClick={() => setActiveTab("rejected")}
                className={`px-4 py-4 font-semibold border-b-2 transition ${
                  activeTab === "rejected"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Rejected ({applicants.filter((a) => a.status === "rejected").length})
              </button>
            </div>
          </div>

          {/* Applicants List */}
          <div className="p-6">
            {filteredApplicants.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-600">No applicants in this category</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplicants.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition flex items-start justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xl">👤</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {applicant.user?.full_name || applicant.user?.username || "Anonymous"}
                          </h3>
                          <p className="text-gray-600 text-sm">{applicant.user?.email}</p>
                        </div>
                      </div>

                      {applicant.cover_letter && (
                        <div className="mt-3 bg-gray-50 rounded p-4">
                          <p className="text-xs font-semibold text-gray-600 mb-1">Cover Letter:</p>
                          <p className="text-gray-700 text-sm">
                            {applicant.cover_letter.substring(0, 200)}
                            {applicant.cover_letter.length > 200 ? "..." : ""}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3 mt-4 text-xs text-gray-600">
                        <span>📅 Applied on {new Date(applicant.createdAt || applicant.created_at).toLocaleDateString()}</span>
                        {applicant.user?.phone && <span>📞 {applicant.user.phone}</span>}
                      </div>
                    </div>

                    <div className="ml-6">
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
                        applicant.status === "applied"
                          ? "bg-blue-100 text-blue-800"
                          : applicant.status === "reviewed"
                          ? "bg-purple-100 text-purple-800"
                          : applicant.status === "selected"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {applicant.status || "Applied"}
                      </div>
                      <div className="space-y-2 text-right">
                        <a
                          href={`/users/${applicant.user?.id}`}
                          className="block text-blue-600 hover:text-blue-700 text-sm font-semibold"
                        >
                          View Profile
                        </a>
                        {applicant.user?.resume && (
                          <a
                            href={applicant.user}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-blue-600 hover:text-blue-700 text-sm font-semibold"
                          >
                            View Resume
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Job Details Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Job Details</h2>

              {job.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                </div>
              )}

              {job.requirements && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Requirements</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                </div>
              )}

              {job.benefits && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Benefits</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{job.benefits}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📍 Location & Contact</h2>

              <div className="space-y-3 text-sm">
                {job.preferred_location && (
                  <div>
                    <p className="text-gray-600 font-semibold">📍 Location</p>
                    <p className="text-gray-900">{job.preferred_location}</p>
                  </div>
                )}
                {job.address && (
                  <div>
                    <p className="text-gray-600 font-semibold">🏢 Address</p>
                    <p className="text-gray-900">{job.address}</p>
                  </div>
                )}
                {job.contact_email && (
                  <div>
                    <p className="text-gray-600 font-semibold">📧 Email</p>
                    <a
                      href={`mailto:${job.contact_email}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {job.contact_email}
                    </a>
                  </div>
                )}
                {job.contact_phone && (
                  <div>
                    <p className="text-gray-600 font-semibold">📞 Phone</p>
                    <p className="text-gray-900">{job.contact_phone}</p>
                  </div>
                )}
                {job.application_deadline && (
                  <div>
                    <p className="text-gray-600 font-semibold">⏱️ Deadline</p>
                    <p className="text-gray-900">
                      {new Date(job.application_deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <a
                  href={`/dashboard/business-account/manage-jobs/${job.id}/edit`}
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  ✏️ Edit Job
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
