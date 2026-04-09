"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export default function AdminKYCVerificationPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [verifyingId, setVerifyingId] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch(
          `${BASE_URL}/api/business-accounts/admin/list?limit=50`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          if (res.status === 403) {
            throw new Error("You don't have permission to access this page");
          }
          throw new Error("Failed to load business accounts");
        }

        const data = await res.json();
        setAccounts(data.results || data.data || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load accounts");
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [router]);

  const handleVerify = async (accountId, isApproved) => {
    setVerifyingId(accountId);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const res = await fetch(
        `${BASE_URL}/api/business-accounts/${accountId}/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            is_active: isApproved,
            kyc_status: isApproved ? "verified" : "rejected",
          }),
        }
      );

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.message || "Failed to verify account");
      }

      // Update local state
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId
            ? {
                ...acc,
                is_active: isApproved,
                kyc_status: isApproved ? "verified" : "rejected",
                verified_at: new Date().toISOString(),
              }
            : acc
        )
      );

      setReviewingId(null);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to verify account");
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredAccounts = accounts.filter(
    (acc) => filterStatus === "all" || acc.kyc_status === filterStatus
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading KYC requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
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
          <h1 className="text-3xl font-bold text-gray-900">🔍 KYC Verification</h1>
          <p className="text-gray-600 mt-1">Review and approve business account registrations</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-50 rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm font-semibold uppercase">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {accounts.filter((a) => a.kyc_status === "pending").length}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-semibold uppercase">Verified</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {accounts.filter((a) => a.kyc_status === "verified").length}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-6 border-l-4 border-red-500">
            <p className="text-gray-600 text-sm font-semibold uppercase">Rejected</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {accounts.filter((a) => a.kyc_status === "rejected").length}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-semibold uppercase">Total</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{accounts.length}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200 flex gap-6">
          {["all", "pending", "verified", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 font-semibold border-b-2 transition capitalize ${
                filterStatus === status
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {status === "pending"
                ? "⏳ Pending"
                : status === "verified"
                ? "✅ Verified"
                : status === "rejected"
                ? "❌ Rejected"
                : "📋 All"}
            </button>
          ))}
        </div>

        {/* Accounts List */}
        {filteredAccounts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-600">
              No {filterStatus === "all" ? "accounts" : `${filterStatus} accounts`} to display
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition border-l-4 border-blue-500 p-6"
              >
                <div className="flex items-start justify-between gap-6">
                  {/* Left Content */}
                  <div className="flex-1">
                    {/* Company Info */}
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {account.company_name}
                      </h3>
                      <p className="text-gray-600">
                        {account.user?.full_name || account.user?.username}
                      </p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">Email</p>
                        <a
                          href={`mailto:${account.company_email}`}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          {account.company_email}
                        </a>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">Industry</p>
                        <p className="text-gray-900 text-sm">{account.industry || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">Website</p>
                        {account.website ? (
                          <a
                            href={account.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm truncate"
                          >
                            {account.website}
                          </a>
                        ) : (
                          <p className="text-gray-900 text-sm">N/A</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">Registered</p>
                        <p className="text-gray-900 text-sm">
                          {new Date(account.createdAt || account.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Admin Contact</p>
                      <p className="text-sm text-gray-900">
                        📧 {account.user?.email}
                      </p>
                      {account.user?.phone && (
                        <p className="text-sm text-gray-900">
                          📞 {account.user.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Sidebar */}
                  <div className="w-48">
                    {/* Status */}
                    <div className="mb-6">
                      <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                        account.kyc_status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : account.kyc_status === "verified"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {account.kyc_status === "pending"
                          ? "⏳ Pending Review"
                          : account.kyc_status === "verified"
                          ? "✅ Verified"
                          : "❌ Rejected"}
                      </div>

                      {account.verified_at && (
                        <p className="text-xs text-gray-600 mt-2">
                          {new Date(account.verified_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Documents */}
                    {account.kyc_status === "pending" && (
                      <div className="mb-6">
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Documents</p>
                        <div className="space-y-2">
                          {account.citizenship_card_front && (
                            <a
                              href={`${BASE_URL}/uploads/${account.citizenship_card_front}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-blue-600 hover:text-blue-700 text-xs font-semibold p-2 bg-blue-50 rounded truncate"
                            >
                              📄 Citizenship Front
                            </a>
                          )}
                          {account.citizenship_card_back && (
                            <a
                              href={`${BASE_URL}/uploads/${account.citizenship_card_back}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-blue-600 hover:text-blue-700 text-xs font-semibold p-2 bg-blue-50 rounded truncate"
                            >
                              📄 Citizenship Back
                            </a>
                          )}
                          {account.document_file && (
                            <a
                              href={`${BASE_URL}/uploads/${account.document_file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-blue-600 hover:text-blue-700 text-xs font-semibold p-2 bg-blue-50 rounded truncate"
                            >
                              📄 Document
                            </a>
                          )}
                          {account.passport_photo && (
                            <a
                              href={`${BASE_URL}/uploads/${account.passport_photo}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-blue-600 hover:text-blue-700 text-xs font-semibold p-2 bg-blue-50 rounded truncate"
                            >
                              📄 Passport
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {account.kyc_status === "pending" ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => setReviewingId(account.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded transition"
                        >
                          📋 Review Documents
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Review Modal */}
                {reviewingId === account.id && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Verify {account.company_name}?
                      </h2>

                      <p className="text-gray-600 mb-6">
                        Please review the documents before making a decision.
                      </p>

                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            handleVerify(account.id, true)
                          }
                          disabled={verifyingId === account.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg transition"
                        >
                          {verifyingId === account.id ? "Processing..." : "✅ Approve"}
                        </button>
                        <button
                          onClick={() =>
                            handleVerify(account.id, false)
                          }
                          disabled={verifyingId === account.id}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg transition"
                        >
                          {verifyingId === account.id ? "Processing..." : "❌ Reject"}
                        </button>
                        <button
                          onClick={() => setReviewingId(null)}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
