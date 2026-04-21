"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { aboutUser } from "@/app/redux/slices/authSlice";
import { io } from "socket.io-client";
import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token";

import ChatComponent from "@/app/user/bookings/[booking_id]/components/ChatComponent";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FaClock, FaUser, FaFileAlt, FaExchangeAlt } from "react-icons/fa";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function MyBookings() {
  const token = getTokenFromLocalStorage("token");
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
  const dispatch = useDispatch();

  const authState = useSelector((state) => state.auth);
  const userData = authState?.user?.user || authState?.user;
  const PROVIDER_ID = userData?.id;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [messages, setMessages] = useState([]);
  const [socketRef, setSocketRef] = useState(null);

  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // 🧠 Load user info
  useEffect(() => {
    if (!PROVIDER_ID) dispatch(aboutUser());
  }, [dispatch, PROVIDER_ID]);

  useEffect(() => {
    console.log("this is selected booking", selectedBooking);
  }, [selectedBooking]);
  // 📦 Fetch bookings
  useEffect(() => {
    if (!PROVIDER_ID) return;

    const fetchBookings = async () => {
      setLoading(true);
      try {
        const base = `${BASE_URL}/api/booking/provider`;
        let backendStatus =
          selectedStatus === "confirmed" ? "accepted" : selectedStatus;
        const url =
          backendStatus && backendStatus !== "all"
            ? `${base}?status=${encodeURIComponent(backendStatus)}`
            : base;

        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-refresh-token": refreshToken,
          },
        });
        const data = await res.json();
        setBookings(data.results || []);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [PROVIDER_ID, selectedStatus]);

  useEffect(() => {
    if (!selectedBooking) return;

    const fetchBids = async () => {
      try {
        console.log("this is token and refresh token",token,refreshToken)
        const res = await fetch(
          `${BASE_URL}/api/bids/user/bids?bookingId=${selectedBooking.id}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "x-refresh-token": refreshToken,
            },
          }
        );
        const data = await res.json();
        if (Array.isArray(data.message)) {
          setMessages(data.message);
        }
      } catch (err) {
        console.error("Error fetching bids:", err);
      }
    };

    fetchBids();
    
    const socket = io(`${BASE_URL}`, {
      query: { token, refreshToken },
      transports: ["websocket"],
    });
    setSocketRef(socket);

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("join-booking-room", { bookingId: selectedBooking.id });
    });

    socket.on("new-bid", (bid) => {
      console.log("Received new bid:", bid);
      setMessages((prev) => [...prev, bid.bid || bid]);
    });

    socket.on("bid-accepted", (bid) => {
      setMessages((prev) =>
        prev.map((b) => (b.id === bid.id ? { ...b, status: "accepted" } : b))
      );
    });

    socket.on("bid-rejected", (bid) => {
      setMessages((prev) =>
        prev.map((b) => (b.id === bid.id ? { ...b, status: "rejected" } : b))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedBooking]);

  const handleMarkAsComplete = async (id) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/booking/mark-as-complete/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`,
            "x-refresh-token": refreshToken,
          },
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.status === "success") {
        // Update the selected booking with the new data
        setSelectedBooking((prev) => ({
          ...prev,
          providerCompleted: true,
        }));
        
        // Refresh the bookings list
        setBookings((prev) =>
          prev.map((b) =>
            b.id === id ? { ...b, providerCompleted: true } : b
          )
        );
        
        alert("✅ Booking marked as complete! Waiting for client confirmation.");
      } else {
        alert("❌ " + (data.message || "Failed to mark as complete"));
      }
    } catch (err) {
      console.error("Error marking as complete:", err);
      alert("❌ An error occurred while marking as complete");
    }
  };


  if (!PROVIDER_ID) {
    return (
      <main className="px-6 py-8">
        <h1 className="text-xl text-gray-700 font-semibold">
          Loading user info...
        </h1>
      </main>
    );
  }

  return (
    <main className="px-6 py-8">
      <h1 className="text-2xl font-bold mb-6  text-gray-900">My Bookings</h1>
      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm text-gray-600">Filter:</label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border px-3 py-2 rounded-[4px]"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      {loading ? (
        <p>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p className="text-gray-500">No bookings found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => {
            const service =
              booking.ServiceProviderService?.Service?.name ||
              "Unknown Service";
            const client = booking.user?.name || "Unknown User";
            const provider =
              booking.ServiceProviderService?.ServiceProvider?.User?.name ||
              "Unknown Provider";
            const packageName = booking.Package?.name || "No Package";
            const price =
              booking.Package?.price ||
              booking.ServiceProviderService?.rate ||
              "N/A";
            const firstBid = booking.Bids?.[0]?.bidAmount;
            const status = booking.status;
            const createdAt = new Date(booking.createdAt).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              }
            );

            const formatTime = (time) => {
              if (!time) return "";
              const [hour, minute] = time.split(":");
              const hourNum = parseInt(hour);
              const ampm = hourNum >= 12 ? "PM" : "AM";
              const formattedHour = hourNum % 12 || 12;
              return `${formattedHour}:${minute.padStart(2, '0')} ${ampm}`;
            };

            return (
              <Card
                key={booking.id}
                className="rounded-[4px] border border-gray-200 bg-white cursor-pointer hover:border-gray-300 transition-colors duration-200"
                onClick={() => setSelectedBooking(booking)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FaFileAlt className="w-5 h-5 text-indigo-600" />
                      {service}
                    </CardTitle>
                    <Badge
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : status === "confirmed" || status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {status}
                    </Badge>
                    <div className="text-sm text-gray-500">
                      Payment: {booking.PaymentActual?.status || "No Payment Info"}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 pt-1">
                    ID: #{booking.id}
                  </p>
                  {/* Completion Status Indicator */}
                  {status === "confirmed" && (
                    <div className="mt-2 flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        {booking.clientCompleted ? (
                          <span className="text-green-600 font-medium">✓ Client completed</span>
                        ) : (
                          <span className="text-amber-600 font-medium">○ Client pending</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {booking.providerCompleted ? (
                          <span className="text-green-600 font-medium">✓ You completed</span>
                        ) : (
                          <span className="text-amber-600 font-medium">○ You pending</span>
                        )}
                      </div>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center text-base text-gray-700">
                    <FaUser className="w-4 h-4 mr-3 text-gray-500" />
                    <span className="font-medium">{client}</span>
                  </div>

                  {/* Contact & location (only shown when backend exposes them) */}
                  <div className="flex items-center text-sm text-gray-600 gap-3">
                    {booking.contact_number ? (
                      <a href={`tel:${booking.contact_number}`} className="flex items-center gap-2 text-gray-800 hover:text-green-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h2l2 5 4 1 5-2 3 3v4a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" /></svg>
                        <span>{booking.contact_number}</span>
                      </a>
                    ) : (
                      <div className="text-sm text-gray-400">Contact hidden until payment completes</div>
                    )}

                    {booking.lat && booking.lng ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${booking.lat},${booking.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-gray-700 hover:text-green-700"
                      >
                        View Location
                      </a>
                    ) : (
                      <div className="text-sm text-gray-400">Location hidden until payment completes</div>
                    )}
                  </div>

                  <div className="flex items-center text-base text-gray-700">
                    <FaClock className="w-4 h-4 mr-3 text-gray-500" />
                    <span>
                      {booking.ServiceSchedule?.day_of_week},{" "}
                      {formatTime(booking.ServiceSchedule?.start_time)} -{" "}
                      {formatTime(booking.ServiceSchedule?.end_time)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-base text-gray-700 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <FaExchangeAlt className="w-4 h-4 text-gray-500" />
                      {firstBid ? (
                        <span>
                          Bid: <strong className="font-bold">Rs.{firstBid}</strong>
                        </span>
                      ) : (
                        <span className="text-gray-500">No Bids</span>
                      )}
                    </div>

                    <div className="text-right text-base">
                      {/* <p className="font-bold text-gray-900">Rs.{price}</p> */}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-gray-500 pt-3 border-t bg-gray-50 rounded-b-[4px]">
                  <p>Booked on: {createdAt}</p>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      {selectedBooking && (
        <Dialog
          open={!!selectedBooking}
          onOpenChange={() => setSelectedBooking(null)}
        >
          <DialogContent className="max-w-3xl w-full">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaFileAlt className="w-6 h-6 text-indigo-500" />
                Booking #{selectedBooking.id} —{" "}
                {selectedBooking.ServiceProviderService?.Service?.name ||
                  "Service"}
              </DialogTitle>
            </DialogHeader>
            <ChatComponent
              bookingId={selectedBooking.id}
              currentUserId={PROVIDER_ID}
              messages={messages}
              socketRef={socketRef}
            />
            <div className="mt-4 mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Contact & Location</h3>
              <div className="text-sm text-gray-600">
                {selectedBooking.contact_number ? (
                  <div>
                    <span className="font-medium">Phone: </span>
                    <a href={`tel:${selectedBooking.contact_number}`} className="text-green-700 hover:underline">{selectedBooking.contact_number}</a>
                  </div>
                ) : (
                  <div className="text-gray-400">Contact hidden until payment completes</div>
                )}

                {selectedBooking.lat && selectedBooking.lng ? (
                  <div>
                    <span className="font-medium">Location: </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedBooking.lat},${selectedBooking.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-green-700 hover:underline"
                    >
                      Open in Maps
                    </a>
                  </div>
                ) : (
                  <div className="text-gray-400">Location hidden until payment completes</div>
                )}
              </div>
            </div>

            {/* Completion Status Section */}
            {selectedBooking.status === "confirmed" && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Completion Status</h3>
                <div className="space-y-3">
                  {/* Client Completed Status */}
                  <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="text-sm">
                        <p className="font-medium text-gray-700">Client Completed</p>
                        <p className="text-xs text-gray-500">Service received and verified</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedBooking.clientCompleted ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">Yes</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">No</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Provider Completed Status */}
                  <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="text-sm">
                        <p className="font-medium text-gray-700">You Completed</p>
                        <p className="text-xs text-gray-500">Service delivered</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedBooking.providerCompleted ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">Yes</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">No</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Message */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                    <p className="font-medium">💡 How it works:</p>
                    <p className="mt-1">Both client and provider must mark as complete for the admin to release payment. This ensures service quality.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4 gap-3">
              {selectedBooking.status === "confirmed" && (
                <Button
                  onClick={() => handleMarkAsComplete(selectedBooking.id)}
                  disabled={selectedBooking.providerCompleted}
                  className={`${
                    selectedBooking.providerCompleted
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {selectedBooking.providerCompleted ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Marked Complete
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Mark as Complete
                    </>
                  )}
                </Button>
              )}
              {selectedBooking.status !== "confirmed" && (
                <Button variant="outline" disabled className="cursor-not-allowed">
                  Awaiting Acceptance
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
