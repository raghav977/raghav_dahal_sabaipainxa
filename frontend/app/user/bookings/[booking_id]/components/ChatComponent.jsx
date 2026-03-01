"use client";

import React, { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { connectSocketConnection } from "@/helper/socket";
import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token";
import { string } from "yup";

export default function ChatComponent({ bookingId, bookingOwnerId, currentUserId, socketRef }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [bidAmount, setBidAmount] = useState("");
  const [isRoomClosed, setIsRoomClosed] = useState(false);
  const token = getTokenFromLocalStorage("token")
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken")
  const [hasAcceptedBid, setHasAcceptedBid] = useState(false);


  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  const listRef = useRef(null);
  // allow parent to pass a shared socketRef, otherwise use an internal one
  const internalSocketRef = useRef(null);
  const socketRefToUse = socketRef ?? internalSocketRef;

  useEffect(() => {
    console.log("this is socketref", socketRefToUse);
    if (!socketRefToUse.current) {
      const socket = connectSocketConnection();
      socketRefToUse.current = socket;
    }
  }, []);

  // track connection state for debugging / UI
  const [socketConnected, setSocketConnected] = useState(false);
  useEffect(() => {
    const s = socketRefToUse.current;
    if (!s) return;
    const onConnect = () => {
      console.log("Socket connected (chat):", s.id, "auth:", s.auth || s.io?.opts?.auth);
      setSocketConnected(true);
    };
    const onDisconnect = () => {
      console.log("Socket disconnected (chat)");
      setSocketConnected(false);
    };
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    // If already connected
    if (s.connected) onConnect();
    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, [socketRefToUse.current]);
  useEffect(() => {
    if (!bookingId) return;
    const fetchBids = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/bids/user/bids?bookingId=${bookingId}`,
          {
            headers: { Authorization: `Bearer ${token}` },

          }
        );
        const data = await res.json();
        if (Array.isArray(data.message)) {
          setChatMessages(data.message);
          // Check if any bid has been accepted
          const hasAccepted = data.message.some(msg => msg.status === "accepted");
          setHasAcceptedBid(hasAccepted);
          if (hasAccepted) {
            setIsRoomClosed(true);
          }
        }
      } catch (err) {
        console.error("Error fetching bids:", err);
      }
    };

    fetchBids();

    // Also fetch booking status so we can block the room if the booking/service was cancelled
    const fetchBookingStatus = async () => {
      try {
        const resp = await fetch(`${BASE_URL}/api/booking/get-booking-status/${bookingId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-refresh-token": refreshToken,
          },
        });
        const json = await resp.json();
        if (json?.status === "success") {
          const booking = json.data?.booking;
          if (booking && booking.status === "cancelled") {
            setIsRoomClosed(true);
            toast.info("This booking has been cancelled. Bidding is closed.");
          }
        }
      } catch (err) {
        console.error("Error fetching booking status:", err);
      }
    };

    fetchBookingStatus();
  }, [bookingId]);

  // 3️⃣ Join socket room + listeners
  useEffect(() => {
    const socket = socketRefToUse.current;
    console.log("Socket in booking chat useEffect:", socket);
    if (!socket || !bookingId) {
      console.log("here it is")
      return;
    } 
      


    const joinRoom = () => {

      socket.emit("join-booking-room", { bookingId });
      console.log(`Joined room booking-${bookingId}`);
    };

    if (socket.connected) joinRoom();
    else socket.on("connect", joinRoom);

    // Socket event handlers
    const handleNewBid = (newBid) => {
      
      setChatMessages((prev) => {
        if (!prev.find((m) => m.id === newBid.id)) return [...prev, newBid];
        return prev;
      });
    };

    const handleBidAccepted = ({ bid }) => {
      
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === bid.id
            ? { ...m, status: "accepted" }
            : { ...m, status: "rejected" }
        )
      );
      setHasAcceptedBid(true);
      toast.success(`Bid Rs.${bid.bidAmount} accepted!`);
      setIsRoomClosed(true);
    };

    const handleBidRejected = ({ bid }) => {
      setChatMessages((prev) =>
        prev.map((m) => (m.id === bid.id ? { ...m, status: "rejected" } : m))
      );
      toast.info(`Bid Rs.${bid.bidAmount} rejected!`);
    };

    const handleBookingUpdated = ({ bookingId: bId, status }) => {
      try {
        // Only react if the update is for this booking
        if (String(bId) === String(bookingId) && String(status).toLowerCase() === "cancelled") {
          setIsRoomClosed(true);
          toast.info("This booking has been cancelled. Bidding is closed.");
        }
      } catch (err) {
        console.error("Error handling booking-updated:", err);
      }
    };

    const handleError = (err) => {
      toast.error(err.message || "Socket error");
    };

    // Attach listeners
    socket.on("new-bid", handleNewBid);
    socket.on("bid-accepted", handleBidAccepted);
    socket.on("bid-rejected", handleBidRejected);
  socket.on("booking-updated", handleBookingUpdated);
    socket.on("error", handleError);

    // Cleanup
    return () => {
      socket.off("connect", joinRoom);
      socket.off("new-bid", handleNewBid);
      socket.off("bid-accepted", handleBidAccepted);
      socket.off("bid-rejected", handleBidRejected);
      socket.off("booking-updated", handleBookingUpdated);
      socket.off("error", handleError);
    };
  }, [bookingId]);


  useEffect(() => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [chatMessages]);


  const handleBidSubmit = () => {
    const amount = parseFloat(bidAmount);
    const socket = socketRefToUse.current;
    if(amount<=0){
      toast.error("Bid amount must be greater than zero.");
      return;
    }
   if(String(amount).length>=8){
    toast.error("Bid must be less than 8 digits")
    return;
   }
    console.log("the socket is connected", socket?.connected);
    if (!amount || isRoomClosed || !socket?.connected) return;

    socket.emit("place-bid", { bookingId, bidAmount: amount });
    setBidAmount("");
  };

  // 6️⃣ Accept/Reject bids
  const handleAcceptBid = (bidId) => {
    const socket = socketRefToUse.current;
    if (!socket?.connected) return;
    console.log("emit accept-bid", { bidId, bookingId });
    socket.emit("accept-bid", { bidId, bookingId });
  };

  const handleRejectBid = (bidId) => {
    const socket = socketRefToUse.current;
    if (!socket?.connected) return;
    console.log("emit reject-bid", { bidId, bookingId });
    socket.emit("reject-bid", { bidId, bookingId });
  };

  // Helper for avatar initials
  const getAvatarLetter = (name) =>
    name ? name.charAt(0).toUpperCase() : "?";

  return (
    <div className="bg-white">
      <ToastContainer />

      {/* Chat area */}
      <div
        ref={listRef}
        className="space-y-3 max-h-[400px] overflow-y-auto border border-gray-200 rounded-[4px] p-4 bg-gray-50"
      >
        {chatMessages.map((msg) => {
          const isOwnMessage = msg.user?.id === currentUserId;
          const avatarLetter = getAvatarLetter(msg.user?.name);

          return (
            <div
              key={msg.id}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              {!isOwnMessage && (
                <div className="mr-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-semibold text-white">
                    {avatarLetter}
                  </div>
                </div>
              )}

              <div
                className={`max-w-[75%] p-3 rounded-[4px] ${
                  isOwnMessage
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-white text-gray-900 rounded-bl-none border border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className={`font-semibold ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>Rs. {msg.bidAmount}</div>

                  {msg.status === "pending" &&
                    currentUserId !== msg.user.id &&
                    !isRoomClosed && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptBid(msg.id)}
                          className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-[4px] hover:bg-green-600 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectBid(msg.id)}
                          className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-[4px] hover:bg-red-600 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                  {msg.status !== "pending" && (
                    <div
                      className={`text-xs capitalize px-2 py-1 rounded-[4px] font-semibold ${
                        msg.status === "accepted"
                          ? "bg-green-100 text-green-700"
                          : msg.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {msg.status}
                    </div>
                  )}
                </div>

                <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleString()}
                </div>
              </div>

              {isOwnMessage && (
                <div className="ml-3">
                  <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700">
                    {avatarLetter}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!isRoomClosed && !hasAcceptedBid && (
        <div className="mt-6 flex gap-2">
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="Enter your bid amount..."
            className="border border-gray-300 p-3 rounded-[4px] w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => e.key === "Enter" && handleBidSubmit()}
          />
          <button
            onClick={handleBidSubmit}
            className="bg-blue-500 text-white px-6 py-3 rounded-[4px] hover:bg-blue-600 transition-colors font-semibold whitespace-nowrap"
          >
            Send Bid
          </button>
        </div>
      )}
      {(isRoomClosed || hasAcceptedBid) && (
        <div className="mt-6 text-center p-4 bg-green-50 border border-green-200 rounded-[4px]">
          <div className="text-green-700 font-medium">
            {hasAcceptedBid ? "Bid Accepted!" : "Bidding Closed"}
          </div>
          <div className="text-green-600 text-sm mt-1">
            {hasAcceptedBid 
              ? "A bid has been accepted. No further bidding is allowed." 
              : "Bidding is no longer available for this booking."
            }
          </div>
        </div>
      )}
    </div>
  );
}
