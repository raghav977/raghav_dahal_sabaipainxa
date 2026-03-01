"use client";

import React, { useEffect, useState } from "react";
import { FaCamera } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";


const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ServiceProviderProfile({ initialData }) {
  const token = getTokenFromLocalStorage("token");
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
  const [data, setData] = useState(initialData?.serviceProvider || null);
  const [loading, setLoading] = useState(!initialData);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");


  useEffect(() => {
    if (initialData) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/users/about/service-provider`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-refresh-token": refreshToken,
          },
        });
        const json = await res.json();
        if (json.status === "success") {
          setData(json.data.serviceProvider);
        }
      } catch (err) {
        console.error("Failed to fetch service provider:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [initialData]);

  if (loading)
    return <div className="p-10 text-center text-gray-500 text-lg">Loading service provider info...</div>;

  if (!data)
    return <div className="p-10 text-center text-red-500 text-lg">Failed to load service provider data.</div>;


  const user = data.user;
  const municipal = user?.municipal;
  const district = municipal?.district;
  const province = district?.province;

  const kyc = data.kyc;
  const kycImages = kyc?.kycImage || [];

  const imgUrl = (path) => path?.startsWith("http") ? path : `${BASE_URL}${path}`;

  const isPdf = (url) => {
    if (!url) return false;
    try {
      const u = url.toLowerCase();
      return u.endsWith('.pdf') || u.includes('.pdf?') || u.includes('.pdf#') || u.startsWith('data:application/pdf');
    } catch (e) {
      return false;
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSavePhoto = async () => {
    if (!photoFile) return alert("Select a picture first.");
    setSavingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("profile_image", photoFile);

      const res = await fetch(`${BASE_URL}/api/users/update-profile`, {
        method: "POST",
        headers:{
          'Authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        },
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);

      const json = await res.json();
      const newProfile = json?.data?.profile_picture || json?.data?.user?.profile_picture;
      if (newProfile) setData((d) => ({ ...d, user: { ...d.user, profile_picture: newProfile } }));

      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      setPhotoFile(null);
    } catch (err) {
      console.error("Failed to upload photo:", err);
      alert("Failed to upload photo: " + (err.message || "Unknown error"));
    } finally {
      setSavingPhoto(false);
    }
  };

  return (
    <div className="bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
        {/* <Button className="bg-green-600 hover:bg-green-700 text-white rounded-[4px]">Update KYC</Button> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Avatar Section */}
        <div className="md:col-span-1 flex flex-col items-center">
          <div className="w-40 h-40 rounded-[4px] overflow-hidden border">
            <img
              src={photoPreview || imgUrl(user?.profile_picture) || "/images/default-profile.jpg"}
              alt={user?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="mt-4 text-center">
            <div className="text-lg font-semibold">{user?.name || user?.username}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
          </div>

          {!initialData && (
            <label className="mt-4 text-sm text-gray-600 flex items-center gap-2 cursor-pointer hover:text-green-600">
              <FaCamera /> Change photo
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
          )}

          {photoFile && (
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSavePhoto} disabled={savingPhoto} className="rounded-[4px]">
                {savingPhoto ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (photoPreview) URL.revokeObjectURL(photoPreview);
                  setPhotoPreview(null);
                  setPhotoFile(null);
                }}
                className="rounded-[4px]"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="md:col-span-2 space-y-6">
          {/* User Info */}
          <Section title="User Details">
            <Info label="Username" value={user?.username} />
            <Info label="Email" value={user?.email} />
            <Info label="Phone" value={user?.phone_number || "N/A"} />
            <Info label="Active" value={user?.is_active ? "Yes" : "No"} />
            <Info label="Joined" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"} />
          </Section>

          {/* Location Info */}
          <Section title="Location Information">
            <Info label="Municipality" value={`${municipal?.name_en || "N/A"} (${municipal?.name_np || ""})`} />
            <Info label="District" value={`${district?.name_en || "N/A"} (${district?.name_np || ""})`} />
            <Info label="Province" value={`${province?.name_en || "N/A"} (${province?.name_np || ""})`} />
          </Section>

          {/* Provider Status */}
          <Section title="Provider Status">
            <Info label="Verification" value={data?.is_verified ? "Verified" : "Not Verified"} />
            <Info label="Status" value={data?.is_blocked ? "Blocked" : "Active"} />
            <Info label="Provider ID" value={`#${data?.id}`} />
            <Info label="Member Since" value={new Date(data?.createdAt).toLocaleDateString()} />
          </Section>

          {/* KYC Info */}
          {/* KYC Info */}
<Section title="KYC Information">
  {data.kyc.length === 0 ? (
    <div className="text-sm text-gray-500">No KYC submitted yet.</div>
  ) : (
    data.kyc.map((kycItem, idx) => (
      <div key={idx} className="mb-6 p-4 border rounded-md bg-gray-50">
        <h4 className="font-semibold mb-2">Submission #{idx + 1}</h4>

        <Info label="Document Type" value={kycItem.document_type || "N/A"} />
        <Info label="Status" value={kycItem.status || "N/A"} />
        {kycItem.rejection_reason && (
          <Info label="Rejection Reason" value={kycItem.rejection_reason} />
        )}
        <Info
          label="Verified At"
          value={
            kycItem.verified_at
              ? new Date(kycItem.verified_at).toLocaleString()
              : "N/A"
          }
        />

        <div className="mt-4">
          <h5 className="text-sm font-semibold mb-2 text-gray-500">Documents</h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {kycItem.kycImage.length === 0 ? (
              <div className="text-sm text-gray-500 col-span-full">
                No documents submitted
              </div>
            ) : (
              kycItem.kycImage.map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedImageUrl(imgUrl(img.image_path));
                    setIsImageModalOpen(true);
                  }}
                  className="block overflow-hidden rounded-[4px] border hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <img
                    src={imgUrl(img.image_path)}
                    alt={img.image_type}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    ))
  )}
</Section>

        </div>
      </div>

      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-3xl p-0">
            {isPdf(selectedImageUrl) ? (
              <div className="w-full h-[80vh]">
                <iframe
                  src={selectedImageUrl}
                  title="KYC Document PDF"
                  className="w-full h-full"
                />
              </div>
            ) : (
              <img src={selectedImageUrl} alt="KYC Document" className="w-full h-auto object-contain rounded-[4px]" />
            )}
          </DialogContent>
      </Dialog>

    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between items-center py-3 border-b last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right">{value || "N/A"}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="border rounded-[4px]">
      <h3 className="text-lg font-semibold p-4 border-b">{title}</h3>
      <div className="p-4">{children}</div>
    </div>
  );
}
