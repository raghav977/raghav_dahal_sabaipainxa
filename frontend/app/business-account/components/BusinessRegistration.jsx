"use client";

import { useState, useRef } from "react";
import MapPicker from "@/components/map/MapPicker";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function EmailStep({ onSent }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendOtp = async () => {
    setError(null);
    if (!email || !email.includes("@")) return setError("Enter a valid email");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/business/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message || "Failed to send OTP");
      onSent(email);
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Business Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border px-3 py-2" />
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex gap-2 mt-2">
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-md" onClick={sendOtp} disabled={loading}>
          {loading ? "Sending…" : "Send OTP"}
        </button>
      </div>    
    </div>
  );
}

function OtpStep({ email, onVerified, onBack }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const verify = async () => {
    setError(null);
    if (!otp) return setError("Enter OTP");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/business/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message || "Failed to verify OTP");
      onVerified();
    } catch (err) {
      setError(err.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-600">OTP sent to <strong>{email}</strong></div>
      <input value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full rounded-md border px-3 py-2" placeholder="Enter OTP" />
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex gap-2">
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-md" onClick={verify} disabled={loading}>{loading ? 'Verifying…' : 'Verify'}</button>
        <button className="px-4 py-2 rounded-md border" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}

export default function BusinessRegistration() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");

  // Details
  const [businessName, setBusinessName] = useState("");
  const [password, setPassword] = useState("");
  const [description, setDescription] = useState("");
  const [pan, setPan] = useState("");
  const [files, setFiles] = useState([]);
  const [location, setLocation] = useState({ lat: null, lng: null, address: "" });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const onEmailSent = (e) => {
    setEmail(e);
    setStep("otp");
  };

  const onOtpVerified = () => setStep("details");

  const handleFiles = (selectedFiles) => {
    const accepted = [];
    for (let i = 0; i < selectedFiles.length && accepted.length < 3; i++) {
      const f = selectedFiles[i];
      if (f.type !== "application/pdf" && !f.name.endsWith(".pdf")) continue;
      accepted.push(f);
    }
    setFiles(accepted);
  };

  const submit = async () => {
    setError(null);
    if (!businessName || !password || !pan) return setError("Please fill required fields");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("email", email);
      fd.append("businessName", businessName);
      fd.append("password", password);
      fd.append("description", description);
      fd.append("pan", pan);
      fd.append("location", JSON.stringify(location));
      files.forEach((f, idx) => fd.append("registrationCertificates", f));

      const res = await fetch(`${BASE_URL}/api/business/register`, {
        method: "POST",
        body: fd,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message || "Registration failed");
      setStep("success");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === "email" && <EmailStep onSent={onEmailSent} />}
      {step === "otp" && <OtpStep email={email} onVerified={onOtpVerified} onBack={() => setStep("email")} />}

      {step === "details" && (
        <div className="space-y-3">
          <label className="text-sm font-medium">Business Name</label>
          <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full rounded-md border px-3 py-2" />

          <label className="text-sm font-medium">Location</label>
          <MapPicker value={location} onChange={setLocation} />

          <label className="text-sm font-medium">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border px-3 py-2" />

          <label className="text-sm font-medium">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border px-3 py-2" rows={3} />

          <label className="text-sm font-medium">PAN Number</label>
          <input value={pan} onChange={(e) => setPan(e.target.value)} className="w-full rounded-md border px-3 py-2" />

          <label className="text-sm font-medium">Company Registration Certificate (PDF, up to 3)</label>
          <input ref={fileInputRef} type="file" accept="application/pdf" multiple onChange={(e) => handleFiles(e.target.files)} className="block" />
          <div className="text-sm text-slate-600">Selected: {files.length} file(s)</div>
          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex gap-2">
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-md" onClick={submit} disabled={loading}>{loading ? 'Submitting…' : 'Create Account'}</button>
            <button className="px-4 py-2 rounded-md border" onClick={() => setStep("otp")}>Back</button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-md">
          <h3 className="font-semibold">Registration submitted</h3>
          <p className="text-sm text-slate-600">We'll review your application and notify you by email.</p>
        </div>
      )}
    </div>
  );
}
