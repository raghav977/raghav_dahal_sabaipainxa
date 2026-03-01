"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "../../../../helper/token";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export default function RightResult({ filters }) {
  const token = getTokenFromLocalStorage("token");
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();


      if (filters.name) params.set("search", filters.name);
      if (filters.priceMin) params.set("minPrice", filters.priceMin);
      if (filters.priceMax) params.set("maxPrice", filters.priceMax);

      if (filters.location?.latitude && filters.location?.longitude) {
        params.set("latitude", filters.location.latitude);
        params.set("longitude", filters.location.longitude);
        params.set("radius", filters.radius || 50);
      }

      const res = await fetch(`${BACKEND_URL}/api/rooms/all?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        },
      });
      const data = await res.json();
      if (data.success) setRooms(data.results);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const debounceMs = 400;
    const handler = setTimeout(() => {
      fetchRooms();
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [filters]);

  if (loading) return <Loading />;

  if (!rooms.length)
    return <p className="text-gray-500 text-center mt-10">No rooms found.</p>;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => (
        <div
          key={room.id}
          className="border rounded-[4px] p-3 bg-white shadow-sm hover:shadow-md transition cursor-pointer"
          onClick={() => router.push(`/find-a-room/${room.id}`)} 
        >
          <img
            src={`${BACKEND_URL}${room.RoomImages?.[0]?.image_path || "/placeholder.jpg"}`}
            alt={room.name}
            className="rounded-[4px] w-full h-40 object-cover"
          />
          <h3 className="text-lg font-medium mt-2">{room.name}</h3>
          <p className="text-sm text-gray-600">Rs {room.price}</p>
        </div>
      ))}
    </div>
  );
}
