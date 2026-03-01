"use client";

import React from "react";

export default function BlockReasonModal({ open, user, reason = "", onChangeReason, onCancel, onConfirm, loading = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-md rounded-lg border p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-green-700">Block user</h3>
        <p className="text-sm text-gray-600 mt-1">Provide a reason for blocking <span className="font-semibold">{user?.name || user?.email}</span></p>

        <textarea
          value={reason}
          onChange={(e) => onChangeReason && onChangeReason(e.target.value)}
          rows={4}
          className="w-full border rounded p-2 mt-4 text-sm focus:ring-2 focus:ring-green-200"
          placeholder="Reason (required)"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">Cancel</button>
          <button
            type="button"
            disabled={loading || !reason.trim()}
            onClick={onConfirm}
            className={`px-4 py-2 rounded text-white ${loading || !reason.trim() ? 'bg-green-300' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {loading ? 'Blocking…' : 'Block user'}
          </button>
        </div>
      </div>
    </div>
  );
}
