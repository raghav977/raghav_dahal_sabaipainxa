"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Select from "@/components/Select";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function DetailStep({ data, setData, onBack, onSubmit, loading }) {
  const documentTypesFromStore = useSelector((state) => state.document?.list);
  const [documentOptions, setDocumentOptions] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    // prefer redux store list if available
    if (Array.isArray(documentTypesFromStore) && documentTypesFromStore.length > 0) {
      setDocumentOptions(documentTypesFromStore.map((d) => ({ value: d, label: String(d).replace(/_/g, " ") })));
      return;
    }

    // otherwise fetch document types from backend
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
        // ignore silently; fallback will be empty options
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

  const onSelectDocumentType = (val) => {
    setData({ ...data, documentType: val });
  };

  const handleFile = (key, file) => {
    setData({ ...data, [key]: file });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Details</h2>

      <label className="text-sm font-medium mt-4 block">Business Name</label>
      <input
        placeholder="Business Name"
        value={data.name || ""}
        className="w-full rounded-md border px-3 py-2"
        onChange={(e) => setData({ ...data, name: e.target.value })}
      />

      <label className="text-sm font-medium mt-4 block">Company Email</label>
      <input
        placeholder="company@example.com"
        type="email"
        value={data.company_email || ""}
        className="w-full rounded-md border px-3 py-2 mt-1"
        onChange={(e) => setData({ ...data, company_email: e.target.value })}
      />

      <label className="text-sm font-medium mt-4 block">Industry</label>
      <input
        placeholder="e.g., Technology, Healthcare, Finance"
        value={data.industry || ""}
        className="w-full rounded-md border px-3 py-2 mt-1"
        onChange={(e) => setData({ ...data, industry: e.target.value })}
      />

      <label className="text-sm font-medium mt-4 block">Website (Optional)</label>
      <input
        placeholder="https://example.com"
        type="url"
        value={data.website || ""}
        className="w-full rounded-md border px-3 py-2 mt-1"
        onChange={(e) => setData({ ...data, website: e.target.value })}
      />

      <label className="text-sm font-medium mt-4 block">PAN Number (Optional)</label>
      <input
        placeholder="PAN Number"
        value={data.pan || ""}
        className="w-full rounded-md border px-3 py-2 mt-1"
        onChange={(e) => setData({ ...data, pan: e.target.value })}
      />

        <label className="text-sm font-medium mt-4 block">Password</label>
      <input
        placeholder="Password"
        type="password"
        value={data.password || ""}
        className="w-full rounded-md border px-3 py-2 mt-1"
        onChange={(e) => setData({ ...data, password: e.target.value })}
      />

      <label className="text-sm font-medium mt-4 block">Confirm Password</label>
      <input
        placeholder="Confirm Password"
        value={data.confirmPassword || ""}
        className="w-full rounded-md border px-3 py-2 mt-1"
        onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
      />


      
      <div className="mt-4">
        <Select
          label={loadingDocs ? "Loading document types…" : "Document Type"}
          options={documentOptions}
          value={data.documentType}
          onChange={onSelectDocumentType}
          placeholder="Choose document type"
        />
      </div>

      {/* Conditional document inputs: require documentType to be chosen before allowing uploads */}
      {data.documentType ? (
        data.documentType === "citizenship_card" ? (
          <div className="mt-4 space-y-2">
            <div>
              <label className="text-sm font-medium">Citizenship Front</label>
              <input
                type="file"
                accept="image/*"
                className="block mt-1"
                onChange={(e) => handleFile("citizenship_front", e.target.files?.[0] ?? null)}
              />
              {data.citizenship_front && <div className="text-sm text-slate-600">Selected: {data.citizenship_front.name}</div>}
            </div>
            <div>
              <label className="text-sm font-medium">Citizenship Back</label>
              <input
                type="file"
                accept="image/*"
                className="block mt-1"
                onChange={(e) => handleFile("citizenship_back", e.target.files?.[0] ?? null)}
              />
              {data.citizenship_back && <div className="text-sm text-slate-600">Selected: {data.citizenship_back.name}</div>}
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <label className="text-sm font-medium">Document File</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="block mt-1"
              onChange={(e) => handleFile("documentFile", e.target.files?.[0] ?? null)}
            />
            {data.documentFile && <div className="text-sm text-slate-600">Selected: {data.documentFile.name}</div>}
          </div>
        )
      ) : (
        <div className="mt-4">
          <label className="text-sm font-medium">Document File</label>
          <div className="text-sm text-slate-500 mt-1">Please select a document type above to enable file upload.</div>
        </div>
      )}

      {/* Passport size photo always requested */}
      <div className="mt-4">
        <label className="text-sm font-medium">Passport Size Photo *</label>
        <input 
          type="file" 
          accept="image/*" 
          className="block mt-1" 
          onChange={(e) => handleFile("passport_photo", e.target.files?.[0] ?? null)} 
        />
        {data.passport_photo && <div className="text-sm text-slate-600">✅ Selected: {data.passport_photo.name}</div>}
      </div>

      <div className="flex gap-2 mt-6">
        <button 
          className="px-4 py-2 rounded-md border hover:bg-gray-100" 
          onClick={onBack} 
          type="button"
          disabled={loading}
        >
          Back
        </button>
        <button 
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md flex-1"
          onClick={onSubmit}
          type="button"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Create Account"}
        </button>
      </div>
    </div>
  );
}