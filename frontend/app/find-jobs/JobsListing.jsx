"use client"
import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, MapPin, DollarSign, Calendar, Briefcase } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export default function JobsListing() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("newest");

  const fetchJobs = async (searchTerm = "", currentPage = 1, sort = "newest") => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${BASE_URL}/api/jobs`);
      url.searchParams.set('limit', pageSize);
      url.searchParams.set('offset', (currentPage - 1) * pageSize);
      if (searchTerm) url.searchParams.set('search', searchTerm);
      
      const res = await fetch(url.toString());
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Failed to load jobs (${res.status})`);
      }
      
      const body = await res.json();
      let jobsList = body.results || body.data || [];
      
      // Sort jobs
      if (sort === "newest") {
        jobsList = jobsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sort === "salary_high") {
        jobsList = jobsList.sort((a, b) => (b.salary_max || 0) - (a.salary_max || 0));
      } else if (sort === "salary_low") {
        jobsList = jobsList.sort((a, b) => (a.salary_min || 0) - (b.salary_min || 0));
      }
      
      setJobs(jobsList);
      setTotal(body.total || jobsList.length);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(search, page, sortBy);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs(search, 1, sortBy);
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortBy(newSort);
    fetchJobs(search, page, newSort);
  };

  const totalPages = Math.ceil(total / pageSize);
  const canPrevious = page > 1;
  const canNext = page < totalPages;

  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      fetchJobs(search, newPage, sortBy);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by job title, company, skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium"
            >
              Search
            </button>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="salary_high">Highest Salary</option>
              <option value="salary_low">Lowest Salary</option>
            </select>
          </div>
        </form>
      </div>

      {/* Results Info */}
      {!loading && (
        <div className="text-sm text-gray-600">
          Showing {jobs.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, total)} of {total} jobs
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading jobs...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">Failed to load jobs</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && jobs.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">No jobs found</p>
          <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
        </div>
      )}

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition border border-gray-200 overflow-hidden flex flex-col"
          >
            {/* Job Header */}
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-1">
                {job.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{job.department || 'General'}</p>
              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {job.status === 'open' ? '✓ Open' : 'Closed'}
              </span>
            </div>

            {/* Job Details */}
            <div className="p-4 space-y-3 flex-1">
              {/* Description */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {job.description || 'No description provided'}
              </p>

              {/* Salary */}
              {(job.salary_min || job.salary_max) && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">
                    {job.salary_min && job.salary_max
                      ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                      : job.salary_min
                      ? `${job.salary_min.toLocaleString()}+`
                      : `Up to ${job.salary_max?.toLocaleString()}`}
                  </span>
                </div>
              )}

              {/* Work Type and Pay Type */}
              <div className="flex gap-2 flex-wrap">
                {job.work_type && (
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                    {job.work_type}
                  </span>
                )}
                {job.pay_type && (
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
                    {job.pay_type}
                  </span>
                )}
              </div>

              {/* Posted Date */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Deadline */}
              {job.application_deadline && (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <Calendar className="h-4 w-4" />
                  <span>Apply by {new Date(job.application_deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* View Details Button */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <Link
                href={`/find-jobs/${job.id}`}
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center transition font-medium"
              >
                View Details & Apply
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={!canPrevious}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`px-3 py-2 rounded-lg transition ${
                    page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => goToPage(page + 1)}
            disabled={!canNext}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
