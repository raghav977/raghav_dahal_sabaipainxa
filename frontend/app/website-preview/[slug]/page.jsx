"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { FaArrowLeft, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"

export default function WebsitePreviewPage() {
  const { slug } = useParams()
  const [website, setWebsite] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug) {
      fetchWebsite()
    }
  }, [slug])

  const fetchWebsite = async () => {
    try {
      setLoading(true)
      // Fetch website by slug - this should be a public endpoint
      const res = await fetch(`${BASE_URL}/api/website-builder/preview/${slug}`)

      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Website not found")
        } else {
          throw new Error("Failed to fetch website")
        }
        return
      }

      const body = await res.json()
      setWebsite(body.data || {})
    } catch (err) {
      console.error(err)
      toast.error("Failed to load website")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#019561] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading website...</p>
        </div>
      </div>
    )
  }

  if (!website) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Website not found</p>
          <Link href="/" className="text-[#019561] hover:text-[#017a4b] font-semibold">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  const theme = website.theme || {}
  const primaryColor = theme.primaryColor || "#019561"
  const secondaryColor = theme.secondaryColor || "#017a4b"
  const font = theme.font || "Inter, sans-serif"
  const pages = website.pages || []

  // Render section based on type
  const renderSection = (section) => {
    const baseClasses = "py-12 px-4"

    switch (section.type) {
      case "hero":
        return (
          <section
            key={section.id || Math.random()}
            style={{ backgroundColor: primaryColor, color: "white", fontFamily: font }}
            className={baseClasses}
          >
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-4">{section.headline || "Welcome"}</h1>
              <p className="text-xl mb-8 opacity-90">{section.subheadline || "Your website headline here"}</p>
              <button
                style={{ backgroundColor: secondaryColor }}
                className="px-8 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition"
              >
                {section.cta || "Get Started"}
              </button>
            </div>
          </section>
        )

      case "about":
        return (
          <section
            key={section.id || Math.random()}
            style={{ fontFamily: font }}
            className={`${baseClasses} bg-white`}
          >
            <div className="max-w-4xl mx-auto">
              <h2 style={{ color: primaryColor }} className="text-4xl font-bold mb-4">
                {section.headline || "About Us"}
              </h2>
              {section.image && (
                <img
                  src={section.image}
                  alt="About"
                  className="w-full h-72 object-cover rounded-lg mb-6"
                />
              )}
              <p className="text-gray-700 text-lg leading-relaxed">
                {section.content || "Tell your story here. Share your mission, values, and what makes your business unique."}
              </p>
            </div>
          </section>
        )

      case "services":
        return (
          <section
            key={section.id || Math.random()}
            style={{ fontFamily: font }}
            className={`${baseClasses} bg-gray-50`}
          >
            <div className="max-w-4xl mx-auto">
              <h2 style={{ color: primaryColor }} className="text-4xl font-bold mb-8 text-center">
                {section.headline || "Services"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(section.items || [
                  { title: "Service 1", description: "Description" },
                  { title: "Service 2", description: "Description" },
                  { title: "Service 3", description: "Description" },
                ]).map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <h3 style={{ color: primaryColor }} className="text-xl font-semibold mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )

      case "features":
        return (
          <section
            key={section.id || Math.random()}
            style={{ fontFamily: font }}
            className={`${baseClasses} bg-white`}
          >
            <div className="max-w-4xl mx-auto">
              <h2 style={{ color: primaryColor }} className="text-4xl font-bold mb-8 text-center">
                {section.headline || "Features"}
              </h2>
              <div className="space-y-6">
                {(section.items || [
                  { title: "Feature 1", description: "Description" },
                  { title: "Feature 2", description: "Description" },
                ]).map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div
                      style={{ backgroundColor: secondaryColor }}
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    >
                      <span className="text-white text-xl font-bold">✓</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )

      case "testimonials":
        return (
          <section
            key={section.id || Math.random()}
            style={{ fontFamily: font }}
            className={`${baseClasses} bg-gray-50`}
          >
            <div className="max-w-4xl mx-auto">
              <h2 style={{ color: primaryColor }} className="text-4xl font-bold mb-8 text-center">
                {section.headline || "Testimonials"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(section.items || [
                  { text: "Great service!", author: "Client 1", rating: 5 },
                  { text: "Highly recommended!", author: "Client 2", rating: 5 },
                ]).map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-lg shadow">
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < (item.rating || 5) ? "text-yellow-400" : "text-gray-300"}>
                          ⭐
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-700 mb-4 italic">"{item.text}"</p>
                    <p style={{ color: primaryColor }} className="font-semibold">
                      — {item.author}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )

      case "cta":
        return (
          <section
            key={section.id || Math.random()}
            style={{ backgroundColor: primaryColor, color: "white", fontFamily: font }}
            className={baseClasses}
          >
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-4">{section.headline || "Ready to get started?"}</h2>
              <p className="text-xl mb-8 opacity-90">{section.subheadline || "Contact us today"}</p>
              <button
                style={{ backgroundColor: secondaryColor }}
                className="px-8 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition"
              >
                {section.cta || "Contact Us"}
              </button>
            </div>
          </section>
        )

      case "contact":
        return (
          <section
            key={section.id || Math.random()}
            style={{ fontFamily: font }}
            className={`${baseClasses} bg-white`}
          >
            <div className="max-w-4xl mx-auto">
              <h2 style={{ color: primaryColor }} className="text-4xl font-bold mb-8 text-center">
                {section.headline || "Get In Touch"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="flex justify-center mb-4">
                    <FaPhone style={{ color: primaryColor }} className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold mb-2">Phone</h3>
                  <p className="text-gray-600">{section.phone || "+977 1 234 5678"}</p>
                </div>
                <div>
                  <div className="flex justify-center mb-4">
                    <FaEnvelope style={{ color: primaryColor }} className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-gray-600">{section.email || "hello@example.com"}</p>
                </div>
                <div>
                  <div className="flex justify-center mb-4">
                    <FaMapMarkerAlt style={{ color: primaryColor }} className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold mb-2">Address</h3>
                  <p className="text-gray-600">{section.address || "Kathmandu, Nepal"}</p>
                </div>
              </div>
            </div>
          </section>
        )

      default:
        return null
    }
  }

  return (
    <div style={{ fontFamily: font }} className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <header style={{ backgroundColor: primaryColor }} className="text-white py-4 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{website.website_name}</h1>
          <Link
            href="/dashboard/business-account/websites"
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg hover:opacity-90 transition"
          >
            <FaArrowLeft className="h-4 w-4" /> Edit
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {pages.length > 0 ? (
          pages.map((page) =>
            (page.sections || []).map((section) => renderSection(section))
          )
        ) : (
          <div className="py-20 text-center">
            <p className="text-gray-600 text-lg">This website has no pages yet. Add pages and sections in the editor.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: primaryColor, color: "white" }} className="py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} {website.website_name}. All rights reserved.</p>
          {website.custom_domain && (
            <p className="text-sm opacity-75 mt-2">Powered by Sabai Painxa</p>
          )}
        </div>
      </footer>

      {/* Admin Back Link for Testing */}
      {!website.is_published && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <p className="text-sm font-semibold">Draft Mode</p>
          <p className="text-xs mt-1">This website is not published yet</p>
        </div>
      )}
    </div>
  )
}
