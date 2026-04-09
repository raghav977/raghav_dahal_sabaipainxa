"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { FaArrowLeft, FaGlobe, FaSave, FaPlus, FaTrash, FaEye, FaImage, FaStar } from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"

// Helper to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

const SECTION_TYPES = [
  "hero",
  "about",
  "services",
  "features",
  "testimonials",
  "cta",
  "contact",
]

export default function EditWebsitePage() {
  const router = useRouter()
  const { id } = useParams()
  const [website, setWebsite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [token, setToken] = useState(null)
  const [activeTab, setActiveTab] = useState("pages") // pages, theme, seo, settings
  const [selectedPageIndex, setSelectedPageIndex] = useState(0)

  useEffect(() => {
    const authToken = localStorage.getItem("token")
    setToken(authToken)
    if (authToken && id) {
      fetchWebsite(authToken)
    }
  }, [id])

  const fetchWebsite = async (authToken) => {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/api/website-builder/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (!res.ok) throw new Error("Failed to fetch website")

      const body = await res.json()
      setWebsite(body.data || {})
    } catch (err) {
      console.error(err)
      toast.error("Failed to load website")
      router.push("/dashboard/business-account/websites")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!website || !token) return

    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/api/website-builder/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          theme: website.theme,
          pages: website.pages,
          seo: website.seo,
          settings: website.settings,
          analytics_code: website.analytics_code,
        }),
      })

      if (!res.ok) throw new Error("Failed to save website")

      toast.success("Website saved successfully!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to save website")
    } finally {
      setSaving(false)
    }
  }

  const addPage = () => {
    const newPage = {
      name: `page-${Date.now()}`,
      sections: [],
    }
    setWebsite({
      ...website,
      pages: [...(website.pages || []), newPage],
    })
    setSelectedPageIndex((website.pages || []).length)
  }

  const addSection = () => {
    if (!website.pages || website.pages.length === 0) {
      toast.error("Create a page first")
      return
    }

    const newPages = [...website.pages]
    newPages[selectedPageIndex].sections = newPages[selectedPageIndex].sections || []
    newPages[selectedPageIndex].sections.push({
      type: "hero",
      headline: "Section Headline",
      subheadline: "Your content here",
    })

    setWebsite({ ...website, pages: newPages })
  }

  const removeSection = (sectionIndex) => {
    const newPages = [...website.pages]
    newPages[selectedPageIndex].sections.splice(sectionIndex, 1)
    setWebsite({ ...website, pages: newPages })
  }

  const updateSection = (sectionIndex, updates) => {
    const newPages = [...website.pages]
    newPages[selectedPageIndex].sections[sectionIndex] = {
      ...newPages[selectedPageIndex].sections[sectionIndex],
      ...updates,
    }
    setWebsite({ ...website, pages: newPages })
  }

  const updateTheme = (field, value) => {
    setWebsite({
      ...website,
      theme: {
        ...website.theme,
        [field]: value,
      },
    })
  }

  const updateSeo = (field, value) => {
    setWebsite({
      ...website,
      seo: {
        ...website.seo,
        [field]: value,
      },
    })
  }

  const handlePhotoUpload = async (sectionIndex, photoIndex = null) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (e) => {
      try {
        const file = e.target.files?.[0]
        if (!file) return

        const base64 = await fileToBase64(file)
        const newPages = [...website.pages]
        const currentSection = newPages[selectedPageIndex].sections[sectionIndex]

        // Initialize items array if not exists
        if (!currentSection.items) {
          currentSection.items = []
        }

        if (photoIndex !== null) {
          // Update existing photo
          if (currentSection.items[photoIndex]) {
            currentSection.items[photoIndex].image = base64
          }
        } else {
          // Add new item with photo
          currentSection.items.push({
            title: "New Item",
            description: "Item description",
            image: base64,
          })
        }

        setWebsite({ ...website, pages: newPages })
        toast.success("Photo uploaded successfully!")
      } catch (err) {
        console.error(err)
        toast.error("Failed to upload photo")
      }
    }
    input.click()
  }

  const addItem = (sectionIndex) => {
    const newPages = [...website.pages]
    const currentSection = newPages[selectedPageIndex].sections[sectionIndex]
    
    if (!currentSection.items) {
      currentSection.items = []
    }

    // Different default items based on section type
    const defaultItem = currentSection.type === "testimonials" 
      ? { author: "Client Name", text: "Amazing service!", rating: 5 }
      : { title: "Item Name", description: "Item description", image: null }

    currentSection.items.push(defaultItem)
    setWebsite({ ...website, pages: newPages })
  }

  const removeItem = (sectionIndex, itemIndex) => {
    const newPages = [...website.pages]
    const currentSection = newPages[selectedPageIndex].sections[sectionIndex]
    if (currentSection.items) {
      currentSection.items.splice(itemIndex, 1)
    }
    setWebsite({ ...website, pages: newPages })
  }

  const updateItem = (sectionIndex, itemIndex, field, value) => {
    const newPages = [...website.pages]
    const currentSection = newPages[selectedPageIndex].sections[sectionIndex]
    if (currentSection.items && currentSection.items[itemIndex]) {
      currentSection.items[itemIndex][field] = value
    }
    setWebsite({ ...website, pages: newPages })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#019561] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading website builder...</p>
        </div>
      </div>
    )
  }

  if (!website) {
    return <div className="text-center py-12">Website not found</div>
  }

  const currentPage = website.pages?.[selectedPageIndex]

  return (
    <div className="space-y-6 pb-6">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/business-account/websites"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FaArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {website.website_name}
            </h1>
            <p className="text-sm text-gray-500">
              {website.is_published ? "✓ Published" : "Draft"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/website-preview/${website.website_slug}`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <FaEye className="h-4 w-4" /> Preview
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#019561] hover:bg-[#017a4b] text-white rounded-lg transition disabled:opacity-50"
          >
            <FaSave className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex border-b">
          {["pages", "theme", "seo", "settings"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 font-medium text-center capitalize transition ${
                activeTab === tab
                  ? "text-[#019561] border-b-2 border-[#019561]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Pages Tab */}
          {activeTab === "pages" && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Pages</h3>
                  <button
                    onClick={addPage}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-[#019561] hover:bg-[#017a4b] text-white rounded transition"
                  >
                    <FaPlus className="h-3 w-3" /> Add Page
                  </button>
                </div>

                <div className="space-y-2">
                  {(website.pages || []).map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPageIndex(idx)}
                      className={`w-full text-left px-4 py-2 rounded transition ${
                        selectedPageIndex === idx
                          ? "bg-[#019561] text-white"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      {page.name}
                    </button>
                  ))}
                </div>
              </div>

              {currentPage && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      Sections - {currentPage.name}
                    </h3>
                    <button
                      onClick={addSection}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-[#019561] hover:bg-[#017a4b] text-white rounded transition"
                    >
                      <FaPlus className="h-3 w-3" /> Add Section
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(currentPage.sections || []).map((section, idx) => (
                      <div
                        key={idx}
                        className="border rounded-lg p-4 space-y-3 bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <select
                            value={section.type}
                            onChange={e =>
                              updateSection(idx, { type: e.target.value })
                            }
                            className="px-3 py-2 border border-gray-300 rounded font-medium"
                          >
                            {SECTION_TYPES.map(type => (
                              <option key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => removeSection(idx)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Section Content Fields */}
                        {["headline", "subheadline", "content", "title", "cta"].map(
                          field => {
                            if (section[field] !== undefined) {
                              return (
                                <div key={field}>
                                  <label className="text-sm font-medium text-gray-700 mb-1 block capitalize">
                                    {field}
                                  </label>
                                  {field === "content" ? (
                                    <textarea
                                      value={section[field]}
                                      onChange={e =>
                                        updateSection(idx, {
                                          [field]: e.target.value,
                                        })
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                      rows="3"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={section[field]}
                                      onChange={e =>
                                        updateSection(idx, {
                                          [field]: e.target.value,
                                        })
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                    />
                                  )}
                                </div>
                              )
                            }
                          }
                        )}

                        {/* Items Management (Services, Features, Testimonials, etc.) */}
                        {(section.type === "services" || 
                          section.type === "features" || 
                          section.type === "testimonials") && (
                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">
                                {section.type === "testimonials" ? "Testimonials" : "Items"}
                              </h4>
                              <button
                                onClick={() => addItem(idx)}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-[#019561] hover:bg-[#017a4b] text-white rounded transition"
                              >
                                <FaPlus className="h-3 w-3" /> Add
                              </button>
                            </div>

                            <div className="space-y-3">
                              {(section.items || []).map((item, itemIdx) => (
                                <div
                                  key={itemIdx}
                                  className="bg-white border rounded p-3 space-y-2"
                                >
                                  {/* Testimonials Fields */}
                                  {section.type === "testimonials" ? (
                                    <>
                                      <input
                                        type="text"
                                        placeholder="Client name"
                                        value={item.author || ""}
                                        onChange={e =>
                                          updateItem(idx, itemIdx, "author", e.target.value)
                                        }
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                      <textarea
                                        placeholder="Testimonial text"
                                        value={item.text || ""}
                                        onChange={e =>
                                          updateItem(idx, itemIdx, "text", e.target.value)
                                        }
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                        rows="2"
                                      />
                                      <div>
                                        <label className="text-xs font-medium text-gray-700">Rating</label>
                                        <select
                                          value={item.rating || 5}
                                          onChange={e =>
                                            updateItem(idx, itemIdx, "rating", parseInt(e.target.value))
                                          }
                                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                        >
                                          <option value="1">⭐ 1 Star</option>
                                          <option value="2">⭐⭐ 2 Stars</option>
                                          <option value="3">⭐⭐⭐ 3 Stars</option>
                                          <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                                          <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                                        </select>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      {/* Photo Upload for Services/Features */}
                                      {section.type === "services" && (
                                        <div>
                                          {item.image ? (
                                            <div className="relative">
                                              <img
                                                src={item.image}
                                                alt="Item"
                                                className="w-full h-32 object-cover rounded"
                                              />
                                              <button
                                                onClick={() =>
                                                  handlePhotoUpload(idx, itemIdx)
                                                }
                                                className="absolute top-1 right-1 p-1 bg-[#019561] text-white rounded text-xs hover:bg-[#017a4b]"
                                              >
                                                <FaImage className="h-3 w-3" />
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() =>
                                                handlePhotoUpload(idx, itemIdx)
                                              }
                                              className="w-full py-4 border-2 border-dashed border-gray-300 rounded flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 transition text-sm"
                                            >
                                              <FaImage className="h-4 w-4" /> Upload Photo
                                            </button>
                                          )}
                                        </div>
                                      )}

                                      <input
                                        type="text"
                                        placeholder="Title"
                                        value={item.title || ""}
                                        onChange={e =>
                                          updateItem(idx, itemIdx, "title", e.target.value)
                                        }
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                      <textarea
                                        placeholder="Description"
                                        value={item.description || ""}
                                        onChange={e =>
                                          updateItem(idx, itemIdx, "description", e.target.value)
                                        }
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                        rows="2"
                                      />
                                    </>
                                  )}

                                  <button
                                    onClick={() => removeItem(idx, itemIdx)}
                                    className="w-full py-1 text-red-600 hover:bg-red-50 rounded text-sm transition flex items-center justify-center gap-1"
                                  >
                                    <FaTrash className="h-3 w-3" /> Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme Tab */}
          {activeTab === "theme" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={website.theme?.primaryColor || "#3B82F6"}
                    onChange={e => updateTheme("primaryColor", e.target.value)}
                    className="h-10 w-20 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={website.theme?.primaryColor || "#3B82F6"}
                    onChange={e => updateTheme("primaryColor", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={website.theme?.secondaryColor || "#10B981"}
                    onChange={e => updateTheme("secondaryColor", e.target.value)}
                    className="h-10 w-20 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={website.theme?.secondaryColor || "#10B981"}
                    onChange={e => updateTheme("secondaryColor", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select
                  value={website.theme?.font || "Inter, sans-serif"}
                  onChange={e => updateTheme("font", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option>Inter, sans-serif</option>
                  <option>Poppins, sans-serif</option>
                  <option>Georgia, serif</option>
                  <option>Courier New, monospace</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Style
                </label>
                <select
                  value={website.theme?.style || "modern"}
                  onChange={e => updateTheme("style", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="modern">Modern</option>
                  <option value="minimal">Minimal</option>
                  <option value="bold">Bold</option>
                  <option value="elegant">Elegant</option>
                </select>
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === "seo" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={website.seo?.title || ""}
                  onChange={e => updateSeo("title", e.target.value)}
                  placeholder="e.g., My Business | Services"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  value={website.seo?.description || ""}
                  onChange={e => updateSeo("description", e.target.value)}
                  placeholder="Describe your website for search engines"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <input
                  type="text"
                  value={website.seo?.keywords || ""}
                  onChange={e => updateSeo("keywords", e.target.value)}
                  placeholder="Comma separated keywords"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Analytics Code
                </label>
                <textarea
                  value={website.analytics_code || ""}
                  onChange={e =>
                    setWebsite({ ...website, analytics_code: e.target.value })
                  }
                  placeholder="Paste your Google Analytics code here"
                  className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                  rows="4"
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Features</h4>
                <div className="space-y-2">
                  {["enableComments", "enableNewsletter", "enableContactForm"].map(
                    setting => (
                      <label key={setting} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={website.settings?.[setting] || false}
                          onChange={e =>
                            setWebsite({
                              ...website,
                              settings: {
                                ...website.settings,
                                [setting]: e.target.checked,
                              },
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-gray-700 capitalize">
                          {setting.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#019561] hover:bg-[#017a4b] text-white rounded-lg transition font-medium disabled:opacity-50"
      >
        <FaSave className="h-5 w-5" /> {saving ? "Saving..." : "Save All Changes"}
      </button>
    </div>
  )
}
