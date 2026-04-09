"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FaArrowLeft, FaGlobe } from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"

const THEMES = [
  {
    name: "Modern Blue",
    style: "modern",
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981",
    font: "Inter, sans-serif",
  },
  {
    name: "Bold Red",
    style: "bold",
    primaryColor: "#EF4444",
    secondaryColor: "#F97316",
    font: "Poppins, sans-serif",
  },
  {
    name: "Elegant Purple",
    style: "elegant",
    primaryColor: "#8B5CF6",
    secondaryColor: "#EC4899",
    font: "Georgia, serif",
  },
  {
    name: "Minimal Gray",
    style: "minimal",
    primaryColor: "#1F2937",
    secondaryColor: "#6B7280",
    font: "Inter, sans-serif",
  },
]

export default function CreateWebsitePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0])
  const [formData, setFormData] = useState({
    website_name: "",
    website_slug: "",
  })

  const handleNameChange = (e) => {
    const name = e.target.value
    setFormData({
      ...formData,
      website_name: name,
      website_slug: name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.website_name.trim()) {
      toast.error("Website name is required")
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast.error("Authentication required")
        return
      }

      const res = await fetch(`${BASE_URL}/api/website-builder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          website_name: formData.website_name,
          theme: {
            primaryColor: selectedTheme.primaryColor,
            secondaryColor: selectedTheme.secondaryColor,
            font: selectedTheme.font,
            style: selectedTheme.style,
          },
          pages: [],
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body?.message || "Failed to create website")
      }

      const body = await res.json()
      toast.success("Website created successfully!")
      setTimeout(() => {
        router.push(`/dashboard/business-account/websites/${body.data.id}/edit`)
      }, 1000)
    } catch (err) {
      console.error(err)
      toast.error(err.message || "Failed to create website")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/business-account/websites"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <FaArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FaGlobe className="text-[#019561]" />
            Create New Website
          </h1>
          <p className="text-gray-600">Build your professional business website</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Website Name */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Website Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website Name
              </label>
              <input
                type="text"
                value={formData.website_name}
                onChange={handleNameChange}
                placeholder="e.g., My Awesome Business"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#019561] focus:ring-1 focus:ring-[#019561]"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Give your website a memorable name</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website Slug
              </label>
              <input
                type="text"
                value={formData.website_slug}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated from website name. Used in your public URL.
              </p>
            </div>
          </div>
        </div>

        {/* Theme Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose a Theme</h2>
          <p className="text-gray-600 text-sm mb-4">
            Select a theme to get started. You can customize colors anytime.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {THEMES.map(theme => (
              <button
                key={theme.name}
                type="button"
                onClick={() => setSelectedTheme(theme)}
                className={`p-4 rounded-lg border-2 transition ${
                  selectedTheme.name === theme.name
                    ? "border-[#019561] bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: theme.secondaryColor }}
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{theme.name}</p>
                    <p className="text-xs text-gray-500">{theme.style}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Theme Preview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Theme Preview</h2>
          <div className="border rounded-lg overflow-hidden">
            {/* Preview Header */}
            <div
              className="p-8 text-white"
              style={{ backgroundColor: selectedTheme.primaryColor }}
            >
              <h3 className="text-2xl font-bold mb-2">{formData.website_name || "Your Website"}</h3>
              <p className="opacity-90">Professional website for your business</p>
            </div>

            {/* Preview Content */}
            <div className="p-8 bg-gray-50">
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 bg-white rounded border">
                    <div
                      className="w-full h-20 rounded mb-2"
                      style={{ backgroundColor: selectedTheme.secondaryColor, opacity: 0.2 }}
                    ></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <Link
            href="/dashboard/business-account/websites"
            className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-2 bg-[#019561] hover:bg-[#017a4b] text-white rounded-lg transition font-medium disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Website"}
          </button>
        </div>
      </form>
    </div>
  )
}
