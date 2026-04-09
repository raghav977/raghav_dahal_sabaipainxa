"use client";

import { useState, useEffect } from "react";
import { useWorkerProfile } from "@/hooks/useWorkerProfile";

export default function PublicWorkerProfile({ params }) {
  const { getProfile, loading, error } = useWorkerProfile();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [params.id]);

  const loadProfile = async () => {
    try {
      const data = await getProfile(params.id);
      setProfile(data);
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setIsLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
            <p className="text-gray-600">This worker profile doesn't exist or has been removed.</p>
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
              <img
                src={profile.profile_photo || "/default-avatar.png"}
                alt={profile.User?.name || "Profile"}
                className="w-32 h-32 rounded-full border-4 border-white object-cover"
              />
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8 pt-20">
            {/* Header Info */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">{profile.title}</h1>
              {profile.User?.name && <p className="text-gray-600">{profile.User.name}</p>}

              {profile.bio && (
                <p className="text-gray-700 leading-relaxed my-4 mb-4">{profile.bio}</p>
              )}

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

              {/* Availability Status */}
              <div className="mt-4 flex gap-2">
                {profile.is_available && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                    {profile.availability_status === "available"
                      ? "✓ Available"
                      : profile.availability_status}
                  </span>
                )}

                {profile.is_verified && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                    ✓ Verified
                  </span>
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
                </div>
              </div>
            )}

            {/* Portfolio & Certifications */}
            {(profile.portfolio_links?.length > 0 || profile.certifications?.length > 0) && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Portfolio & Certifications
                </h2>

                {profile.portfolio_links && profile.portfolio_links.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-800 mb-2">Portfolio</h3>
                    <div className="space-y-2">
                      {profile.portfolio_links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {profile.certifications && profile.certifications.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Certifications</h3>
                    <div className="space-y-3">
                      {profile.certifications.map((cert, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium text-gray-900">{cert.name}</p>
                          <p className="text-sm text-gray-600">
                            {cert.issuer}
                            {cert.date && ` • ${cert.date}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
