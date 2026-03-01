

"use client"

import { useEffect, useState } from "react"

import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "../../../../../helper/token";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL 

export default function RoomPaymentsSettingsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [typeFilter, setTypeFilter] = useState("") 
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState(null)

  const token = getTokenFromLocalStorage("token");
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");

  const fetchPayments = async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (typeFilter) {
        const apiType = typeFilter === "user" ? "viewer" : typeFilter
        params.set("type", apiType)
      }


  params.set('page', String(page))
  params.set('limit', String(limit))

  const url = `${BASE_URL}/api/admin/room-verification/room-payments${params.toString() ? `?${params.toString()}` : ""}`
      const res = await fetch(url, { 
        headers:{
          'authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        }
      })
      const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Failed to fetch payments")


  const list = data?.data?.data ?? data?.data ?? []
  const pag = data?.data?.pagination ?? data?.pagination ?? null
  setPayments(list || [])
  setPagination(pag)
    } catch (e) {
      setError(e.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {

    fetchPayments()

  }, [typeFilter, page, limit])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Room Payments Settings</h1>

      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Filter by type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="">All</option>
            <option value="gharbeti">Gharbeti</option>
            <option value="user">User</option>
          </select>
        </div>

        <div>
          <button
            onClick={fetchPayments}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && payments.length === 0 && (
        <div className="text-sm text-gray-600">No payments found.</div>
      )}

      {payments.length > 0 && (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-green-50">
                <th className="px-3 py-2 text-sm">ID</th>
                <th className="px-3 py-2 text-sm">User</th>
                <th className="px-3 py-2 text-sm">Email</th>
                <th className="px-3 py-2 text-sm">Amount</th>
                <th className="px-3 py-2 text-sm">Status</th>
                <th className="px-3 py-2 text-sm">Type</th>
                <th className="px-3 py-2 text-sm">Payment Date</th>
                <th className="px-3 py-2 text-sm">Created At</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2 text-sm">{p.id}</td>
                  <td className="px-3 py-2 text-sm">{p.userName || '—'}</td>
                  <td className="px-3 py-2 text-sm">{p.userEmail || '—'}</td>
                  <td className="px-3 py-2 text-sm">NPR {p.amount?.toLocaleString() || 0}</td>
                  <td className="px-3 py-2 text-sm">{p.status}</td>
                  <td className="px-3 py-2 text-sm">{p.type}</td>
                  <td className="px-3 py-2 text-sm">{p.paymentDate ? new Date(p.paymentDate).toLocaleString() : '—'}</td>
                  <td className="px-3 py-2 text-sm">{p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Pagination controls */}
      {pagination && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing page {pagination.currentPage} of {pagination.totalPages} — {pagination.totalCount} items
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.currentPage <= 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}