"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import { useSelector } from "react-redux";
import BusinessAccountModal from "@/app/business-account/components/BusinessAccountModal";
import BusinessRegistrationForm from "@/app/dashboard/business-account/components/BusinessRegistrationForm";
import { getTokenFromLocalStorage } from "@/helper/token";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export default function BusinessAccountRegisterPage() {
    const router = useRouter();
    const reduxUser = useSelector((state) => state.auth?.user);
    const reduxToken = useSelector((state) => state.auth?.token);
    const [isReady, setIsReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Check both Redux and localStorage for auth
    const token = reduxToken || getTokenFromLocalStorage("token");
    const user = reduxUser;

    useEffect(() => {
        // If Redux is empty but localStorage has token, page is ready anyway
        // (user data can be loaded on demand)
        if (token) {
            setIsReady(true);
        } else {
            setIsReady(true); // Set to true so we can show "Please log in" message
        }
    }, [token]);

    const [formData, setFormData] = useState({
        company_name: "",
        company_email: "",
        industry: "",
        website: "",
        citizenship_front: null,
        citizenship_back: null,
        documentFile: null,
        passport_photo: null,
        documentType: "citizenship_card",
    });

    if (!isReady) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!token) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-lg font-semibold mb-4">Please log in first</p>
                    <button
                        onClick={() => router.push("/auth/login")}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            // Validate required fields
            if (!formData.company_name?.trim()) {
                throw new Error("Company name is required");
            }
            if (!formData.company_email?.trim()) {
                throw new Error("Company email is required");
            }
            if (!formData.citizenship_front && !formData.documentFile) {
                throw new Error("Please upload required documents");
            }
            if (!formData.passport_photo) {
                throw new Error("Passport photo is required");
            }

            // Create FormData for multipart submission
            const submitData = new FormData();
            submitData.append("company_name", formData.company_name);
            submitData.append("company_email", formData.company_email);
            submitData.append("industry", formData.industry || "");
            submitData.append("website", formData.website || "");
            submitData.append("document_type", formData.documentType);

            // Add documents based on type
            if (formData.documentType === "citizenship_card") {
                if (formData.citizenship_front) submitData.append("citizenship_front", formData.citizenship_front);
                if (formData.citizenship_back) submitData.append("citizenship_back", formData.citizenship_back);
            } else {
                if (formData.documentFile) submitData.append("document_file", formData.documentFile);
            }

            if (formData.passport_photo) {
                submitData.append("passport_photo", formData.passport_photo);
            }

            // Submit to backend with authentication
            const res = await fetch(`${BASE_URL}/api/business-accounts/register`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: submitData,
            });

            const body = await res.json();

            if (!res.ok) {
                throw new Error(body?.message || "Failed to register business account");
            }

            toast.success("Business account registered! Awaiting KYC verification.");
            
            // Redirect after 2 seconds
            setTimeout(() => {
                router.push("/dashboard/business-account");
            }, 2000);
        } catch (err) {
            console.error(err);
            const errorMsg = err.message || "Failed to register business account";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-14">
            <ToastContainer position="top-right" autoClose={4000} />
            <BusinessRegistrationForm
                data={formData}
                setData={setFormData}
                onSubmit={handleSubmit}
                loading={loading}
                error={error}
            />
        </div>
    );
}
