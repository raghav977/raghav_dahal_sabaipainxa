
"use client";

export default function OtpStep({ data, setData, onNext, onBack, loading }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold mb-3">Verify OTP</h2>
      <p className="text-sm text-gray-600">Enter the OTP sent to your email</p>
      <input
        placeholder="Enter 6-digit OTP"
        className="w-full rounded-md border px-3 py-2"
        maxLength="6"
        value={data || ""}
        onChange={(e) => setData(e.target.value.replace(/\D/g, ""))}
        disabled={loading}
      />
      <div className="flex gap-2">
        <button 
          onClick={onBack}
          type="button"
          className="flex-1 mt-2 text-lg py-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 font-bold rounded-lg transition text-black"
          disabled={loading}
        >
          Back
        </button>
        <button 
          onClick={onNext}
          type="submit"
          className="flex-1 mt-2 text-lg py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 font-bold rounded-lg transition text-white"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </div>
    </div>
  );
}
