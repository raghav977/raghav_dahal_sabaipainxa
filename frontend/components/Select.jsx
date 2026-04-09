"use client";

import React from "react";

export default function Select({ label, options = [], value, onChange, placeholder = "Select...", className = "" }) {
  return (
    <div className={className}>
      {label && <label className="text-sm font-medium block mb-1">{label}</label>}
      <select
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="w-full rounded-md border px-3 py-2"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? String(opt)}
          </option>
        ))}
      </select>
    </div>
  );
}
