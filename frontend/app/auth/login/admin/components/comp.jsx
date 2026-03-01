"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "/public/placeholder-logo.png";

import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || `Http Error! status: ${response.status}`);
      }
      setLoading(false);
      const data = await response.json();
      console.log("Login successful:", data);

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      router.push("/dashboard/admin-dashboard/");
    } catch (err) {
      setLoading(false);
      setError("Invalid credentials or server error.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white shadow-xl border rounded-[4px] p-8 sm:p-10">
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Admin Portal
            </h1>
            <p className="text-sm text-slate-500">Secure admin sign in</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[4px] border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="dipsika@gmail.com"
                autoComplete="email"
                required
                aria-required="true"
              />
              <span className="absolute right-3 top-3 text-slate-400 text-sm">
                {email ? "" : ""}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[4px] border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-3 text-sm text-slate-600 hover:text-slate-800"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember((r) => !r)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-slate-600">Remember me</span>
            </label>
            <a className="text-emerald-600 hover:underline" href="/auth/forgot">
              Forgot password?
            </a>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-semibold transition ${
              loading
                ? "bg-emerald-300 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-400">
          By continuing, you agree to the admin terms and privacy policy.
        </p>
      </div>
    </div>
  );
}
