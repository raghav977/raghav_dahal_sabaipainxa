"use client";

import { Button } from "@/components/ui/button";

export default function EmailStep({ data, setData, onNext, loading }) {
  return (
    <div className="flex flex-col gap-4">
      <form>
        <h2 className="text-lg font-semibold mb-3">Email Verification</h2>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full rounded-md border px-3 py-2"
          value={data}
          onChange={(e) => setData(e.target.value)}
          disabled={loading}
        />
        <button 
          onClick={onNext}
          type="submit"
          className="w-full mt-4 text-lg py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 font-bold rounded-lg transition text-white"
          disabled={loading}
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </form>
    </div>
  );
}