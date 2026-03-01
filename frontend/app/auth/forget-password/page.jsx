"use client";

import { useState } from "react";

export default function ForgetPassword() {

  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [lockButton,setLockButton] = useState(false);

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  // Step 1: Request OTP
  const handleRequestOtp = async () => {
    setError("");
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/users/forget-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      console.log("OTP request response:", data);

      if (!res.ok) {
        setError(data.message || "Failed to send OTP. Try again.");
        console.log("OTP request error:", data.message);
        setLoading(false);
        return;
      }

      setStep(2);
      setSuccessMsg("OTP sent to your email.");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    setError("");

    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/users/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid OTP. Please try again.");
        setLoading(false);
        return;
      }

      setSuccessMsg("OTP verified successfully! Now set your new password.");
      setStep(3);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to reset password.");
        setLoading(false);
        return;
      }

      setSuccessMsg("Password reset successfully! You can now login.");
      setStep(4);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Forgot Password</h1>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 mb-4 rounded">{error}</div>
      )}

      {successMsg && (
        <div className="bg-green-100 text-green-700 px-4 py-2 mb-4 rounded">{successMsg}</div>
      )}

      {step === 1 && (
        <>
          <label className="block mb-2 font-semibold" htmlFor="email">
            Enter your email address
          </label>
          <input
            type="email"
            id="email"
            className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={handleRequestOtp}
            disabled={loading}
            className={`w-full py-2 px-4 rounded text-white font-semibold ${
              loading ? "bg-green-300" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <p className="mb-4">
            Enter the 6-digit OTP sent to <strong>{email}</strong>.
          </p>

          <input
            type="text"
            maxLength={6}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-6 text-center tracking-widest text-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            disabled={loading}
          />

          <button
            onClick={handleVerifyOtp}
            disabled={loading}
            className={`w-full py-2 px-4 rounded text-white font-semibold ${
              loading ? "bg-green-300" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Verifying OTP..." : "Verify OTP"}
          </button>

          <button
            className="mt-3 text-sm text-indigo-600 underline"
            onClick={() => setStep(1)}
            disabled={loading}
          >
            Change Email
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <p className="mb-4 text-green-700">
            ✓ OTP verified! Now set your new password.
          </p>

          <label className="block mb-2 font-semibold" htmlFor="newPassword">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
          />

          <label className="block mb-2 font-semibold" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            className="w-full border border-gray-300 rounded px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />

          <button
            onClick={handleResetPassword}
            disabled={loading}
            className={`w-full py-2 px-4 rounded text-white font-semibold ${
              loading ? "bg-green-300" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </>
      )}

      {step === 4 && (
        <div className="text-center">
          <p className="mb-4 text-green-700 font-semibold">
            Your password has been reset successfully.
          </p>
          <a
            href="/login"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded"
          >
            Go to Login
          </a>
        </div>
      )}
    </div>
  );
}
