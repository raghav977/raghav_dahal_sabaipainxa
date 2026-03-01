"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaChevronLeft, FaChevronRight, FaStar } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { fetchServicesImageTitleRate } from "@/app/redux/thunks/serviceThunks";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export default function FeatureService() {
  const dispatch = useDispatch();
  const router = useRouter();

  const {
    list: services,
    loading,
    error,
  } = useSelector((state) => state.servicesReal.publicServicesCards);

  const [startIdx, setStartIdx] = useState(0);
  const visibleCount = 4; 

  useEffect(() => {
    dispatch(fetchServicesImageTitleRate({ limit: 10, offset: 0 }));
  }, [dispatch]);

  const handlePrev = () => {
    setStartIdx((prev) =>
      prev === 0 ? Math.max(services.length - visibleCount, 0) : prev - 1
    );
  };

  const handleNext = () => {
    setStartIdx((prev) =>
      prev + visibleCount >= services.length ? 0 : prev + 1
    );
  };

  const visibleServices = [];
  for (let i = 0; i < visibleCount; i++) {
    if (services.length > 0) {
      visibleServices.push(services[(startIdx + i) % services.length]);
    }
  }

  if (loading) {
    return (
      <section className="py-20 bg-gray-100 w-full text-center">
        <p className="font-semibold">Loading featured services...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gray-100 w-full text-center">
        <p className="text-red-600 font-semibold">
          Failed to load services: {error}
        </p>
      </section>
    );
  }

  if (!services.length) {
    return null; // Don't render if no services
  }

  const newLocal = <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
    {/* <FaStar className="text-yellow-400" /> */}
    {/* <span>{service.rate} (100+ reviews)</span> */}
  </div>;
  return (
    <section className="py-20 bg-gray-100 w-full">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-playfair font-bold text-gray-800">
            Featured Services
          </h2>
          <p className="text-gray-600 font-ibm mt-2 max-w-2xl mx-auto">
            Explore some of our most popular and highly-rated services, trusted
            by our community.
          </p>
        </div>

        <div className="relative flex items-center">
          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            className="absolute -left-4 z-10 bg-white rounded-full p-3 shadow-md hover:bg-gray-200 transition disabled:opacity-50"
            aria-label="Previous Service"
            disabled={startIdx === 0}
          >
            <FaChevronLeft className="text-gray-700 text-xl" />
          </button>

          {/* Service Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            {visibleServices.map((service) => (
              <div
                key={service.id}
                onClick={() => router.push(`/services-detail/${service.id}`)}
                className="bg-white rounded-[4px] border border-gray-200 overflow-hidden group cursor-pointer"
              >
                <img
                  src={
                    service.images?.[0]
                      ? `${BACKEND_URL}${service.images[0]}`
                      : "/placeholder.jpg" // Fallback image
                  }
                  alt={service.name || "Service"}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 truncate mb-1">
                    {service.name}
                  </h3>
                  {newLocal}
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {service.description.slice(0, 20)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="absolute -right-4 z-10 bg-white rounded-full p-3 shadow-md hover:bg-gray-200 transition disabled:opacity-50"
            aria-label="Next Service"
            disabled={startIdx + visibleCount >= services.length}
          >
            <FaChevronRight className="text-gray-700 text-xl" />
          </button>
        </div>

        <div className="text-center mt-12">
          <Button
            variant="outline"
            className="border-green-600 cursor-pointer text-green-600 hover:bg-green-50 hover:text-green-700 font-semibold py-3 px-6 rounded-[4px]"
            onClick={() => router.push("/home-services")}
          >
            View All Services
          </Button>
        </div>
      </div>
    </section>
  );
}
