"use client";

import { fetchAllServicesName } from "@/app/redux/thunks/serviceThunks";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";

import { ArrowRight } from "lucide-react";

export default function PopularCategory() {
  const dispatch = useDispatch();

  const {
    list: services,
    loading,
    error,
  } = useSelector((state) => state.servicesReal.publicServicesNames);

  useEffect(() => {
    dispatch(fetchAllServicesName());
  }, [dispatch]);
  const marqueeCategories =
    services.length > 0 ? [...services, ...services] : [];
  const half = Math.ceil(marqueeCategories.length / 2);
  const firstRow = marqueeCategories.slice(0, half);
  const secondRow = marqueeCategories.slice(half);

  if (loading) {
    return (
      <section className="py-20 bg-white text-center">
        <p className="font-semibold">Loading popular categories...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-white text-center">
        <p className="text-red-600 font-semibold">
          Failed to load categories: {error}
        </p>
      </section>
    );
  }

  if (!services.length) {
    return null;
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
        <div className="max-w-md">
          <h2 className="text-4xl font-playfair font-bold text-gray-800 mb-4">
            Explore Popular Categories
          </h2>
          <p className="text-gray-600 font-ibm mb-8 leading-relaxed">
            Discover a wide range of services offered by our talented providers.
            From home repairs to creative services, find the right professional
            for your needs.
          </p>
          <Button className="bg-green-600 cursor-pointer hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-full flex items-center gap-2" onClick={() => window.location.href = '/home-services'}>
            Explore All Services <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative h-96 overflow-hidden flex gap-8">
          <div className="w-1/2 space-y-8 animate-marquee-up">
            {firstRow.map((cat, idx) => (
              <div
                key={`first-${cat.name}-${idx}`}
                className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm p-6 text-center transition-transform hover:scale-105 hover:shadow-md cursor-pointer"
              >
                <span className="font-semibold text-gray-700 text-lg">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
          <div className="w-1/2 space-y-8 animate-marquee-down">
            {secondRow.map((cat, idx) => (
              <div
                key={`second-${cat.name}-${idx}`}
                className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm p-6 text-center transition-transform hover:scale-105 hover:shadow-md cursor-pointer"
              >
                <span className="font-semibold text-gray-700 text-lg">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee-up {
          0% {
            transform: translateY(0%);
          }
          100% {
            transform: translateY(-50%);
          }
        }
        @keyframes marquee-down {
          0% {
            transform: translateY(-50%);
          }
          100% {
            transform: translateY(0%);
          }
        }
        .animate-marquee-up {
          animation: marquee-up 40s linear infinite;
        }
        .animate-marquee-down {
          animation: marquee-down 40s linear infinite;
        }
      `}</style>
    </section>
  );
}
