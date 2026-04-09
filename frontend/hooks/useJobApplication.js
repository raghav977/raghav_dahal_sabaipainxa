import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/constant/api";

export const useJobApplication = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  }, []);

  const applyToJob = useCallback(
    async (jobId, applicationData, resumeFile) => {
      try {
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("user_id", applicationData.user_id);
        formData.append("cover_letter", applicationData.cover_letter || "");
        formData.append("desired_position", applicationData.desired_position || "");
        formData.append("years_experience", applicationData.years_experience || 0);
        formData.append("availability_days", applicationData.availability_days || 0);
        formData.append("expected_pay", applicationData.expected_pay || 0);
        formData.append("portfolio_url", applicationData.portfolio_url || "");
        formData.append("linkedin_url", applicationData.linkedin_url || "");

        if (resumeFile) {
          formData.append("resume", resumeFile);
        }

        const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/apply`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || "Failed to apply");
        }

        const data = await response.json();
        return data.data;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    applyToJob,
  };
};
