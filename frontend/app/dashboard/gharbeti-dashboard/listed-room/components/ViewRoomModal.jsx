"use client"
import { useState, useEffect } from "react"
import { FileText, AlertCircle, MapPin, DollarSign, ImageIcon, X, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FaHome, FaMapMarkerAlt, FaDollarSign, FaCalendarAlt, FaFileAlt } from "react-icons/fa"

export function ViewRoomModal({ open, onOpenChange, service, loading, error }) {
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageError, setImageError] = useState({})
  // console.log(service);

  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const resolveImage = (p) => {
    if (!p) return "/placeholder.svg";
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return `${BASE_URL}${p}`;
  }

  const getStatusBadge = (status) => {
    const variants = {
      approved: "bg-green-100 text-green-700 border-green-200",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
    }
    return <Badge className={`px-2 py-1 rounded-[4px] text-xs font-medium border ${variants[status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>{status}</Badge>
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
    }).format(amount)
  }

  const handleImageError = (index) => setImageError((prev) => ({ ...prev, [index]: true }))

  useEffect(() => setImageError({}), [service])

  if (loading) return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white border border-gray-200 rounded-[4px]">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading room details...</p>
        </div>
      </DialogContent>
    </Dialog>
  )

  if (error || !service) return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white border border-gray-200 rounded-[4px]">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-500 font-medium">Failed to load room details</p>
          <p className="text-gray-600 text-sm mt-2">Please try again later</p>
        </div>
      </DialogContent>
    </Dialog>
  )

  const images = Array.isArray(service?.images) ? service.images : []

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-[4px]">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FaHome className="w-5 h-5 text-green-600" />
                  {service?.name || `Room #${service?.id || "—"}`}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(service?.status)}
                  <Badge variant="outline" className="text-xs border border-gray-300 text-gray-600 rounded-[4px]">ID: {service?.id}</Badge>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Room Images */}
            {images.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-green-600" /> Room Images ({images.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group cursor-pointer" onClick={() => setSelectedImage(resolveImage(img.path || "/placeholder.svg"))}>
                      <img
                        src={resolveImage(img.path || "/placeholder.svg")}
                        alt={`Room image ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-[4px] border border-gray-200 hover:border-gray-300 transition-colors"
                        onError={() => handleImageError(idx)}
                      />
                      {imageError[idx] && (
                        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-[4px]">
                          <AlertCircle className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {images.length > 0 && <Separator className="bg-gray-200" />}

            {/* Description / Benefits */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Description</h3>
              <p className="text-gray-800 leading-relaxed">{service?.description || service?.benefits || "No description provided"}</p>
            </div>

            <Separator className="bg-gray-200" />

            {/* Room Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-[4px] border border-gray-200">
                  <FaDollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Price</p>
                    <p className="font-medium text-gray-800">{formatCurrency(service.price)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-[4px] border border-gray-200">
                  <FaMapMarkerAlt className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Coordinates</p>
                    <p className="font-medium text-gray-800">{(service?.lat != null && service?.lng != null) ? `${service.lat}, ${service.lng}` : "—"}</p>
                    {service?.lat != null && service?.lng != null && (
                      <a
                        className="text-xs text-green-600 hover:underline"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${service.lat},${service.lng}`)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open in Maps
                      </a>
                    )}
                  </div>
                </div>

                
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-[4px] border border-gray-200">
                  <FaFileAlt className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Contact</p>
                    <p className="font-medium text-gray-800">
                      {service?.contact ? (
                        <a className="text-green-700 hover:underline" href={`tel:${service.contact}`}>{service.contact}</a>
                      ) : (
                        "No contact provided"
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-[4px] border border-gray-200">
                  <FaCalendarAlt className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Last Updated</p>
                    <p className="font-medium text-gray-800">
                      {service?.updatedAt ? new Date(service.updatedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {service?.note && (
              <>
                <Separator className="bg-gray-200" />
                <div className="bg-blue-50 rounded-[4px] p-4 border border-blue-200">
                  <h3 className="font-semibold text-sm text-blue-900 mb-2">Note</h3>
                  <p className="text-gray-800 leading-relaxed">{service.note}</p>
                </div>
              </>
            )}

            {/* Rejection Reason */}
            {service?.status == "rejected" && (service.rejection_reason || service.rejectionMessage) && (
              <>
                <Separator className="bg-gray-200" />
                <Alert variant="destructive" className="bg-red-50 border border-red-200 rounded-[4px]">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Rejection Reason:</strong> {service.rejection_reason || service.rejectionMessage}
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>

          <div className="mt-6 flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-green-600 hover:bg-green-700 text-white rounded-[4px] cursor-pointer"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="sm:max-w-[90vw] max-h-[90vh] bg-white border border-gray-200 rounded-[4px]">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200">
              <DialogTitle className="text-gray-900">Room Image Preview</DialogTitle>
              <Button variant="outline" size="icon" onClick={() => setSelectedImage(null)} className="border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-[4px] cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            <div className="flex items-center justify-center pt-4">
              <img src={selectedImage} alt="Room preview" className="max-w-full max-h-[70vh] object-contain rounded-[4px]" />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}