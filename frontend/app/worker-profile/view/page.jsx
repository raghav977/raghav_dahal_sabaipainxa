"use client";

import { useState, useEffect } from "react";
import { useWorkerProfile } from "@/hooks/useWorkerProfile";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ViewWorkerProfile() {
  const router = useRouter();
  const {
    profile,
    getMyProfile,
    uploadProfilePhoto,
    updateAvailability,
    loading,
    error,
  } = useWorkerProfile();

  const [isLoading, setIsLoading] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState("available");
  const [isAvailable, setIsAvailable] = useState(true);
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getMyProfile();
      if (data) {
        setAvailabilityStatus(data.availability_status || "available");
        setIsAvailable(data.is_available !== false);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadProfilePhoto(profile?.id, file);
      await loadProfile();
      alert("Photo uploaded successfully!");
    } catch (err) {
      alert("Failed to upload photo: " + err.message);
    }
  };

  const handleAvailabilityChange = async () => {
    try {
      await updateAvailability({
        is_available: !isAvailable,
        availability_status: availabilityStatus,
      });
      setIsAvailable(!isAvailable);
    } catch (err) {
      alert("Failed to update availability: " + err.message);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setAvailabilityStatus(newStatus);
      await updateAvailability({
        is_available: isAvailable,
        availability_status: newStatus,
      });
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No Profile Found</h1>
            <p className="text-gray-600 mb-6">
              You don't have a worker profile yet. Create one to be discovered by businesses!
            </p>
            <Link
              href="/worker-profile/create"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Create Your Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header with Profile Photo */}
          <div className="relative h-40 bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="absolute bottom-0 left-8 transform translate-y-1/2">
              <div className="relative">
                <img
                  src={profile.profile_photo || "/default-avatar.png"}
                  alt={profile.User?.name || "Profile"}
                  className="w-32 h-32 rounded-full border-4 border-white object-cover"
                />
                <label className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
                  📸
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8 pt-20">
            {/* Header Info */}
            <div className="mb-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{profile.title}</h1>
                  <p className="text-gray-600">{profile.User?.name}</p>
                  {profile.User?.email && (
                    <p className="text-sm text-gray-500">{profile.User.email}</p>
                  )}
                </div>

                <Link
                  href="/worker-profile/create"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Edit Profile
                </Link>
              </div>

              {profile.bio && (
                <p className="text-gray-700 leading-relaxed mb-4">{profile.bio}</p>
              )}

              {/* Availability Status */}
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={handleAvailabilityChange}
                      className="w-4 h-4"
                    />
                    <span className="ml-2 text-gray-700">
                      {isAvailable ? "Currently Available" : "Not Available"}
                    </span>
                  </label>
                </div>

                {isAvailable && (
                  <select
                    value={availabilityStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                  </select>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profile.hourly_rate && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 text-sm">Hourly Rate</p>
                    <p className="text-xl font-semibold text-gray-900">
                      ${profile.hourly_rate}
                    </p>
                  </div>
                )}

                {profile.years_of_experience !== undefined && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 text-sm">Experience</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {profile.years_of_experience} yrs
                    </p>
                  </div>
                )}

                {profile.average_rating > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 text-sm">Rating</p>
                    <p className="text-xl font-semibold text-gray-900">
                      ⭐ {profile.average_rating.toFixed(1)}
                    </p>
                  </div>
                )}

                {profile.total_reviews > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 text-sm">Reviews</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {profile.total_reviews}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="border-t pt-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm"
                    >
                      {skill.name}
                      {skill.proficiency && (
                        <span className="text-xs ml-2 opacity-75">({skill.proficiency})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            {(profile.location_name || profile.latitude) && (
              <div className="border-t pt-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
                <div className="space-y-2">
                  {profile.location_name && (
                    <p className="text-gray-700">📍 {profile.location_name}</p>
                  )}
                  {profile.service_radius && (
                    <p className="text-gray-700">Service Radius: {profile.service_radius} km</p>
                  )}
                  {profile.latitude && profile.longitude && (
                    <p className="text-sm text-gray-600">
                      Coordinates: {profile.latitude}, {profile.longitude}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
              <div className="space-y-2">
                {profile.phone && <p className="text-gray-700">📱 {profile.phone}</p>}
                {profile.User?.email && <p className="text-gray-700">📧 {profile.User.email}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
