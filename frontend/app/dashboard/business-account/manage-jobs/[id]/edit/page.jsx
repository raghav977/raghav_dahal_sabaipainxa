"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id;

  const [job, setJob] = useState(null);
  const [formData, setFormData] = useState({
    jobTitle: "",
    description: "",
    requirements: "",
    department: "",
    preferredLocation: "",
    address: "",
    workType: "Full-time",
    salaryMin: "",
    salaryMax: "",
    payType: "Monthly",
    benefits: "",
    contactEmail: "",
    contactPhone: "",
    applicationLink: "",
    applicationDeadline: "",
    requiredDocuments: "",
    status: "open",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch(`${BASE_URL}/api/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to load job");
        }

        const data = await res.json();
        const jobData = data.data || data;
        setJob(jobData);

        // Map API response to form data
        setFormData({
          jobTitle: jobData.title || "",
          description: jobData.description || "",
          requirements: jobData.requirements || "",
          department: jobData.department || "",
          preferredLocation: jobData.preferred_location || "",
          address: jobData.address || "",
          workType: jobData.work_type || "Full-time",
          salaryMin: jobData.salary_min || "",
          salaryMax: jobData.salary_max || "",
          payType: jobData.pay_type || "Monthly",
          benefits: jobData.benefits || "",
          contactEmail: jobData.contact_email || "",
          contactPhone: jobData.contact_phone || "",
          applicationLink: jobData.application_link || "",
          applicationDeadline: jobData.application_deadline || "",
          requiredDocuments: jobData.required_documents || "",
          status: jobData.status || "open",
        });
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load job");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId, router]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Validate required fields
      if (!formData.jobTitle?.trim()) {
        throw new Error("Job title is required");
      }

      const res = await fetch(`${BASE_URL}/api/jobs/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body?.message || body?.error || "Failed to update job");
      }

      setSuccess(true);
      setError(null);

      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push(`/dashboard/business-account/manage-jobs/${jobId}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update job");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading job...</p>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Cannot Load Job</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard/business-account/manage-jobs")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">✏️ Edit Job</h1>
          <p className="text-gray-600 mt-2">Update job posting details</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-green-900">Job updated successfully!</p>
                <p className="text-sm text-green-700">Redirecting...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">❌</span>
              <div>
                <p className="font-semibold text-red-900">Error updating job</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form 
          className="bg-white rounded-lg shadow-md p-8 space-y-6"
          onSubmit={handleSubmit}
        >
          {/* Job Title */}
          <div>
            <label htmlFor="jobTitle" className="block font-medium text-gray-700 mb-2">Job Title *</label>
            <input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block font-medium text-gray-700 mb-2">Department / Team</label>
            <input
              id="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Engineering, HR, Marketing"
            />
          </div>

          {/* Job Description */}
          <div>
            <label htmlFor="description" className="block font-medium text-gray-700 mb-2">Job Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe the role, responsibilities, and key duties..."
              rows={4}
            />
          </div>

          {/* Requirements */}
          <div>
            <label htmlFor="requirements" className="block font-medium text-gray-700 mb-2">Requirements</label>
            <textarea
              id="requirements"
              value={formData.requirements}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="List skills, experience, qualifications required..."
              rows={3}
            />
          </div>

          {/* Location Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="preferredLocation" className="block font-medium text-gray-700 mb-2">Preferred Location</label>
              <input
                id="preferredLocation"
                value={formData.preferredLocation}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Kathmandu, Pokhara"
              />
            </div>
            <div>
              <label htmlFor="address" className="block font-medium text-gray-700 mb-2">Office Address</label>
              <input
                id="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Full office address"
              />
            </div>
          </div>

          {/* Work Type */}
          <div>
            <label htmlFor="workType" className="block font-medium text-gray-700 mb-2">Work Type</label>
            <select
              id="workType"
              value={formData.workType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Remote</option>
              <option>On-field</option>
              <option>Internship</option>
              <option>Contract</option>
            </select>
          </div>

          {/* Salary Section */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="salaryMin" className="block font-medium text-gray-700 mb-2">Minimum Salary (Rs)</label>
              <input
                id="salaryMin"
                value={formData.salaryMin}
                onChange={handleChange}
                type="number"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="salaryMax" className="block font-medium text-gray-700 mb-2">Maximum Salary (Rs)</label>
              <input
                id="salaryMax"
                value={formData.salaryMax}
                onChange={handleChange}
                type="number"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          {/* Pay Type */}
          <div>
            <label htmlFor="payType" className="block font-medium text-gray-700 mb-2">Pay Type</label>
            <select
              id="payType"
              value={formData.payType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Monthly</option>
              <option>Hourly</option>
              <option>Contract</option>
              <option>Negotiable</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block font-medium text-gray-700 mb-2">Job Status</label>
            <select
              id="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Benefits */}
          <div>
            <label htmlFor="benefits" className="block font-medium text-gray-700 mb-2">Benefits</label>
            <textarea
              id="benefits"
              value={formData.benefits}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Health insurance, allowances, perks, training, etc..."
              rows={2}
            />
          </div>

          {/* Contact Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="contactEmail" className="block font-medium text-gray-700 mb-2">Contact Email</label>
              <input
                id="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                type="email"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="hr@company.com"
              />
            </div>
            <div>
              <label htmlFor="contactPhone" className="block font-medium text-gray-700 mb-2">Contact Phone</label>
              <input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                type="tel"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+977 9800000000"
              />
            </div>
          </div>

          {/* Application Link */}
          <div>
            <label htmlFor="applicationLink" className="block font-medium text-gray-700 mb-2">Application Portal / Website</label>
            <input
              id="applicationLink"
              value={formData.applicationLink}
              onChange={handleChange}
              type="url"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://careers.company.com"
            />
          </div>

          {/* Deadline */}
          <div>
            <label htmlFor="applicationDeadline" className="block font-medium text-gray-700 mb-2">Application Deadline</label>
            <input
              id="applicationDeadline"
              value={formData.applicationDeadline}
              onChange={handleChange}
              type="date"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Required Documents */}
          <div>
            <label htmlFor="requiredDocuments" className="block font-medium text-gray-700 mb-2">Required Documents</label>
            <textarea
              id="requiredDocuments"
              value={formData.requiredDocuments}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="CV, cover letter, certifications, etc..."
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>✅ Save Changes</>
              )}
            </button>
            <a
              href={`/dashboard/business-account/manage-jobs/${jobId}`}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold px-6 py-3 rounded-lg transition text-center"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
