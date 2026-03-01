"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllServicesName } from "@/app/redux/thunks/serviceThunks";

import CategoryFilter from "./CategoryFilter";
import PriceFilter from "./PriceFilter";
import LocationPicker from "./LocationPicker";

export default function LeftFilter({ filters, setFilters }) {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const { list: categories = [], loading } = useSelector(
    (state) => state.servicesReal.publicServicesNames || {}
  );

  const [customerLocation, setCustomerLocation] = useState(null);


  useEffect(() => {
    if (!categories.length) {
      dispatch(fetchAllServicesName());
    }
  }, [categories.length, dispatch]);


  useEffect(() => {
    if (searchQuery && categories.length) {
      const matchedCategory = categories.find(
        (cat) => cat.name.toLowerCase() === searchQuery.toLowerCase()
      );
      if (matchedCategory) {
        setFilters((prev) => ({ ...prev, category: matchedCategory.id }));
      } else {
        setFilters((prev) => ({ ...prev, category: "" }));
      }
    }
  }, [searchQuery, categories, setFilters]);


  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCustomerLocation({ latitude, longitude });
          setFilters((prev) => ({
            ...prev,
            location: { latitude, longitude },
          }));
        },
        (error) => console.error("Error fetching location:", error)
      );
    }
  }, [setFilters]);

  return (
    <div className="space-y-4">
      <CategoryFilter filters={filters} setFilters={setFilters} />
      <PriceFilter filters={filters} setFilters={setFilters} />
      <LocationPicker
        customerLocation={customerLocation}
        setFilters={setFilters}
      />
    </div>
  );
}
