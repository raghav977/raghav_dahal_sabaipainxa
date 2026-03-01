"use client"

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PriceFilter from "./PriceFilter";
import { LocationPicker } from "./LocationPicker";
import NameFilter from "./NameFilter";

export default function LeftFilter({ filters, setFilters }) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("name") || "";

  const [customerLocation, setCustomerLocation] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCustomerLocation({ latitude, longitude });
        },
        (error) => console.error("Error fetching location:", error)
      );
    }
  }, []);

  return (
    <div className="space-y-4">
      <NameFilter filters={filters} setFilters={setFilters} initialName={searchQuery} />
      <PriceFilter filters={filters} setFilters={setFilters} />
      <LocationPicker filters={filters} setFilters={setFilters} customerLocation={customerLocation} />
    </div>
  );
}
