"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export default function WorkerProfilePage() {
  const params = useParams();
  const userId = params.user_id;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${BASE_URL}/api/worker-profiles/${userId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }
        );

        if (!res.ok) throw new Error("Failed to fetch profile");

        const body = await res.json();
        setProfile(body.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading worker profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Profile not found"}</p>
          <Link href="/dashboard/business-account/manage-jobs" className="text-blue-600 hover:underline">
            ← Back to Job Management
          </Link>
        </div>
      </div>
    );
  }

  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const certifications = Array.isArray(profile.certifications) ? profile.certifications : [];
  const portfolioLinks = Array.isArray(profile.portfolio_links) ? profile.portfolio_links : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link 
          href="/dashboard/business-account/manage-jobs" 
          className="inline-block mb-6 text-blue-600 hover:underline"
        >
          ← Back to Job Management
        </Link>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              <img
                src={profile.profile_photo || "/images/default-profile.jpg"}
                alt={profile.user?.name || "Profile"}
                className="w-48 h-48 rounded-lg object-cover border-4 border-blue-100"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="mb-4">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                  {profile.user?.name || "Unknown"}
                </h1>
                <p className="text-2xl text-blue-600 font-semibold mb-4">
                  {profile.title}
                </p>
              </div>

              {/* Verification Badge */}
              <div className="mb-4">
                {profile.is_verified ? (
                  <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                    ✓ KYC Verified
                  </span>
                ) : (
                  <span className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold">
                    ⊘ Not Verified
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-lg ${
                        i < Math.round(profile.average_rating || 0)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-gray-700 font-semibold">
                  {parseFloat(profile.average_rating || 0).toFixed(1)}/5.0
                </span>
                <span className="text-gray-600 text-sm">
                  ({profile.total_reviews || 0} reviews)
                </span>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Hourly Rate</p>
                  <p className="text-lg font-semibold text-gray-800">
                    ₹{parseFloat(profile.hourly_rate || 0).toFixed(0)}/hr
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Availability</p>
                  <p className="text-lg font-semibold text-gray-800 capitalize">
                    {profile.availability_status || "offline"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Service Radius</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {profile.service_radius || 10} km
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {profile.user?.email || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">About</h2>
            <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 text-sm">Phone</p>
              <a href={`tel:${profile.phone}`} className="text-blue-600 hover:underline text-lg">
                {profile.phone || profile.user?.phone_number || "Not provided"}
              </a>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Email</p>
              <a href={`mailto:${profile.user?.email}`} className="text-blue-600 hover:underline text-lg">
                {profile.user?.email || "Not provided"}
              </a>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Location</p>
              <p className="text-lg text-gray-800">
                {profile.location_name || "Not specified"}
              </p>
              {profile.latitude && profile.longitude && (
                <p className="text-sm text-gray-600 mt-1">
                  📍 {profile.latitude}, {profile.longitude}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Skills Section */}
        {skills.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill.id || skill.name}
                  className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications Section */}
        {certifications.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Certifications</h2>
            <div className="space-y-4">
              {certifications.map((cert, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-800">{cert.name}</h3>
                  <p className="text-gray-600 text-sm">Issued by: {cert.issuer}</p>
                  {cert.date && (
                    <p className="text-gray-600 text-sm">Date: {new Date(cert.date).toLocaleDateString()}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Section */}
        {portfolioLinks.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Portfolio</h2>
            <div className="space-y-2">
              {portfolioLinks.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline break-all"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-wrap gap-4">
          <a
            href={`/worker-profile/${userId}`}
            className="flex-1 min-w-[200px] bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition text-center font-semibold"
          >
            View Public Profile
          </a>
          <button
            onClick={() => {
              // TODO: Implement direct messaging or job offer functionality
              alert("Feature coming soon: Send job offer to this worker");
            }}
            className="flex-1 min-w-[200px] bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            Send Job Offer
          </button>
        </div>
      </div>
    </div>
  );
}
