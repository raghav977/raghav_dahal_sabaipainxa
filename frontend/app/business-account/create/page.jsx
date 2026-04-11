"use client";
import BusinessAccountModal from "@/app/business-account/components/BusinessAccountModal";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EmailStep from "@/app/business-account/components/EmailStep";
import OtpStep from "@/app/business-account/components/OtpStep";
import DetailStep from "@/app/business-account/components/DetailStep";
import { toast, ToastContainer } from "react-toastify";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export default function BusinessAccountCreatePage() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        email: "",
        name: "",
        company_name: "",
        company_email: "",
        industry: "",
        website: "",
        pan: "",
        registrationFile: null,
        citizenship_front: null,
        citizenship_back: null,
        documentFile: null,
        passport_photo: null,
        password: null,
        confirmPassword: null,
        documentType: "citizenship_card",
    });

    const [step, setStep] = useState(1);
    const [otp, setOtp] = useState("");
    const [verifiedEmail, setVerifiedEmail] = useState(null);

    const incrementStep = async (e) => {
        e?.preventDefault?.();
        
        // Step 1: Email submission - send OTP
        if (step === 1) {
            if (!formData.email) {
                toast.error("Please enter an email");
                return;
            }
            
            try {
                setLoading(true);
                setError(null);
                
                // Call backend to send OTP
                const res = await fetch(`${BASE_URL}/api/users/request-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: formData.email }),
                });

                const body = await res.json();
                
                if (!res.ok) {
                    throw new Error(body?.message || "Failed to send OTP");
                }

                toast.success("OTP sent to your email! Check your inbox.");
                setStep(2);
            } catch (err) {
                console.error(err);
                const errorMsg = err.message || "Failed to send OTP";
                setError(errorMsg);
                toast.error(errorMsg);
            } finally {
                setLoading(false);
            }
        }
    };

    const onVerified = async () => {
        try {
            setLoading(true);
            setError(null);

            // Verify OTP with backend
            const res = await fetch(`${BASE_URL}/api/users/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: formData.email,
                    otp: formData.otp 
                }),
            });

            const body = await res.json();
            
            if (!res.ok) {
                throw new Error(body?.message || "Invalid OTP");
            }

            setVerifiedEmail(formData.email);
            toast.success("Email verified successfully! Proceed to KYC.");
            setStep(3);
        } catch (err) {
            console.error(err);
            const errorMsg = err.message || "OTP verification failed";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleDetailSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            // Validate required fields
            if (!formData.name?.trim()) {
                throw new Error("Full name is required");
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
            if (!formData.password?.trim()) {
                throw new Error("Password is required");
            }

            // Step 1: Create user account
            const userRes = await fetch(`${BASE_URL}/api/users/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: verifiedEmail,
                    password: formData.password,
                    municipal_code: "1" // Default - you might want to ask user for this
                }),
            });

            const userBody = await userRes.json();
            if (!userRes.ok) {
                throw new Error(userBody?.message || "Failed to create user account");
            }

            const newUser = userBody?.data?.newUser;
            if (!newUser?.id) {
                throw new Error("User created but ID not found in response");
            }

            // Step 2: Create business account with the new user_id
            const businessData = new FormData();
            businessData.append("user_id", newUser.id);
            businessData.append("company_name", formData.name);
            businessData.append("company_email", formData.company_email);
            businessData.append("industry", formData.industry || "");
            businessData.append("website", formData.website || "");
            businessData.append("document_type", formData.documentType);

            // Add documents based on type
            if (formData.documentType === "citizenship_card") {
                if (formData.citizenship_front) businessData.append("citizenship_front", formData.citizenship_front);
                if (formData.citizenship_back) businessData.append("citizenship_back", formData.citizenship_back);
            } else {
                if (formData.documentFile) businessData.append("document_file", formData.documentFile);
            }

            if (formData.passport_photo) {
                businessData.append("passport_photo", formData.passport_photo);
            }

            // Submit business account
            const bizRes = await fetch(`${BASE_URL}/api/business-accounts/register`, {
                method: "POST",
                body: businessData,
            });

            const bizBody = await bizRes.json();

            if (!bizRes.ok) {
                throw new Error(bizBody?.message || "Failed to create business account");
            }

            toast.success("Business account created! Awaiting KYC verification.");
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                router.push("/dashboard/business-account");
            }, 2000);
        } catch (err) {
            console.error(err);
            const errorMsg = err.message || "Failed to create account";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }



    if (!isModalOpen) {
        router.push("/business-account/");
    }

    return (
        <div className="mt-14">
            <ToastContainer position="top-right" autoClose={4000} />
            
            {isModalOpen && (
                <BusinessAccountModal onClose={() => setIsModalOpen(false)}>
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}
                    
                    {step === 1 && (
                        <EmailStep 
                            data={formData.email} 
                            setData={(email) => setFormData({ ...formData, email })} 
                            onNext={incrementStep}
                            loading={loading}
                        />
                    )}
                    
                    {step === 2 && (
                        <OtpStep 
                            data={formData.otp} 
                            setData={(otp) => setFormData({ ...formData, otp })} 
                            onNext={onVerified}
                            onBack={() => setStep(1)}
                            loading={loading}
                        />
                    )}
                    
                    {step === 3 && (
                        <DetailStep 
                            data={formData} 
                            setData={setFormData} 
                            onBack={() => setStep(2)}
                            onSubmit={handleDetailSubmit}
                            loading={loading}
                        />
                    )}
                </BusinessAccountModal>
            )}
        </div>
    );
}