"use client"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false })
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRef } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Upload, X } from "lucide-react"
import { useDispatch } from "react-redux"
import { fetchMyRooms } from "@/app/redux/slices/gharbetislice"
import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const FormField = ({ label, children, required = false }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
      {label}
      {required && <span className="text-red-500">*</span>}
    </Label>
    {children}
  </div>
)



export default function AddRoom({ initialData = null, open: controlledOpen, onOpenChange = undefined }) {
  const token = getTokenFromLocalStorage("token")
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [tempLocation, setTempLocation] = useState({ lat: null, lng: null, address: "" })
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    images: [],
    name: "",
    location: "",
    lat: null,
    lng: null,
    price: "",
    contact: "",
    description: "",
    availability_status: false,
    note: "",
  })
  const [errors, setErrors] = useState({})
  const [geo, setGeo] = useState({ lat: null, lng: null, loading: true, error: null })

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude, loading: false, error: null }),
        (err) => setGeo({ lat: null, lng: null, loading: false, error: err.message })
      )
    } else {
      setGeo({ lat: null, lng: null, loading: false, error: "Geolocation not supported" })
    }
  }, [])

  const [imagePreviews, setImagePreviews] = useState([])
  const [initialImageUrls, setInitialImageUrls] = useState([])

  // populate form if initialData is provided (reapply)
  useEffect(() => {
    if (!initialData) return
    setForm((prev) => ({
      ...prev,
      name: initialData.name || prev.name,
      location: initialData.location || prev.location,
      lat: initialData.lat ?? prev.lat,
      lng: initialData.lng ?? prev.lng,
      price: initialData.price ?? prev.price,
      contact: initialData.contact || prev.contact,
      description: initialData.description || prev.description,
      availability_status: !!initialData.availability_status,
      note: initialData.note || prev.note,
    }))

    // set existing image URLs (so we can skip requiring new images)
    const urls = (initialData.RoomImages || []).map((im) => {
      // ensure absolute URL
      if (!im.image_path) return null
      return im.image_path.startsWith("http") ? im.image_path : `${process.env.NEXT_PUBLIC_BACKEND_URL}${im.image_path}`
    }).filter(Boolean)
    setInitialImageUrls(urls)
    setImagePreviews(urls)
  }, [initialData])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    handleChange("images", files)
    const previews = files.map((file) => URL.createObjectURL(file))
    setImagePreviews(previews)
  }

  const removeImage = (index) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    const newFiles = Array.from(form.images).filter((_, i) => i !== index)
    setImagePreviews(newPreviews)
    handleChange("images", newFiles)
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = "Room name is required"
    if (!form.price || isNaN(form.price) || Number(form.price) < 1000) errs.price = "Enter a valid price (min 1000)"
    if (!form.contact || !/^98\d{8}$/.test(form.contact)) errs.contact = "Enter a valid 10-digit Nepali mobile number"
    if (!form.location || !form.lat || !form.lng) errs.location = "Location is required"
    if (!form.description.trim()) errs.description = "Description is required"
    if (form.description.length > 250) errs.description = "Max 250 characters allowed"
    if (form.note.length > 250) errs.note = "Max 250 characters allowed"
    // require images only if there are no existing images from initial data
    if ((!form.images || form.images.length === 0) && initialImageUrls.length === 0) errs.images = "At least one image is required"
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    try {
      const formData = new FormData()
      form.images.forEach((file) => {
        formData.append("images", file)
      })
      formData.append("name", form.name)
      formData.append("location", form.location)
      formData.append("lat", form.lat)
      formData.append("lng", form.lng)
      formData.append("price", form.price)
      formData.append("contact", form.contact)
      formData.append("description", form.description)
      formData.append("availability_status", form.availability_status ? "1" : "0")
      if (initialData && (initialData.id || initialData.serviceId || initialData.roomId)) {
        const origId = initialData.id || initialData.serviceId || initialData.roomId
        formData.append("originalRoomId", String(origId))
      }
      formData.append("note", form.note)
      const res = await fetch(`${BASE_URL}/api/rooms/create`, {
        method: "POST",
        body: formData,
        headers:{
          'authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        },
      })
      const data = await res.json()
      if (res.ok) {
        alert("this is wait ")
        // dispatch(fetchMyRooms({ type: 'listed' }))
        // window.location.reload();
        // if parent provided onOpenChange, close modal
        if (typeof onOpenChange === "function") onOpenChange(false)
      } else {
        alert(data.message || "Failed to add room")
      }
    } catch (err) {
      alert("Something went wrong while submitting")
    }
  }

  return (
    <Dialog open={typeof controlledOpen === 'boolean' ? controlledOpen : undefined} onOpenChange={onOpenChange}>
      {/* only render trigger when uncontrolled (so existing behavior stays same) */}
      {typeof controlledOpen !== 'boolean' && (
        <DialogTrigger asChild>
          <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-4 py-2 rounded-[4px] font-medium transition-colors">
            <Plus className="h-4 w-4" /> Add Room
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto p-0 rounded-xl border-0 shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Add New Room</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Fill in the details to list your room</p>
          </DialogHeader>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Room Images" required>
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Click to upload images</span>
                    <span className="text-xs text-gray-400">PNG, JPG up to 10MB each</span>
                  </label>
                </div>
                {errors.images && <div className="text-xs text-red-500 mt-1">{errors.images}</div>}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={src || "/placeholder.svg"}
                          alt={`preview-${idx}`}
                          className="w-full h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormField>

            {/* Room Name */}
            <FormField label="Room Name" required>
              <Input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Deluxe Room"
                required
                className="border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
              {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
            </FormField>
            {/* Contact Number */}
            <FormField label="Contact Number" required>
              <Input
                type="text"
                value={form.contact}
                onChange={(e) => handleChange("contact", e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                placeholder="e.g., 9800000000"
                required
                className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                maxLength={10}
              />
              {errors.contact && <div className="text-xs text-red-500 mt-1">{errors.contact}</div>}
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Location Picker */}
              <FormField label="Room Location (within 5km)" required>
                {geo.loading ? (
                  <div className="text-green-500 text-sm">Detecting your location…</div>
                ) : geo.error ? (
                  <div className="text-red-500 text-sm">{geo.error}</div>
                ) : (
                  <>
                    <Button
                      type="button"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                      onClick={() => {

                        setTempLocation({
                          lat: form.lat ?? geo.lat,
                          lng: form.lng ?? geo.lng,
                          address: form.location ?? "",
                        })
                        setLocationModalOpen(true)
                      }}
                    >
                      {form.lat && form.lng ? "Change Location" : "Select Location"}
                    </Button>
                    {form.location && (
                      <div className="text-xs text-gray-500 mt-2">Selected: {form.location} ({form.lat?.toFixed(5)}, {form.lng?.toFixed(5)})</div>
                    )}
                  </>
                )}
                {errors.location && <div className="text-xs text-red-500 mt-1">{errors.location}</div>}
                <Dialog open={locationModalOpen} onOpenChange={setLocationModalOpen}>
                  <DialogContent className="max-w-2xl w-full p-0">
                    <div className="p-6 border-b border-gray-100">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900">Select Room Location</DialogTitle>
                        <p className="text-sm text-gray-500 mt-1">Pick a location within 5km of your current position</p>
                      </DialogHeader>
                    </div>
                    <div className="p-6">
                      <MapPicker
                        center={{ lat: geo.lat, lng: geo.lng }}
                        value={tempLocation.lat && tempLocation.lng ? { lat: tempLocation.lat, lng: tempLocation.lng } : null}
                        radius={5000}
                        onChange={({ lat, lng, address }) => {
                          setTempLocation({ lat, lng, address })
                        }}
                      />
                      <div className="flex justify-end gap-3 mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setLocationModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
                          onClick={() => {
                            handleChange("lat", tempLocation.lat)
                            handleChange("lng", tempLocation.lng)
                            handleChange("location", tempLocation.address || "")
                            setLocationModalOpen(false)
                          }}
                          disabled={!tempLocation.lat || !tempLocation.lng}
                        >
                          Confirm Location
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </FormField>

              {/* Price */}
              <FormField label="Price (NPR)" required>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="e.g., 15000"
                  required
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  min={1000}
                />
                {errors.price && <div className="text-xs text-red-500 mt-1">{errors.price}</div>}
              </FormField>
            </div>

            {/* Description */}
            <FormField label="Description" required>
              <Textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value.slice(0, 250))}
                placeholder="Describe the room, amenities, etc."
                rows={3}
                required
                className="border-gray-300 focus:border-green-500 focus:ring-green-500 resize-none"
                maxLength={250}
              />
              <div className="flex justify-between text-xs mt-1">
                <span className={form.description.length > 250 ? "text-red-500" : "text-gray-400"}>{form.description.length}/250</span>
                {errors.description && <span className="text-red-500">{errors.description}</span>}
              </div>
            </FormField>

            {/* Availability */}
            <FormField label="Availability Status">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Checkbox
                  checked={form.availability_status}
                  onCheckedChange={(val) => handleChange("availability_status", val)}
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Room is available</span>
                  <p className="text-xs text-gray-500">Check if the room is currently available for rent</p>
                </div>
              </div>
            </FormField>

            {/* Notes */}
            <FormField label="Additional Notes">
              <Textarea
                value={form.note}
                onChange={(e) => handleChange("note", e.target.value.slice(0, 250))}
                placeholder="Any additional information about the room..."
                rows={3}
                className="border-gray-300 focus:border-green-500 focus:ring-green-500 resize-none"
                maxLength={250}
              />
              <div className="flex justify-between text-xs mt-1">
                <span className={form.note.length > 250 ? "text-red-500" : "text-gray-400"}>{form.note.length}/250</span>
                {errors.note && <span className="text-red-500">{errors.note}</span>}
              </div>
            </FormField>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Submit Room Listing
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
