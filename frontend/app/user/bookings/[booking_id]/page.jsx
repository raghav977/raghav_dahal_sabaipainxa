"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import HeaderNavbar from "@/app/landingpagecomponents/components/HeaderNavbar";

import Cookie from "@/app/user/bookings/[booking_id]/components/Cookie";
import Leftpage from "./components/Left";
import Rightpage from "./components/Right";

import {getTokenFromLocalStorage,getRefreshTokenFromLocalStorage} from "@/helper/token";
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL 

export default function NegotiationPage() {
  const { booking_id } = useParams();
  const [bookingExists, setBookingExists] = useState(null); 

  const token = getTokenFromLocalStorage("token");
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/bids/user/bids?bookingId=${booking_id}`,
          { 
            headers: {
              "Content-Type": "application/json",
              'Authorization': `Bearer ${token}`,
              'x-refresh-token': refreshToken,
            },
          }
        );
        const data = await response.json();

        if (data.status === "success" && data.data?.length) {
          setBookingExists(true);
        } else {
          setBookingExists(false);
        }
      } catch (err) {
        console.error(err);
        setBookingExists(false);
      }
    };
    fetchData();
  }, [booking_id]);

  if (bookingExists === null) {
    return <div className="text-center py-20">Loading…</div>;
  }

  if (bookingExists === false) {
    return (
      <div className="text-center py-20 text-red-600">
        Booking #{booking_id} not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderNavbar />
      <div className="max-w-6xl mx-auto p-4 mt-18">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Details</h1>
          <p className="text-sm text-gray-600">Booking ID: #{booking_id}</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Leftpage bookingId={booking_id} />
          <Rightpage bookingId={booking_id} />
        </div>
      </div>
    </div>
  );
}
