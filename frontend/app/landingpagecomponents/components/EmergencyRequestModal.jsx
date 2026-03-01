"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AlertTriangle, DollarSign, X } from "lucide-react";

export default function EmergencyRequestModal({
  open,
  onOpenChange,
  services = [],
  loading = false,
  category,
  setCategory,
  MapSelector,
  ExpandedMapSelector,
  openMapModal,
  setOpenMapModal,
  mapPin,
  setMapPin,
  mediaFiles = [],
  setMediaFiles,
  handleMediaUpload,
  description,
  setDescription,
  price,
  setPrice,
  manualLocation,
  onSubmit,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white border border-gray-200 rounded-[4px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" /> Emergency Service Request
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            {loading ? (
              <p className="text-gray-500 text-sm">Loading categories...</p>
            ) : !services?.length ? (
              <p className="text-gray-500 text-sm">No categories found</p>
            ) : (
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="mt-1">
                  <SelectValue placeholder="Select emergency category" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.name}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Location */}
          <div>
            <Label>Emergency Location</Label>
            {MapSelector ? <MapSelector onSelect={setMapPin} /> : null}

            {ExpandedMapSelector && (
              <Dialog open={openMapModal} onOpenChange={setOpenMapModal}>
                <DialogContent className="max-w-2xl bg-white border border-gray-200 rounded-[4px]">
                  <ExpandedMapSelector onSelect={setMapPin} mapPin={mapPin} />
                  <div className="flex justify-end mt-2">
                    <Button variant="outline" onClick={() => setOpenMapModal(false)}>
                      Close
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {mapPin?.lat && (
              <p className="mt-2 text-xs text-green-600">
                Selected: Lat {mapPin.lat.toFixed(4)}, Lng {mapPin.lng.toFixed(4)}
              </p>
            )}
          </div>

          {/* Media Upload */}
          <div>
            <Label htmlFor="media">Photo/Video (optional)</Label>
            <Input
              id="media"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
              className="mt-1"
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              {mediaFiles.map((media, idx) => (
                <div key={idx} className="relative">
                  {media.type.startsWith("image") ? (
                    <img
                      src={media.preview}
                      alt="preview"
                      className="h-16 w-16 object-cover rounded-[4px]"
                    />
                  ) : (
                    <video
                      src={media.preview}
                      className="h-16 w-16 rounded-[4px]"
                      controls
                    />
                  )}
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5"
                    onClick={() =>
                      setMediaFiles((files) => files.filter((_, i) => i !== idx))
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Describe the Emergency</Label>
            <Textarea
              id="description"
              placeholder="Provide details..."
              className="mt-1 min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Price */}
          <div>
            <Label htmlFor="price" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Price Offer
            </Label>
            <Input
              id="price"
              type="number"
              placeholder="Enter your offer"
              className="mt-1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="pt-2 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300"
            disabled={!category || (!manualLocation && !mapPin?.lat) || !description || !price}
          >
            Submit Emergency Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

