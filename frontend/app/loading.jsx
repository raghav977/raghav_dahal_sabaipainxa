
"use client";

export default function Loading({ message = "Loading..." }) {
  return (
    <div className="flex items-center justify-center h-full w-full py-20">
      <div className="flex flex-col items-center gap-3">

        <div className="w-12 h-12 border-4 border-t-green-600 border-gray-200 rounded-full animate-spin"></div>

        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
}
