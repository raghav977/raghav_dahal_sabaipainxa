"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchServiceDetailById } from "@/app/redux/thunks/serviceThunks";
import { useParams } from "next/navigation";
import ServiceGallery from "@/app/services-detail/[service]/components/ServiceGallery";
import ServiceInfo from "@/app/services-detail/[service]/components/ServiceInfo";
import PackageContent from "@/app/services-detail/[service]/components/PackageContent";
import ServiceLocationMap from "@/app/dashboard/admin-dashboard/service-detail/[service]/components/ServiceLocationMap";
import { FaMapPin, FaClock } from "react-icons/fa";

const formatTime = (timeString) => {
  if (!timeString) return "";
  const [hour, minute] = timeString.split(":");
  const h = parseInt(hour, 10);
  const m = parseInt(minute, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const formattedHour = h % 12 || 12;
  return `${formattedHour}:${m.toString().padStart(2, "0")} ${ampm}`;
};

export default function MainContent() {
  const dispatch = useDispatch();
  const { service } = useParams();

  const [schedules, setSchedules] = useState([]);
  const [includes, setIncludes] = useState([]);
  const [notes, setNotes] = useState("");



  const {
    selectedService: { data: serviceDetail, loading, error },
  } = useSelector((state) => state.servicesReal);

 
  console.log("This is service data",serviceDetail)

  useEffect(() => {
    if (service) dispatch(fetchServiceDetailById({ service }));
  }, [dispatch, service]);

  useEffect(() => {
    if (serviceDetail) {
        console.log("This is service detail from the detail wala",serviceDetail)
      setSchedules(
        serviceDetail.ServiceSchedules?.map((s) => ({
          id: s.id,
          day: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
        })) || []
      );
      setIncludes(serviceDetail.includes || []);
      setNotes(serviceDetail.note || "");
    }
  }, [serviceDetail]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-600">
        <div className="animate-spin h-8 w-8 border-b-2 border-green-500 rounded-full mr-3"></div>
        Loading service details...
      </div>
    );
  }

  if (error || !serviceDetail) {
    return (
      <div className="text-center py-20 text-red-500 font-semibold">
        {error || "Service not found"}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="lg:flex lg:space-x-8">
        {/* Left Column: Gallery */}
        <div className="lg:w-1/2 mb-8 lg:mb-0 sticky top-0 self-start">
          <ServiceGallery
            images={
              (serviceDetail.ServiceImages || []).map(
                (img) => img?.image_path || "/fallback.png"
              ) || ["/fallback.png"]
            }
          />
        </div>
        <div className="lg:w-1/2 space-y-8">
          <div className="bg-card rounded-[4px] p-6 lg:p-8 border">
            <ServiceInfo
              title={serviceDetail.Service?.name}
              description={serviceDetail.description}
              price={serviceDetail.rate}
              currency="Rs."
            />
          </div>

          {/* Schedule (grouped by day) */}
          {schedules.length > 0 && (
            <div className="border rounded-[4px]">
              <h3 className="text-lg font-semibold p-4 border-b">Available Schedule</h3>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(() => {
                  const grouped = schedules.reduce((acc, s) => {
                    const day = s.day || "Unknown";
                    acc[day] = acc[day] || [];
                    acc[day].push({ id: s.id, start: s.start_time, end: s.end_time });
                    return acc;
                  }, {});

                  const entries = Object.entries(grouped);

                  return entries.map(([day, slots]) => {
                    const sorted = slots.slice().sort((a, b) => (a.start || "").localeCompare(b.start || ""));
                    return (
                      <div key={day} className="p-3 border rounded-[4px]">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-gray-800">{day}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {sorted.map((slot) => (
                            <div key={slot.id} className="px-3 py-1 bg-gray-50 rounded-full text-sm text-gray-700 border">
                              {formatTime(slot.start)} - {formatTime(slot.end)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Packages */}
          {serviceDetail.Packages?.length > 0 && (
            <div className="bg-card rounded-[4px] p-6 lg:p-8 border">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Packages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PackageContent packages = {serviceDetail.Packages || []}/>
              </div>
            </div>
          )}
          {serviceDetail.ServiceLocations?.length > 0 && (
            <div className="bg-card rounded-[4px] p-6 lg:p-8 border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FaMapPin className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">Service Locations</h2>
              </div>
              <div className="space-y-4 mb-6">
                {serviceDetail.ServiceLocations.map((location) => (
                  <div
                    key={location.id}
                    className="p-4 bg-muted/50 rounded-lg border border-border"
                  >
                    <h3 className="font-semibold text-foreground mb-1">{location.name}</h3>
                    <p className="text-muted-foreground text-sm">{location.address}</p>
                  </div>
                ))}
              </div>
              <div className="w-full h-64 rounded-[4px] overflow-hidden bg-muted">
                <ServiceLocationMap locations={serviceDetail.ServiceLocations} />
              </div>
            </div>
          )}
          {(includes.length > 0 || notes) && (
            <div className="bg-card rounded-[4px] p-6 lg:p-8 border">
              {includes.length > 0 && (
                <>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">What's Included</h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                    {includes.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="mt-1 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {notes && (
                <div className="pt-6 border-t border-border">
                  <h3 className="font-semibold text-foreground mb-3">Important Notes</h3>
                  <p className="text-muted-foreground leading-relaxed">{notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
