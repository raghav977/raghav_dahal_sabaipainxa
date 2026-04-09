"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTokenFromLocalStorage } from "@/helper/token";
import { toast, ToastContainer } from "react-toastify";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export default function BusinessRegisterPage() {
  const router = useRouter();
  const token = getTokenFromLocalStorage("token");
  const [documentType, setDocumentType] = useState("citizenship_card");
  const [formData, setFormData] = useState({
    company_name: "",
    company_email: "",
    industry: "",
    website: "",
    province: "",
    district: "",
    municipal: "",
  });
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [municipals, setMunicipals] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Load provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/address/provinces`);
        if (!res.ok) return;
        const json = await res.json();
        console.log("Provinces loaded:", json);
        const arr = json?.data?.provinces ?? [];
        console.log("Provinces array:", arr);
        setProvinces(arr);
      } catch (e) {
        console.debug("Failed to load provinces", e);
      }
    };
    fetchProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    const load = async () => {
      setDistricts([]);
      setFormData(prev => ({ ...prev, district: "", municipal: "" }));
      setMunicipals([]);
      if (!formData.province) return;
      try {
        const res = await fetch(`${BASE_URL}/api/address/districts/${formData.province}`);
        if (!res.ok) return;
        const json = await res.json();
        const arr = json?.data?.districts ?? [];
        console.log("Districts loaded for province", arr);
        setDistricts(arr);
      } catch (e) {
        console.debug("Failed to load districts", e);
      }
    };
    load();
  }, [formData.province]);

  // Load municipals when district changes
  useEffect(() => {
    const load = async () => {
      setMunicipals([]);
      setFormData(prev => ({ ...prev, municipal: "" }));
      if (!formData.district) return;
      try {
        const res = await fetch(`${BASE_URL}/api/address/municipals/${formData.district}`);
        if (!res.ok) return;
        const json = await res.json();
        const arr = json?.data?.municipals ?? [];
        console.log("Municipals loaded for district", arr);
        setMunicipals(arr);
      } catch (e) {
        console.debug("Failed to load municipals", e);
      }
    };
    load();
  }, [formData.district]);

  const handleFileChange = (e) => {
    const { name } = e.target;
    setFiles((prev) => ({ ...prev, [name]: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      // Check if logged in
      if (!token) {
        throw new Error("You must be logged in to register a business account");
      }

      // Validate required fields
      if (!formData.company_name || !formData.company_email) {
        throw new Error("Company name and email are required");
      }
      if (!formData.province || !formData.district || !formData.municipal) {
        throw new Error("Location (Province, District, Municipal) is required");
      }

      // Validate document files
      if (documentType === "citizenship_card") {
        if (!files.citizenship_card_front || !files.citizenship_card_back) {
          throw new Error("Please upload both citizenship front and back");
        }
      } else if (documentType !== "citizenship_card") {
        if (!files.document_file || !files.passport_photo) {
          throw new Error("Please upload both document and passport photo");
        }
      }

      // Create FormData for multipart upload
      const formDataObj = new FormData();
      formDataObj.append("company_name", formData.company_name);
      formDataObj.append("company_email", formData.company_email);
      formDataObj.append("industry", formData.industry);
      formDataObj.append("website", formData.website);
      formDataObj.append("document_type", documentType);
      formDataObj.append("province", formData.province);
      formDataObj.append("district", formData.district);
      formDataObj.append("municipal", formData.municipal);

      // Append files based on document type
      if (documentType === "citizenship_card") {
        formDataObj.append("citizenship_front", files.citizenship_card_front);
        formDataObj.append("citizenship_back", files.citizenship_card_back);
      } else {
        formDataObj.append("document_file", files.document_file);
        formDataObj.append("passport_photo", files.passport_photo);
      }

      // Send request with Bearer token
      const res = await fetch(`${BASE_URL}/api/business-accounts/register`, {
        method: "POST",
        body: formDataObj,
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.message || body.err || "Registration failed");
      }

      toast.success("✓ Business account registered! Awaiting KYC verification...");
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard/business-account");
      }, 2000);
    } catch (err) {
      console.error(err);
      toast.error("✗ " + (err.message || "Registration failed"));
      setError("✗ " + (err.message || "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white py-12 px-4 pt-24">
      {!token && (
        <div className="max-w-2xl mx-auto mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          <p className="font-semibold mb-2">⚠️ Authentication Required</p>
          <p className="text-sm mb-4">You need to be logged in to register a business account.</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
          >
            Go to Login
          </button>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={4000} />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-700 mb-2">
            🏢 Register Your Business Account
          </h1>
          <p className="text-gray-600">
            Complete your business registration and KYC verification
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center mr-2 text-sm font-bold">
                  1
                </span>
                Company Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Tech Innovations Ltd"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Email *
                  </label>
                  <input
                    type="email"
                    name="company_email"
                    value={formData.company_email}
                    onChange={handleInputChange}
                    placeholder="company@example.com"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    placeholder="e.g., Software Development"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Location Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 rounded-full w-8 h-8 flex items-center justify-center mr-2 text-sm font-bold">
                  2
                </span>
                Business Location
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Province *
                  </label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Province</option>
                    {provinces.map((p) => (
                      <option key={p.province_code} value={p.province_code}>
                        {p.name_en} || {p.name_np}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District *
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    disabled={!formData.province}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  >
                    <option value="">Select District</option>
                    {districts.map((d) => (
                      <option key={d.district_code} value={d.district_code}>
                        {d.name_en} || {d.name_np}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Municipal *
                  </label>
                  <select
                    name="municipal"
                    value={formData.municipal}
                    onChange={handleInputChange}
                    disabled={!formData.district}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  >
                    <option value="">Select Municipal</option>
                    {municipals.map((m) => (
                      <option key={m.municipal_code} value={m.municipal_code}>
                        {m.name_en} || {m.name_np}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Document Type Selection */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 rounded-full w-8 h-8 flex items-center justify-center mr-2 text-sm font-bold">
                  3
                </span>
                KYC Verification Documents
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 mb-3">
                  Choose one of the following document combinations:
                </p>

                <div className="space-y-3">
                  <label className="flex items-start p-3 border-2 rounded-lg cursor-pointer hover:bg-blue-100 transition"
                    style={{
                      borderColor: documentType === "citizenship_card" ? "#3b82f6" : "#e5e7eb",
                      backgroundColor: documentType === "citizenship_card" ? "#eff6ff" : "white",
                    }}>
                    <input
                      type="radio"
                      name="document_type"
                      value="citizenship_card"
                      checked={documentType === "citizenship_card"}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Citizenship Card</div>
                      <div className="text-sm text-gray-600">
                        Upload both front and back of your citizenship card
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start p-3 border-2 rounded-lg cursor-pointer hover:bg-blue-100 transition"
                    style={{
                      borderColor: documentType !== "citizenship_card" ? "#3b82f6" : "#e5e7eb",
                      backgroundColor: documentType !== "citizenship_card" ? "#eff6ff" : "white",
                    }}>
                    <input
                      type="radio"
                      name="document_type"
                      value="passport"
                      checked={documentType !== "citizenship_card"}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Other Document + Passport</div>
                      <div className="text-sm text-gray-600">
                        Upload any government ID and a passport-size photo
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Citizenship Documents */}
              {documentType === "citizenship_card" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📄 Citizenship Card Front *
                    </label>
                    <input
                      type="file"
                      name="citizenship_card_front"
                      onChange={handleFileChange}
                      accept="image/*"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG (max 5MB)</p>
                    {files.citizenship_card_front && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ {files.citizenship_card_front.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📄 Citizenship Card Back *
                    </label>
                    <input
                      type="file"
                      name="citizenship_card_back"
                      onChange={handleFileChange}
                      accept="image/*"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG (max 5MB)</p>
                    {files.citizenship_card_back && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ {files.citizenship_card_back.name}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Other Document + Passport */}
              {documentType !== "citizenship_card" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📄 Document (Passport, Driver License, etc.) *
                    </label>
                    <input
                      type="file"
                      name="document_file"
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, PDF (max 5MB)</p>
                    {files.document_file && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ {files.document_file.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📷 Passport Size Photo *
                    </label>
                    <input
                      type="file"
                      name="passport_photo"
                      onChange={handleFileChange}
                      accept="image/*"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG (max 5MB)</p>
                    {files.passport_photo && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ {files.passport_photo.name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Messages */}
            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
                {message}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Registering..." : "Register Business Account"}
            </button>

            {/* Terms */}
            <p className="text-xs text-gray-600 text-center">
              By registering, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">❓ Questions?</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>• Your KYC documents will be reviewed by our admin team</li>
            <li>• Verification typically takes 24-48 hours</li>
            <li>• You'll be notified once your account is verified</li>
            <li>• Only verified accounts can post jobs and find candidates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
