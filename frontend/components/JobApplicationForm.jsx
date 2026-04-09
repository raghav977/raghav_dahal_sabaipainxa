"use client";

import { useState } from "react";
import { useJobApplication } from "@/hooks/useJobApplication";

export default function JobApplicationForm({ jobId, onSuccess }) {
  const { applyToJob, loading, error } = useJobApplication();
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);

  const [formData, setFormData] = useState({
    user_id: "",
    cover_letter: "",
    desired_position: "",
    years_experience: "",
    availability_days: "",
    expected_pay: "",
    portfolio_url: "",
    linkedin_url: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!validTypes.includes(file.type)) {
        alert("Only PDF and Word documents are allowed");
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get user ID from localStorage if not provided
    let userId = formData.user_id;
    if (!userId) {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          userId = JSON.parse(userData).id;
        } catch (err) {
          alert("Please log in to apply");
          return;
        }
      } else {
        alert("Please log in to apply");
        return;
      }
    }

    try {
      await applyToJob(jobId, { ...formData, user_id: userId }, resumeFile);
      setSubmitted(true);
      setShowForm(false);
      if (onSuccess) {
        onSuccess();
      }
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          user_id: "",
          cover_letter: "",
          desired_position: "",
          years_experience: "",
          availability_days: "",
          expected_pay: "",
          portfolio_url: "",
          linkedin_url: "",
        });
        setResumeFile(null);
      }, 3000);
    } catch (err) {
      console.error("Error applying to job:", err);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
        ✅ Application submitted successfully! We'll review your application soon.
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
      >
        Apply for This Job
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Apply for This Job</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Letter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Letter
          </label>
          <textarea
            name="cover_letter"
            value={formData.cover_letter}
            onChange={handleInputChange}
            placeholder="Tell us why you're a great fit for this role..."
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Resume Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resume (PDF or Word)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            {resumeFile && (
              <span className="text-sm text-green-600 font-medium">✓ {resumeFile.name}</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Max 5MB. Accepts PDF, DOC, DOCX</p>
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Desired Position
          </label>
          <input
            type="text"
            name="desired_position"
            value={formData.desired_position}
            onChange={handleInputChange}
            placeholder="e.g., Senior Developer"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Experience & Availability */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience
            </label>
            <input
              type="number"
              name="years_experience"
              value={formData.years_experience}
              onChange={handleInputChange}
              placeholder="5"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available to Start (days)
            </label>
            <input
              type="number"
              name="availability_days"
              value={formData.availability_days}
              onChange={handleInputChange}
              placeholder="7"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Expected Pay */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Salary/Rate
          </label>
          <input
            type="number"
            name="expected_pay"
            value={formData.expected_pay}
            onChange={handleInputChange}
            placeholder="50000"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Portfolio & LinkedIn */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Portfolio URL
            </label>
            <input
              type="url"
              name="portfolio_url"
              value={formData.portfolio_url}
              onChange={handleInputChange}
              placeholder="https://myportfolio.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn URL
            </label>
            <input
              type="url"
              name="linkedin_url"
              value={formData.linkedin_url}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/yourprofile"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>

          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
