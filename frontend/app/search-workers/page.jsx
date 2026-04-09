"use client";

import { useState, useEffect } from "react";
import { useWorkerProfile } from "@/hooks/useWorkerProfile";
import Link from "next/link";

export default function SearchWorkers() {
  const { searchWorkers, loading, error } = useWorkerProfile();
  const [workers, setWorkers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState({
    title: "",
    skills: "",
    location_name: "",
    min_rating: "",
    is_verified: "",
    availability_status: "",
    min_experience: "",
    max_hourly_rate: "",
    page: 1,
    limit: 12,
  });

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("10");

  useEffect(() => {
    performSearch();
  }, []);

  const performSearch = async () => {
    try {
      const searchFilters = {
        ...filters,
      };

      if (latitude && longitude && radius) {
        searchFilters.latitude = latitude;
        searchFilters.longitude = longitude;
        searchFilters.radius = radius;
      }

      if (filters.skills) {
        searchFilters.skills = filters.skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      }

      const result = await searchWorkers(searchFilters);
      setWorkers(result.data || []);
      setTotalCount(result.total || 0);
    } catch (err) {
      console.error("Error searching workers:", err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1, // Reset to first page when filter changes
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
        },
        (error) => {
          alert("Could not get location: " + error.message);
        }
      );
    }
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
    performSearch();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Workers</h1>
          <p className="text-gray-600">
            Search for skilled professionals by skills, location, and more
          </p>
        </div>

        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Title/Profession */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={filters.title}
                  onChange={handleFilterChange}
                  placeholder="e.g., Developer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  name="skills"
                  value={filters.skills}
                  onChange={handleFilterChange}
                  placeholder="e.g., React, Node.js"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location_name"
                  value={filters.location_name}
                  onChange={handleFilterChange}
                  placeholder="e.g., Kathmandu"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Min Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Rating
                </label>
                <select
                  name="min_rating"
                  value={filters.min_rating}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability
                </label>
                <select
                  name="availability_status"
                  value={filters.availability_status}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              {/* Verified Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification
                </label>
                <select
                  name="is_verified"
                  value={filters.is_verified}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="true">Verified Only</option>
                </select>
              </div>

              {/* Min Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Experience (years)
                </label>
                <input
                  type="number"
                  name="min_experience"
                  value={filters.min_experience}
                  onChange={handleFilterChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Max Hourly Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Hourly Rate ($)
                </label>
                <input
                  type="number"
                  name="max_hourly_rate"
                  value={filters.max_hourly_rate}
                  onChange={handleFilterChange}
                  placeholder="100"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Location Search */}
            <div className="border-t pt-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Search by Distance</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="27.7172"
                    step="0.0001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="85.3240"
                    step="0.0001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Radius (km)
                  </label>
                  <input
                    type="number"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    placeholder="10"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                  >
                    📍 Use My Location
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? "Searching..." : "Search"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilters({
                    title: "",
                    skills: "",
                    location_name: "",
                    min_rating: "",
                    is_verified: "",
                    availability_status: "",
                    min_experience: "",
                    max_hourly_rate: "",
                    page: 1,
                    limit: 12,
                  });
                  setLatitude("");
                  setLongitude("");
                  setRadius("10");
                }}
                className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        {/* Results */}
        <div>
          <p className="text-gray-600 mb-6">
            Found <span className="font-semibold">{totalCount}</span> workers
          </p>

          {workers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workers.map((worker) => (
                <Link key={worker.id} href={`/worker-profile/${worker.id}`}>
                  <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden">
                    {/* Header */}
                    <div className="h-32 bg-gradient-to-r from-blue-400 to-blue-500 relative">
                      {worker.profile_photo && (
                        <img
                          src={worker.profile_photo}
                          alt={worker.title}
                          className="absolute bottom-0 left-4 transform translate-y-1/2 w-20 h-20 rounded-full border-4 border-white object-cover"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 pt-14">
                      <h3 className="text-lg font-semibold text-gray-900">{worker.title}</h3>
                      {worker.User?.name && (
                        <p className="text-sm text-gray-600">{worker.User.name}</p>
                      )}

                      {/* Stats */}
                      <div className="mt-3 space-y-2">
                        {worker.average_rating > 0 && (
                          <p className="text-sm text-gray-700">
                            ⭐ {worker.average_rating.toFixed(1)} ({worker.total_reviews} reviews)
                          </p>
                        )}

                        {worker.years_of_experience > 0 && (
                          <p className="text-sm text-gray-700">
                            📅 {worker.years_of_experience} years experience
                          </p>
                        )}

                        {worker.hourly_rate && (
                          <p className="text-sm text-gray-700">💰 ${worker.hourly_rate}/hr</p>
                        )}

                        {worker.location_name && (
                          <p className="text-sm text-gray-700">📍 {worker.location_name}</p>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <div className="flex gap-1">
                          {worker.is_verified && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              ✓ Verified
                            </span>
                          )}

                          {worker.is_available && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {worker.availability_status === "available"
                                ? "Available"
                                : worker.availability_status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Skills */}
                      {worker.skills && worker.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {worker.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill.id}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {skill.name}
                            </span>
                          ))}
                          {worker.skills.length > 3 && (
                            <span className="px-2 py-1 text-gray-600 text-xs">
                              +{worker.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-lg text-gray-600">No workers found matching your criteria</p>
            </div>
          )}

          {/* Pagination */}
          {workers.length > 0 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-gray-700">Page {filters.page}</span>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={workers.length < filters.limit}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
