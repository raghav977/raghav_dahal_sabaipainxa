"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FaGlobe, FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash } from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"

export default function WebsitesPage() {
  const router = useRouter()
  const [websites, setWebsites] = useState([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const getToken = localStorage.getItem("token")
    setToken(getToken)
    if (getToken) {
      fetchWebsites(getToken)
    }
  }, [])

  const fetchWebsites = async (authToken) => {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/api/website-builder`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!res.ok) throw new Error("Failed to fetch websites")

      const body = await res.json()
      setWebsites(body.data || [])
    } catch (err) {
      console.error(err)
      toast.error("Failed to load websites")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId || !token) return

    setDeleting(true)
    try {
      const res = await fetch(`${BASE_URL}/api/website-builder/${deleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Failed to delete website")

      toast.success("Website deleted successfully")
      setWebsites(websites.filter(w => w.id !== deleteId))
      setShowDeleteModal(false)
      setDeleteId(null)
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete website")
    } finally {
      setDeleting(false)
    }
  }

  const handleTogglePublish = async (website) => {
    if (!token) return

    try {
      const res = await fetch(`${BASE_URL}/api/website-builder/${website.id}/publish`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_published: !website.is_published }),
      })

      if (!res.ok) throw new Error("Failed to update publish status")

      const body = await res.json()
      setWebsites(websites.map(w => w.id === website.id ? body.data : w))
      toast.success(`Website ${!website.is_published ? "published" : "unpublished"}`)
    } catch (err) {
      console.error(err)
      toast.error("Failed to update publish status")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#019561] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading websites...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FaGlobe className="text-[#019561]" />
            My Websites
          </h1>
          <p className="text-gray-600 mt-1">Create and manage your business websites</p>
        </div>
        <Link
          href="/dashboard/business-account/websites/create"
          className="flex items-center gap-2 bg-[#019561] hover:bg-[#017a4b] text-white px-4 py-2 rounded-lg transition font-medium"
        >
          <FaPlus /> Create Website
        </Link>
      </div>

      {/* Websites Grid */}
      {websites.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FaGlobe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">No websites yet</p>
          <p className="text-gray-500 mb-6">Start by creating your first website</p>
          <Link
            href="/dashboard/business-account/websites/create"
            className="inline-flex items-center gap-2 bg-[#019561] hover:bg-[#017a4b] text-white px-4 py-2 rounded-lg transition font-medium"
          >
            <FaPlus /> Create Your First Website
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map(website => (
            <div key={website.id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-[#019561] to-[#017a4b] p-4 text-white">
                <h3 className="font-bold text-lg truncate">{website.website_name}</h3>
                <p className="text-sm text-green-100">{website.website_slug}</p>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {website.is_published ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                      <FaEye className="h-3 w-3" /> Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                      <FaEyeSlash className="h-3 w-3" /> Draft
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Created: {new Date(website.createdAt).toLocaleDateString()}</p>
                  {website.custom_domain && (
                    <p className="text-[#019561] font-medium">Domain: {website.custom_domain}</p>
                  )}
                </div>

                {/* Theme Preview */}
                <div className="flex gap-2 items-center text-sm">
                  <span className="text-gray-600">Theme:</span>
                  <div className="flex gap-1">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: website.theme?.primaryColor || "#3B82F6" }}
                      title="Primary Color"
                    />
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: website.theme?.secondaryColor || "#10B981" }}
                      title="Secondary Color"
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer - Actions */}
              <div className="border-t p-4 flex gap-2">
                <Link
                  href={`/dashboard/business-account/websites/${website.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded transition font-medium text-sm"
                >
                  <FaEdit className="h-4 w-4" /> Edit
                </Link>
                <button
                  onClick={() => handleTogglePublish(website)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded transition font-medium text-sm ${
                    website.is_published
                      ? "bg-orange-50 hover:bg-orange-100 text-orange-700"
                      : "bg-green-50 hover:bg-green-100 text-green-700"
                  }`}
                >
                  {website.is_published ? (
                    <>
                      <FaEyeSlash className="h-4 w-4" /> Unpublish
                    </>
                  ) : (
                    <>
                      <FaEye className="h-4 w-4" /> Publish
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setDeleteId(website.id)
                    setShowDeleteModal(true)
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded transition font-medium text-sm"
                >
                  <FaTrash className="h-4 w-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Website?</h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. All website data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
