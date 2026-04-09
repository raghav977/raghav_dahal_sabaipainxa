"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Select from "@/components/Select";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function BusinessRegistrationForm({ data, setData, onSubmit, loading, error }) {
    const documentTypesFromStore = useSelector((state) => state.document?.list);
    const [documentOptions, setDocumentOptions] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    useEffect(() => {
        if (Array.isArray(documentTypesFromStore) && documentTypesFromStore.length > 0) {
            setDocumentOptions(documentTypesFromStore.map((d) => ({ value: d, label: String(d).replace(/_/g, " ") })));
            return;
        }

        let mounted = true;
        const fetchTypes = async () => {
            setLoadingDocs(true);
            try {
                const res = await fetch(`${BASE_URL}/api/kyc/document-type`);
                const body = await res.json();
                if (res.ok && body?.data?.type) {
                    const types = body.data.type;
                    if (mounted) setDocumentOptions(types.map((t) => ({ value: t, label: String(t).replace(/_/g, " ") })));
                }
            } catch (err) {
                console.error("Failed to fetch document types", err);
            } finally {
                if (mounted) setLoadingDocs(false);
            }
        };
        fetchTypes();
        return () => {
            mounted = false;
        };
    }, [documentTypesFromStore]);

    const handleFile = (key, file) => {
        setData({ ...data, [key]: file });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-green-700 mb-2">Business Account Registration</h1>
                    <p className="text-gray-600 mb-8">Complete your business account setup and KYC verification</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6">
                        {/* Company Details Section */}
                        <div className="border-b pb-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Company Details</h2>

                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">Company Name *</label>
                                <input
                                    type="text"
                                    placeholder="Your company name"
                                    value={data.company_name || ""}
                                    onChange={(e) => setData({ ...data, company_name: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-green-500"
                                    disabled={loading}
                                />
                            </div>

                            <div className="mt-4">
                                <label className="text-sm font-medium text-gray-700 block mb-2">Company Email *</label>
                                <input
                                    type="email"
                                    placeholder="company@example.com"
                                    value={data.company_email || ""}
                                    onChange={(e) => setData({ ...data, company_email: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-green-500"
                                    disabled={loading}
                                />
                            </div>

                            <div className="mt-4">
                                <label className="text-sm font-medium text-gray-700 block mb-2">Industry</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Technology, Healthcare, Construction"
                                    value={data.industry || ""}
                                    onChange={(e) => setData({ ...data, industry: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-green-500"
                                    disabled={loading}
                                />
                            </div>

                            <div className="mt-4">
                                <label className="text-sm font-medium text-gray-700 block mb-2">Website</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={data.website || ""}
                                    onChange={(e) => setData({ ...data, website: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-green-500"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Document Type Section */}
                        <div className="border-b pb-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">KYC Documents</h2>

                            <div>
                                <Select
                                    label={loadingDocs ? "Loading document types…" : "Document Type *"}
                                    options={documentOptions}
                                    value={data.documentType}
                                    onChange={(val) => setData({ ...data, documentType: val })}
                                    placeholder="Choose document type"
                                />
                            </div>

                            {/* Conditional document inputs */}
                            {data.documentType ? (
                                data.documentType === "citizenship_card" ? (
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-2">Citizenship Card (Front) *</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFile("citizenship_front", e.target.files?.[0] ?? null)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                                                disabled={loading}
                                            />
                                            {data.citizenship_front && (
                                                <p className="text-sm text-green-600 mt-1">✅ {data.citizenship_front.name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-2">Citizenship Card (Back) *</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFile("citizenship_back", e.target.files?.[0] ?? null)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                                                disabled={loading}
                                            />
                                            {data.citizenship_back && (
                                                <p className="text-sm text-green-600 mt-1">✅ {data.citizenship_back.name}</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4">
                                        <label className="text-sm font-medium text-gray-700 block mb-2">Document File *</label>
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={(e) => handleFile("documentFile", e.target.files?.[0] ?? null)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                                            disabled={loading}
                                        />
                                        {data.documentFile && (
                                            <p className="text-sm text-green-600 mt-1">✅ {data.documentFile.name}</p>
                                        )}
                                    </div>
                                )
                            ) : (
                                <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                                    Please select a document type to enable file upload
                                </div>
                            )}
                        </div>

                        {/* Passport Photo Section */}
                        <div className="pb-6">
                            <label className="text-sm font-medium text-gray-700 block mb-2">Passport Size Photo *</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFile("passport_photo", e.target.files?.[0] ?? null)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                                disabled={loading}
                            />
                            {data.passport_photo && (
                                <p className="text-sm text-green-600 mt-1">✅ {data.passport_photo.name}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
                        >
                            {loading ? "Registering..." : "Register Business Account"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
