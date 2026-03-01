"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
// import RoomFilter from "./RoomFilter"; // Left filter component
import RoomFilter from "./leftfilter/Index"
import RoomResult from "./rightfilter/index"; // Right results component

export default function RoomContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [filters, setFilters] = useState({
    priceMin: null,
    priceMax: null,
    location: null, 
    radius: null,   
    name: searchQuery,
  });

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Left Filter Panel */}
      <div className="w-full md:w-1/4">
        <RoomFilter filters={filters} setFilters={setFilters} />
      </div>

      {/* Right Results Panel */}
      <div className="w-full md:w-3/4">
        <RoomResult filters={filters} />
      </div>
    </div>
  );
}
